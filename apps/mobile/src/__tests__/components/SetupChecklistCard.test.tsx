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
  assetCount = 0,
  backupSummary = null,
  documentCount = 0,
  photoUri,
  roomCount = 0,
  taskCount = 0,
}: {
  assetCount?: number;
  backupSummary?: { updatedAt: string } | null;
  documentCount?: number;
  photoUri?: string;
  roomCount?: number;
  taskCount?: number;
}) {
  return {
    appData: {
      property: {
        id: 'property-1',
        householdId: 'household-1',
        label: 'Home',
        type: 'single_family' as const,
        photoUri,
      },
      assetCount,
      roomCount,
      documentCount,
      activeTaskCount: taskCount,
      healthScore: null,
      rooms: [],
      assets: [],
      dueTasks: [],
      recentAssets: [],
      recentActivity: [],
      savedCostLabel: '$0',
      documents: [],
      tasks: Array.from({ length: taskCount }, (_, index) => ({ id: `task-${index}` })),
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

    await waitFor(() => expect(getByText('Getting started')).toBeTruthy());
    expect(getByText('0 of 6')).toBeTruthy();
    expect(getByText('Add a room or area')).toBeTruthy();

    fireEvent.press(getByText('Add a room or area'));
    expect(mockRouter.push).toHaveBeenCalledWith('/room/new');
  });

  it('shows the next incomplete step for a partially configured home', async () => {
    mockUseHomeVault.mockReturnValue(
      buildContext({
        roomCount: 1,
        assetCount: 1,
      }),
    );

    const { getByText } = await render(<SetupChecklistCard />);

    await waitFor(() => expect(getByText('2 of 6')).toBeTruthy());
    expect(getByText('Add a maintenance reminder')).toBeTruthy();
  });

  it('hides itself when every setup step is complete', async () => {
    mockUseHomeVault.mockReturnValue(
      buildContext({
        roomCount: 1,
        assetCount: 1,
        taskCount: 1,
        documentCount: 1,
        photoUri: 'file:///home.jpg',
        backupSummary: { updatedAt: '2026-06-23T00:00:00.000Z' },
      }),
    );

    const { queryByText } = await render(<SetupChecklistCard />);

    await waitFor(() => expect(queryByText('Getting started')).toBeNull());
  });

  it('dismisses the checklist persistently', async () => {
    const { getByText, queryByText } = await render(<SetupChecklistCard />);

    await waitFor(() => expect(getByText('Getting started')).toBeTruthy());
    fireEvent.press(getByText('Dismiss'));

    await waitFor(() => expect(mockDismissSetupChecklist).toHaveBeenCalledTimes(1));
    expect(queryByText('Getting started')).toBeNull();
  });
});
