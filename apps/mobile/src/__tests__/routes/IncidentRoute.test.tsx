import { fireEvent, render } from '@testing-library/react-native';

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
};
const mockUseLocalSearchParams = jest.fn();
const mockUseHomeVault = jest.fn();
const mockNavigateBackOrReplace = jest.fn();
const mockIncidentWorkspaceScreen = jest.fn();

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

jest.mock('../../screens/IncidentWorkspaceScreen', () => ({
  IncidentWorkspaceScreen: (props: unknown) => {
    mockIncidentWorkspaceScreen(props);
    const { Pressable, Text } = require('react-native');
    const {
      documents,
      emergencyContacts,
      guide,
      onBack,
      onOpenTarget,
      onShared,
    } = props as {
      documents: Array<{ title: string }>;
      emergencyContacts: Array<{ name: string }>;
      guide: { title: string };
      onBack: () => void;
      onOpenTarget: (target: unknown) => void;
      onShared: (message: string) => void;
    };

    return (
      <>
        <Text>{guide.title}</Text>
        <Text>{documents[0]?.title}</Text>
        <Text>{emergencyContacts[0]?.name ?? 'No contacts'}</Text>
        <Pressable accessibilityRole="button" onPress={() => onOpenTarget({ kind: 'account', id: 'account-1' })}>
          <Text>open linked</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onShared('Incident summary shared.')}>
          <Text>share callback</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Text>Back</Text>
        </Pressable>
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

const IncidentRoute = require('../../../app/incident/[id]').default;

function buildHomeVaultContext() {
  return {
    appData: {
      property: {
        id: 'property-1',
        householdId: 'household-1',
        label: 'Oak Street home',
        type: 'single_family' as const,
      },
      rooms: [],
      assets: [],
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
      accessItems: [],
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

describe('IncidentRoute', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ id: 'guide-insurance-incident' });
    mockUseHomeVault.mockReturnValue(buildHomeVaultContext());
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

  it('builds the incident workspace from the guide and forwards actions', async () => {
    const context = buildHomeVaultContext();
    mockUseHomeVault.mockReturnValue(context);

    const { getByText } = await render(<IncidentRoute />);

    expect(getByText('Insurance incident response')).toBeTruthy();
    expect(getByText('Prairie Mutual home policy')).toBeTruthy();
    expect(getByText('Jamie Lee')).toBeTruthy();

    fireEvent.press(getByText('open linked'));
    fireEvent.press(getByText('share callback'));
    fireEvent.press(getByText('Back'));

    expect(mockRouter.push).toHaveBeenCalledWith('/account/account-1');
    expect(context.showToast).toHaveBeenCalledWith('Incident summary shared.');
    expect(mockNavigateBackOrReplace).toHaveBeenCalledWith('/playbook/guide-insurance-incident');
    expect(mockIncidentWorkspaceScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        documents: expect.arrayContaining([
          expect.objectContaining({ title: 'Prairie Mutual home policy' }),
        ]),
        emergencyContacts: expect.arrayContaining([
          expect.objectContaining({ name: 'Jamie Lee' }),
        ]),
        property: expect.objectContaining({ label: 'Oak Street home' }),
      }),
    );
  });
});
