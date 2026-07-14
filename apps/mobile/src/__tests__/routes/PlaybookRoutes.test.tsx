import { fireEvent, render } from '@testing-library/react-native';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockContinuityPlaybookDetailScreen = jest.fn();
const mockUseLocalSearchParams = jest.fn();
const mockUseHomeVault = jest.fn();

jest.mock('expo-router', () => ({
  router: mockRouter,
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock('../../context/HomeVaultContext', () => ({
  useHomeVault: () => mockUseHomeVault(),
}));

jest.mock('../../screens/ContinuityPlaybookDetailScreen', () => ({
  ContinuityPlaybookDetailScreen: ({
    canStartIncidentWorkspace,
    canRunDrill,
    guide,
    onBack,
    onOpenIncidentWorkspace,
    onOpenTarget,
    onRunDrill,
  }: {
    canStartIncidentWorkspace?: boolean;
    canRunDrill?: boolean;
    guide: {
      title: string;
      readyRecords: Array<{ target: unknown }>;
      missingRecords: Array<{ target: unknown }>;
    };
    onBack: () => void;
    onOpenIncidentWorkspace?: () => void;
    onOpenTarget: (target: unknown) => void;
    onRunDrill?: () => void;
  }) => {
    mockContinuityPlaybookDetailScreen({
      canStartIncidentWorkspace,
      canRunDrill,
      guide,
      onBack,
      onOpenIncidentWorkspace,
      onOpenTarget,
      onRunDrill,
    });
    const { Pressable, Text } = require('react-native');

    return (
      <>
        <Text>{guide.title}</Text>
        {guide.readyRecords[0] ? (
          <Pressable accessibilityRole="button" onPress={() => onOpenTarget(guide.readyRecords[0].target)}>
            <Text>open ready</Text>
          </Pressable>
        ) : null}
        {guide.readyRecords[2] ? (
          <Pressable accessibilityRole="button" onPress={() => onOpenTarget(guide.readyRecords[2].target)}>
            <Text>open ready export</Text>
          </Pressable>
        ) : null}
        {guide.missingRecords[0] ? (
          <Pressable accessibilityRole="button" onPress={() => onOpenTarget(guide.missingRecords[0].target)}>
            <Text>open missing</Text>
          </Pressable>
        ) : null}
        {canRunDrill ? (
          <Pressable accessibilityRole="button" onPress={onRunDrill}>
            <Text>run drill</Text>
          </Pressable>
        ) : null}
        {canStartIncidentWorkspace ? (
          <Pressable accessibilityRole="button" onPress={onOpenIncidentWorkspace}>
            <Text>start incident workspace</Text>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Text>trigger back</Text>
        </Pressable>
      </>
    );
  },
}));

jest.mock('../../components/MissingRecordView', () => ({
  MissingRecordView: ({
    actionLabel,
    onActionPress,
  }: {
    actionLabel: string;
    onActionPress: () => void;
  }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <Pressable accessibilityRole="button" onPress={onActionPress}>
        <Text>{actionLabel}</Text>
      </Pressable>
    );
  },
}));

const PlaybookDetailRoute = require('../../../app/playbook/[id]').default;

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
      assets: [
        {
          id: 'asset-router',
          propertyId: 'property-1',
          name: 'Main Wi-Fi router',
          category: 'Networking',
          status: 'ready' as const,
          roomName: 'Office',
          documentCount: 1,
          lastServiceLabel: 'Never',
          nextTaskLabel: 'No open tasks',
          warrantyExpiringSoon: false,
        },
      ],
      documents: [],
      accessItems: [
        {
          id: 'access-1',
          propertyId: 'property-1',
          category: 'router' as const,
          label: 'Router admin',
          linkedAssetId: 'asset-router',
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
  };
}

describe('playbook routes', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHomeVault.mockReturnValue(buildHomeVaultContext());
    mockUseLocalSearchParams.mockReturnValue({ id: 'guide-internet-outage' });
    mockRouter.canGoBack.mockReturnValue(false);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((message?: unknown) => {
      if (
        typeof message === 'string' &&
        message.includes('overlapping act() calls')
      ) {
        return;
      }

      if (
        typeof message === 'string' &&
        message.includes('The current testing environment is not configured to support act')
      ) {
        return;
      }
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('opens linked records and missing setup actions from the guide route', async () => {
    await render(<PlaybookDetailRoute />);

    const props = mockContinuityPlaybookDetailScreen.mock.calls.at(-1)?.[0];

    expect(props?.guide.title).toBe('Internet outage recovery');

    props?.onOpenTarget(props.guide.readyRecords[0].target);
    props?.onOpenTarget(props.guide.missingRecords[0].target);
    props?.onBack();

    expect(mockRouter.push).toHaveBeenNthCalledWith(1, '/access/access-1');
    expect(mockRouter.push).toHaveBeenNthCalledWith(2, {
      pathname: '/account/new',
      params: { kind: 'internet' },
    });
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/emergency');
  });

  it('routes export-focused playbook targets to the emergency packet tools', async () => {
    mockUseHomeVault.mockReturnValue({
      appData: {
        ...buildHomeVaultContext().appData,
        documents: [
          {
            id: 'document-policy',
            propertyId: 'property-1',
            title: 'Prairie Mutual home policy',
            type: 'insurance' as const,
            typeLabel: 'Insurance',
            linkedToLabel: 'Property',
            dateLabel: 'Jul 1, 2026',
            linkedRecords: [],
            linkedRecordIds: ['property-1'],
          },
        ],
        emergencyContacts: [
          {
            id: 'contact-1',
            propertyId: 'property-1',
            name: 'Jamie Lee',
            role: 'Neighbor',
            priority: 'primary' as const,
            phone: '555-0101',
          },
        ],
        importantAccounts: [
          {
            id: 'account-1',
            propertyId: 'property-1',
            kind: 'insurance' as const,
            providerName: 'Prairie Mutual',
            label: 'Home policy',
            linkedDocumentIds: ['document-policy'],
          },
        ],
      },
    });
    mockUseLocalSearchParams.mockReturnValue({ id: 'guide-insurance-incident' });

    await render(<PlaybookDetailRoute />);

    const props = mockContinuityPlaybookDetailScreen.mock.calls.at(-1)?.[0];

    expect(props?.guide.title).toBe('Insurance incident response');

    props?.onOpenTarget(props.guide.readyRecords[2].target);

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/export',
      params: { focus: 'packet' },
    });
  });

  it('opens the guided drill runner for supported playbooks', async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: 'guide-home-lockout' });

    await render(<PlaybookDetailRoute />);

    const props = mockContinuityPlaybookDetailScreen.mock.calls.at(-1)?.[0];

    expect(props?.canRunDrill).toBe(true);
    props?.onRunDrill?.();

    expect(mockRouter.push).toHaveBeenCalledWith('/drill/guide-home-lockout');
  });

  it('routes incident-capable playbooks into the incident workspace preview', async () => {
    await render(<PlaybookDetailRoute />);

    const props = mockContinuityPlaybookDetailScreen.mock.calls.at(-1)?.[0];

    expect(props?.canStartIncidentWorkspace).toBe(true);
    props?.onOpenIncidentWorkspace?.();

    expect(mockRouter.push).toHaveBeenCalledWith('/incident/guide-internet-outage');
  });
});
