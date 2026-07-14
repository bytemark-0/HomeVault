import { act, fireEvent, render } from '@testing-library/react-native';

const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockUseLocalSearchParams = jest.fn();
const mockUseHomeVault = jest.fn();

jest.mock('expo-router', () => ({
  router: mockRouter,
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock('../../context/HomeVaultContext', () => ({
  useHomeVault: () => mockUseHomeVault(),
}));

jest.mock('../../data/localHomeVaultRepository', () => ({
  getHomeVaultRepository: jest.fn(),
}));

jest.mock('../../screens/ExportManifestScreen', () => ({
  ExportManifestScreen: ({
    accessItems,
    assets,
    documents,
    emergencyContacts,
    importantAccounts,
    initialFocusSection,
    initialTrustedShareAudience,
    onBack,
    onFixPress,
    property,
  }: {
    accessItems: unknown[];
    assets: unknown[];
    documents: unknown[];
    emergencyContacts: unknown[];
    importantAccounts: unknown[];
    initialFocusSection?: 'packet' | 'trusted-share';
    initialTrustedShareAudience?: string;
    onBack: () => void;
    onFixPress: (fixId: string) => void;
    property: { label: string };
  }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <>
        <Text>{property.label}</Text>
        <Text>{initialFocusSection ?? 'no focus'}</Text>
        <Text>{initialTrustedShareAudience ?? 'no audience'}</Text>
        <Text>{`access:${accessItems.length}`}</Text>
        <Text>{`assets:${assets.length}`}</Text>
        <Text>{`documents:${documents.length}`}</Text>
        <Text>{`contacts:${emergencyContacts.length}`}</Text>
        <Text>{`accounts:${importantAccounts.length}`}</Text>
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Text>go back</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onFixPress('assets')}>
          <Text>fix assets</Text>
        </Pressable>
      </>
    );
  },
}));

const ExportRoute = require('../../../app/export').default;

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
      documents: [],
      accessItems: [],
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
    reload: jest.fn().mockResolvedValue(undefined),
    setBackupSummary: jest.fn(),
    setRestoreSummary: jest.fn(),
    showToast: jest.fn(),
  };
}

describe('ExportRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ focus: 'trusted-share', audience: 'house_sitter' });
    mockUseHomeVault.mockReturnValue(buildHomeVaultContext());
  });

  it('passes clean-install household data into export tools with the trusted-share shortcut focus', async () => {
    const { getByText } = await render(<ExportRoute />);

    expect(getByText('Oak Street home')).toBeTruthy();
    expect(getByText('trusted-share')).toBeTruthy();
    expect(getByText('house_sitter')).toBeTruthy();
    expect(getByText('access:0')).toBeTruthy();
    expect(getByText('assets:0')).toBeTruthy();
    expect(getByText('documents:0')).toBeTruthy();
    expect(getByText('contacts:0')).toBeTruthy();
    expect(getByText('accounts:0')).toBeTruthy();
  });

  it('routes empty-household checklist fixes back into setup areas', async () => {
    const { getByText } = await render(<ExportRoute />);

    await act(async () => {
      fireEvent.press(getByText('go back'));
    });
    await act(async () => {
      fireEvent.press(getByText('fix assets'));
    });

    expect(mockRouter.back).toHaveBeenCalledTimes(2);
    expect(mockRouter.push).toHaveBeenCalledWith('/asset/new');
  });
});
