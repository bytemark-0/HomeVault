import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockUseLocalSearchParams = jest.fn();
const mockUseHomeVault = jest.fn();
const mockConfirmLocalStepUp = jest.fn();
const mockCreateEncryptedItemShareBundle = jest.fn();
const mockGetItemShareSupportMessage = jest.fn();
const mockShareItemShareBundle = jest.fn();
const mockFormatHomeVaultItemShareBundle = jest.fn();
const mockNavigateBackOrReplace = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock('../../context/HomeVaultContext', () => ({
  useHomeVault: () => mockUseHomeVault(),
}));

jest.mock('../../utils/localStepUpAuth', () => ({
  confirmLocalStepUp: (...args: unknown[]) => mockConfirmLocalStepUp(...args),
}));

jest.mock('../../utils/navigation', () => ({
  navigateBackOrReplace: (...args: unknown[]) => mockNavigateBackOrReplace(...args),
}));

jest.mock('../../utils/itemShare', () => {
  const actual = jest.requireActual('../../utils/itemShare');

  return {
    ...actual,
    createEncryptedItemShareBundle: (...args: unknown[]) => mockCreateEncryptedItemShareBundle(...args),
    getItemShareSupportMessage: () => mockGetItemShareSupportMessage(),
    shareItemShareBundle: (...args: unknown[]) => mockShareItemShareBundle(...args),
  };
});

jest.mock('@homevault/export', () => {
  const actual = jest.requireActual('@homevault/export');

  return {
    ...actual,
    formatHomeVaultItemShareBundle: (...args: unknown[]) => mockFormatHomeVaultItemShareBundle(...args),
  };
});

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

jest.mock('../../screens/ItemShareScreen', () => ({
  ItemShareScreen: ({
    canExport,
    exportLabel,
    exportStatus,
    onExport,
    onPassphraseChange,
  }: {
    canExport: boolean;
    exportLabel: string;
    exportStatus: string | null;
    onExport: () => void;
    onPassphraseChange: (value: string) => void;
  }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <>
        <Pressable accessibilityRole="button" onPress={() => onPassphraseChange('super-secure')}>
          <Text>set passphrase</Text>
        </Pressable>
        <Text>{canExport ? 'ready to export' : 'not ready'}</Text>
        <Pressable accessibilityRole="button" onPress={onExport} disabled={!canExport}>
          <Text>{exportLabel}</Text>
        </Pressable>
        {exportStatus ? <Text>{exportStatus}</Text> : null}
      </>
    );
  },
}));

const ItemShareRoute = require('../../../app/share/item').default;

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
      assets: [
        {
          id: 'asset-router',
          propertyId: 'property-1',
          name: 'Main router',
          category: 'Network',
          status: 'ready' as const,
          roomName: 'Office',
          documentCount: 1,
          lastServiceLabel: 'Never',
          nextTaskLabel: 'No open tasks',
          warrantyExpiringSoon: false,
        },
      ],
      documents: [
        {
          id: 'document-router',
          propertyId: 'property-1',
          title: 'Router quick start',
          type: 'manual' as const,
          typeLabel: 'Manual',
          linkedToLabel: 'Main router',
          dateLabel: 'Jul 1, 2026',
          linkedRecordIds: ['asset-router'],
          linkedRecords: [],
        },
      ],
      accessItems: [
        {
          id: 'access-1',
          propertyId: 'property-1',
          category: 'wifi' as const,
          label: 'Main Wi-Fi',
          username: 'OakStreet-5G',
          accessCode: '9274',
          location: 'Office shelf label',
          instructions: 'Use the sticker under the router if the code changed.',
          linkedAssetId: 'asset-router',
          linkedDocumentIds: ['document-router'],
        },
      ],
      emergencyContacts: [],
      importantAccounts: [],
      continuityPlaybooks: [],
      tasks: [],
      taskCompletions: [],
      repairEvents: [],
      parts: [],
      assetCount: 1,
      roomCount: 0,
      documentCount: 1,
      activeTaskCount: 0,
      healthScore: null,
      dueTasks: [],
      recentAssets: [],
      recentActivity: [],
      savedCostLabel: '$0',
    },
    reload: jest.fn().mockResolvedValue(undefined),
    showToast: jest.fn(),
  };
}

describe('ItemShareRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ id: 'access-1', recordType: 'access_item' });
    mockUseHomeVault.mockReturnValue(buildHomeVaultContext());
    mockConfirmLocalStepUp.mockResolvedValue(true);
    mockCreateEncryptedItemShareBundle.mockResolvedValue({ id: 'bundle-1' });
    mockGetItemShareSupportMessage.mockReturnValue(null);
    mockShareItemShareBundle.mockResolvedValue('shared');
    mockFormatHomeVaultItemShareBundle.mockReturnValue('{"bundle":true}');
  });

  it('exports a high-risk access item as an encrypted bundle after local step-up confirmation', async () => {
    const context = buildHomeVaultContext();
    mockUseHomeVault.mockReturnValue(context);

    const { getByText } = await render(<ItemShareRoute />);

    await act(async () => {
      fireEvent.press(getByText('set passphrase'));
    });
    await waitFor(() => expect(getByText('ready to export')).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByText('Export encrypted bundle'));
    });

    await waitFor(() =>
      expect(mockConfirmLocalStepUp).toHaveBeenCalledWith(
        expect.objectContaining({
          alertTitle: 'Export encrypted item share?',
          confirmLabel: 'Export',
          authPromptMessage: 'Authenticate to export Main Wi-Fi',
        }),
      ),
    );

    expect(mockCreateEncryptedItemShareBundle).toHaveBeenCalledWith(
      expect.objectContaining({
        audienceKey: 'emergency_helper',
        expiresInDays: 7,
        passphrase: 'super-secure',
        senderLabel: 'Oak Street home organizer',
        selectedFieldIds: expect.arrayContaining(['username', 'accessCode', 'location', 'instructions']),
      }),
    );
    expect(mockShareItemShareBundle).toHaveBeenCalledWith(
      '{"bundle":true}',
      expect.stringContaining('homevault-item-share-access_item-main-wi-fi-'),
    );
    await waitFor(() => expect(getByText('Encrypted item bundle shared.')).toBeTruthy());
    expect(context.showToast).toHaveBeenCalledWith('Encrypted item bundle shared');
  });

  it('does not export when local step-up verification is cancelled', async () => {
    const context = buildHomeVaultContext();
    mockUseHomeVault.mockReturnValue(context);
    mockConfirmLocalStepUp.mockResolvedValue(false);

    const { getByText } = await render(<ItemShareRoute />);

    await act(async () => {
      fireEvent.press(getByText('set passphrase'));
    });
    await waitFor(() => expect(getByText('ready to export')).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByText('Export encrypted bundle'));
    });

    await waitFor(() => expect(mockConfirmLocalStepUp).toHaveBeenCalled());
    expect(mockCreateEncryptedItemShareBundle).not.toHaveBeenCalled();
    expect(mockShareItemShareBundle).not.toHaveBeenCalled();
    expect(context.showToast).not.toHaveBeenCalled();
  });

  it('recovers cleanly when the requested record is missing', async () => {
    const context = buildHomeVaultContext();
    context.appData.accessItems = [];
    mockUseHomeVault.mockReturnValue(context);

    const { getByText } = await render(<ItemShareRoute />);

    await act(async () => {
      fireEvent.press(getByText('Go back'));
    });

    expect(mockNavigateBackOrReplace).toHaveBeenCalledWith('/(tabs)/access');
  });
});
