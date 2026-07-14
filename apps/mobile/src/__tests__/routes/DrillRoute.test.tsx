import { act, fireEvent, render } from '@testing-library/react-native';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
};
const mockUseLocalSearchParams = jest.fn();
const mockUseHomeVault = jest.fn();
const mockNavigateBackOrReplace = jest.fn();
const mockWriteDrillHistoryEntry = jest.fn();

jest.mock('expo-router', () => ({
  router: mockRouter,
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock('../../context/HomeVaultContext', () => ({
  useHomeVault: () => mockUseHomeVault(),
}));

jest.mock('../../utils/navigation', () => ({
  navigateBackOrReplace: (...args: unknown[]) => mockNavigateBackOrReplace(...args),
}));

jest.mock('../../utils/drillHistoryStorage', () => ({
  writeDrillHistoryEntry: (...args: unknown[]) => mockWriteDrillHistoryEntry(...args),
}));

jest.mock('../../screens/DrillRunnerScreen', () => ({
  DrillRunnerScreen: ({
    onBack,
    onComplete,
    onOpenTarget,
    scenario,
  }: {
    onBack: () => void;
    onComplete?: (summary: unknown) => void;
    onOpenTarget: (target: unknown) => void;
    scenario: { title: string; steps: Array<{ resources: Array<{ target: unknown }> }> };
  }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <>
        <Text>{scenario.title}</Text>
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Text>drill back</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            onComplete?.({
              blockedCount: 0,
              completedAt: '2026-07-10T12:00:00.000Z',
              confusingCount: 1,
              missingRecordCount: 0,
              outcome: 'pass_with_follow_up',
              reviewNeededCount: 1,
            })
          }
        >
          <Text>finish drill</Text>
        </Pressable>
        {scenario.steps[0]?.resources[0] ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpenTarget(scenario.steps[0].resources[0].target)}
          >
            <Text>open drill target</Text>
          </Pressable>
        ) : null}
      </>
    );
  },
}));

jest.mock('../../components/MissingRecordView', () => ({
  MissingRecordView: ({
    actionLabel,
    onActionPress,
    title,
  }: {
    actionLabel: string;
    onActionPress: () => void;
    title: string;
  }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <>
        <Text>{title}</Text>
        <Pressable accessibilityRole="button" onPress={onActionPress}>
          <Text>{actionLabel}</Text>
        </Pressable>
      </>
    );
  },
}));

const DrillRoute = require('../../../app/drill/[id]').default;

function buildHomeVaultContext() {
  return {
    appData: {
      property: {
        id: 'property-1',
        householdId: 'household-1',
        label: 'Home',
        type: 'single_family' as const,
      },
      rooms: [],
      assets: [],
      documents: [],
      accessItems: [
        {
          id: 'access-lockbox',
          propertyId: 'property-1',
          category: 'lockbox' as const,
          label: 'Front porch lockbox',
          location: 'Porch light',
          linkedDocumentIds: [],
        },
      ],
      emergencyContacts: [],
      importantAccounts: [],
      continuityPlaybooks: [],
      tasks: [],
      taskCompletions: [],
      repairEvents: [],
      parts: [],
      assetCount: 0,
      roomCount: 0,
      documentCount: 0,
      activeTaskCount: 0,
      healthScore: null,
      dueTasks: [],
      recentAssets: [],
      recentActivity: [],
      savedCostLabel: '$0',
    },
    showToast: jest.fn(),
  };
}

describe('DrillRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHomeVault.mockReturnValue(buildHomeVaultContext());
    mockUseLocalSearchParams.mockReturnValue({ id: 'guide-home-lockout' });
  });

  it('opens supported drills and routes linked drill targets', async () => {
    const { getByText } = await render(<DrillRoute />);

    expect(getByText('Home lockout recovery')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('open drill target'));
    });
    await act(async () => {
      fireEvent.press(getByText('drill back'));
    });
    await act(async () => {
      fireEvent.press(getByText('finish drill'));
    });

    expect(mockRouter.push).toHaveBeenCalledWith('/access/access-lockbox');
    expect(mockNavigateBackOrReplace).toHaveBeenCalledWith('/playbook/guide-home-lockout');
    expect(mockWriteDrillHistoryEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        propertyId: 'property-1',
        guideId: 'guide-home-lockout',
        title: 'Home lockout recovery',
        outcome: 'pass_with_follow_up',
      }),
    );
  });

  it('shows a fallback when a playbook does not support drills yet', async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: 'guide-insurance-incident' });

    const { getByText } = await render(<DrillRoute />);

    expect(getByText('Drill not available yet')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('Back to playbook'));
    });

    expect(mockRouter.replace).toHaveBeenCalledWith('/playbook/guide-insurance-incident');
  });
});
