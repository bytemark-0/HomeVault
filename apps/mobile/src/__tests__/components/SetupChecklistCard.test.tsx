import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { useHomeVault } from '../../context/HomeVaultContext';
import {
  dismissSetupChecklist,
  readSetupChecklistDismissed,
} from '../../utils/setupChecklist';

const mockRouter = {
  push: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: mockRouter,
}));

jest.mock('../../context/HomeVaultContext', () => ({
  useHomeVault: jest.fn(),
}));

jest.mock('../../utils/setupChecklist', () => {
  const actual = jest.requireActual('../../utils/setupChecklist');
  return {
    ...actual,
    dismissSetupChecklist: jest.fn().mockResolvedValue(undefined),
    readSetupChecklistDismissed: jest.fn().mockResolvedValue(false),
  };
});

const mockUseHomeVault = useHomeVault as jest.MockedFunction<typeof useHomeVault>;
const mockReadSetupChecklistDismissed = readSetupChecklistDismissed as jest.MockedFunction<
  typeof readSetupChecklistDismissed
>;
const mockDismissSetupChecklist = dismissSetupChecklist as jest.MockedFunction<
  typeof dismissSetupChecklist
>;
const SetupChecklistCard = require('../../components/SetupChecklistCard').SetupChecklistCard;

function buildContext({
  accessItems = [],
  assets = [],
  backupSummary = null,
  emergencyContacts = [],
  importantAccounts = [],
}: {
  accessItems?: Array<{ category: 'wifi' | 'garage' | 'insurance' | 'router' | 'other' }>;
  assets?: Array<{ category: string; name: string }>;
  backupSummary?: { updatedAt: string } | null;
  emergencyContacts?: Array<{ id: string }>;
  importantAccounts?: Array<{ kind: 'insurance' | 'utility' | 'other' }>;
}) {
  return {
    appData: {
      property: {
        id: 'property-1',
        householdId: 'household-1',
        label: 'Home',
        type: 'single_family' as const,
      },
      assetCount: assets.length,
      roomCount: 0,
      documentCount: 0,
      activeTaskCount: 0,
      healthScore: null,
      rooms: [],
      assets,
      dueTasks: [],
      recentAssets: [],
      recentActivity: [],
      savedCostLabel: '$0',
      documents: [],
      accessItems,
      emergencyContacts,
      importantAccounts,
      continuityPlaybooks: [],
      tasks: [],
      taskCompletions: [],
      repairEvents: [],
      parts: [],
    },
    isNewUser: false,
    isSampleMode: false,
    loadError: false,
    backupSummary,
    restoreSummary: null,
    toast: null,
    setBackupSummary: jest.fn(),
    setRestoreSummary: jest.fn(),
    reload: jest.fn(),
    enterSampleMode: jest.fn(),
    exitSampleMode: jest.fn(),
    finishOnboarding: jest.fn(),
    showToast: jest.fn(),
    dismissToast: jest.fn(),
  };
}

describe('SetupChecklistCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadSetupChecklistDismissed.mockResolvedValue(false);
    mockUseHomeVault.mockReturnValue(buildContext({}));
  });

  it('shows zero-state guidance with the first recommended action', async () => {
    const { getByText } = await render(<SetupChecklistCard />);

    await waitFor(() => expect(getByText('Readiness setup')).toBeTruthy());
    expect(getByText('0 of 5')).toBeTruthy();
    expect(getByText('Save Wi-Fi details')).toBeTruthy();

    fireEvent.press(getByText('Save Wi-Fi details'));
    expect(mockRouter.push).toHaveBeenCalledWith('/readiness-setup?step=wifi');
  });

  it('shows the next incomplete step for a partially configured home', async () => {
    mockUseHomeVault.mockReturnValue(
      buildContext({
        accessItems: [
          { category: 'wifi' },
          { category: 'garage' },
        ],
      }),
    );

    const { getByText } = await render(<SetupChecklistCard />);

    await waitFor(() => expect(getByText('2 of 5')).toBeTruthy());
    expect(getByText('Add an insurance account')).toBeTruthy();
  });

  it('hides itself when every setup step is complete', async () => {
    mockUseHomeVault.mockReturnValue(
      buildContext({
        accessItems: [
          { category: 'wifi' },
          { category: 'garage' },
        ],
        assets: [{ category: 'Network', name: 'Main Wi-Fi router' }],
        emergencyContacts: [{ id: 'contact-1' }],
        importantAccounts: [{ kind: 'insurance' }],
        backupSummary: { updatedAt: '2026-06-23T00:00:00.000Z' },
      }),
    );

    const { queryByText } = await render(<SetupChecklistCard />);

    await waitFor(() => expect(queryByText('Readiness setup')).toBeNull());
  });

  it('dismisses the checklist persistently', async () => {
    const { getByText, queryByText } = await render(<SetupChecklistCard />);

    await waitFor(() => expect(getByText('Readiness setup')).toBeTruthy());
    fireEvent.press(getByText('Dismiss'));

    await waitFor(() => expect(mockDismissSetupChecklist).toHaveBeenCalledTimes(1));
    expect(queryByText('Readiness setup')).toBeNull();
  });
});
