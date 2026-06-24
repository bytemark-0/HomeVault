import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockRouter = {
  push: jest.fn(),
};
const mockUseHomeVault = jest.fn();
const mockRestoreSetupChecklist = jest.fn().mockResolvedValue(undefined);

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

jest.mock('../../utils/setupChecklist', () => {
  const actual = jest.requireActual('../../utils/setupChecklist');
  return {
    ...actual,
    restoreSetupChecklist: mockRestoreSetupChecklist,
  };
});

jest.mock('../../components/SampleModeNotice', () => ({
  SampleModeNotice: () => null,
}));

jest.mock('../../screens/HouseholdScreen', () => ({
  HouseholdScreen: ({
    onShowGettingStarted,
    showGettingStartedAction,
  }: {
    onShowGettingStarted?: () => Promise<void>;
    showGettingStartedAction?: boolean;
  }) => {
    const { Pressable, Text } = require('react-native');

    return showGettingStartedAction ? (
      <Pressable accessibilityRole="button" onPress={() => void onShowGettingStarted?.()}>
        <Text>Show getting started</Text>
      </Pressable>
    ) : (
      <Text>No getting started action</Text>
    );
  },
}));

const HouseholdTab = require('../../../app/(tabs)/household').default;

function buildContext({
  roomCount = 0,
  assetCount = 0,
  taskCount = 0,
  documentCount = 0,
  photoUri,
  backupSummary = null,
}: {
  roomCount?: number;
  assetCount?: number;
  taskCount?: number;
  documentCount?: number;
  photoUri?: string;
  backupSummary?: { updatedAt: string } | null;
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
  });

  it('restores the setup checklist and routes home when guidance is reopened', async () => {
    mockUseHomeVault.mockReturnValue(
      buildContext({
        roomCount: 1,
        assetCount: 0,
      }),
    );

    const { getByText } = await render(<HouseholdTab />);

    fireEvent.press(getByText('Show getting started'));

    await waitFor(() => expect(mockRestoreSetupChecklist).toHaveBeenCalledTimes(1));
    expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)');
  });

  it('does not show the restore action when setup is already complete', async () => {
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

    const { getByText } = await render(<HouseholdTab />);

    expect(getByText('No getting started action')).toBeTruthy();
  });
});
