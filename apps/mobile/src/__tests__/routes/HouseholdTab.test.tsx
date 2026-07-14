import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockRouter = {
  push: jest.fn(),
};
const mockUseHomeVault = jest.fn();

jest.mock('expo-router', () => ({
  router: mockRouter,
}));

jest.mock('../../context/HomeVaultContext', () => ({
  useHomeVault: () => mockUseHomeVault(),
}));

jest.mock('../../utils/printReport', () => ({
  printPropertySummary: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../data/localHomeVaultRepository', () => ({
  getHomeVaultRepository: jest.fn(),
}));

jest.mock('../../components/SampleModeNotice', () => ({
  SampleModeNotice: () => null,
}));

jest.mock('../../screens/HouseholdScreen', () => ({
  HouseholdScreen: ({
    onOpenSeasonalTrack,
    onShowGettingStarted,
    seasonalTracks,
    showGettingStartedAction,
  }: {
    onOpenSeasonalTrack?: (key: string) => void;
    onShowGettingStarted?: () => Promise<void>;
    seasonalTracks?: Array<{ key: string; label: string }>;
    showGettingStartedAction?: boolean;
  }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <>
        {showGettingStartedAction ? (
          <Pressable accessibilityRole="button" onPress={() => void onShowGettingStarted?.()}>
            <Text>Show getting started</Text>
          </Pressable>
        ) : (
          <Text>No getting started action</Text>
        )}
        {seasonalTracks?.[0] ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpenSeasonalTrack?.(seasonalTracks[0].key)}
          >
            <Text>{`Open ${seasonalTracks[0].label}`}</Text>
          </Pressable>
        ) : null}
      </>
    );
  },
}));

const HouseholdTab = require('../../../app/(tabs)/household').default;

function buildContext({
  accessItems = [],
  assets = [],
  emergencyContacts = [],
  importantAccounts = [],
  backupSummary = null,
}: {
  accessItems?: Array<{ category: 'wifi' | 'garage' }>;
  assets?: Array<{ category: string; name: string }>;
  backupSummary?: { updatedAt: string } | null;
  emergencyContacts?: Array<{ id: string }>;
  importantAccounts?: Array<{ kind: 'insurance' }>;
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
    backupSummary,
    restoreSummary: null,
    setRestoreSummary: jest.fn(),
    reload: jest.fn(),
    showToast: jest.fn(),
  };
}

describe('HouseholdTab getting started action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-10T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('opens readiness setup when guidance is reopened', async () => {
    mockUseHomeVault.mockReturnValue(
      buildContext({
        accessItems: [],
      }),
    );

    const { getByText } = await render(<HouseholdTab />);

    fireEvent.press(getByText('Show getting started'));

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/readiness-setup'));
  });

  it('does not show the restore action when setup is already complete', async () => {
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

    const { getByText } = await render(<HouseholdTab />);

    expect(getByText('No getting started action')).toBeTruthy();
  });

  it('opens the first active seasonal track from the household summary', async () => {
    mockUseHomeVault.mockReturnValue(
      buildContext({
        accessItems: [{ category: 'garage' }],
        assets: [{ category: 'Networking', name: 'Main Wi-Fi router' }],
        emergencyContacts: [{ id: 'contact-1' }],
        importantAccounts: [{ kind: 'insurance' }],
      }),
    );

    const { getByText } = await render(<HouseholdTab />);

    fireEvent.press(getByText('Open Storm season'));

    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/playbook/guide-storm-prep'));
  });
});
