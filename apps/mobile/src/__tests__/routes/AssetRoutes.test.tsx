import { fireEvent, render, waitFor } from '@testing-library/react-native';

import type { CreateAssetInput, UpdateAssetInput } from '@homevault/database';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockUseLocalSearchParams = jest.fn();
const mockUseHomeVault = jest.fn();
const mockGetHomeVaultRepository = jest.fn();
let mockAddAssetSaveInput: CreateAssetInput | UpdateAssetInput = {
  propertyId: 'property-1',
  name: 'Dishwasher',
  category: 'Appliance',
  status: 'ready',
};

jest.mock('expo-router', () => ({
  router: mockRouter,
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock('../../context/HomeVaultContext', () => ({
  useHomeVault: () => mockUseHomeVault(),
}));

jest.mock('../../data/localHomeVaultRepository', () => ({
  getHomeVaultRepository: () => mockGetHomeVaultRepository(),
}));

jest.mock('../../data/homeVaultSampleData', () => ({
  toAssetDocumentListItems: () => [],
  toAssetTaskCompletionListItems: () => [],
}));

jest.mock('../../screens/AddAssetScreen', () => ({
  AddAssetScreen: ({
    onCancel,
    onSave,
  }: {
    onCancel: () => void;
    onSave: (input: CreateAssetInput | UpdateAssetInput) => Promise<void>;
  }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <>
        <Pressable accessibilityRole="button" onPress={() => void onSave(mockAddAssetSaveInput)}>
          <Text>trigger save</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onCancel}>
          <Text>trigger cancel</Text>
        </Pressable>
      </>
    );
  },
}));

jest.mock('../../screens/AssetDetailScreen', () => ({
  AssetDetailScreen: ({
    onBack,
    onDelete,
  }: {
    onBack: () => void;
    onDelete: () => void;
  }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <>
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Text>trigger back</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onDelete}>
          <Text>trigger delete</Text>
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

const AssetDetailRoute = require('../../../app/asset/[id]').default;
const EditAssetRoute = require('../../../app/asset/[id]/edit').default;
const NewAssetRoute = require('../../../app/asset/new').default;

function buildHomeVaultContext() {
  return {
    appData: {
      property: {
        id: 'property-1',
        householdId: 'household-1',
        label: 'Home',
        type: 'single_family' as const,
      },
      rooms: [{ id: 'room-kitchen', propertyId: 'property-1', name: 'Kitchen', type: 'room' as const }],
      assets: [
        {
          id: 'asset-dishwasher',
          propertyId: 'property-1',
          roomId: 'room-kitchen',
          name: 'Dishwasher',
          category: 'Appliance',
          status: 'ready' as const,
          roomName: 'Kitchen',
          documentCount: 1,
          lastServiceLabel: 'Jan 1',
          nextTaskLabel: 'Inspect hose',
          warrantyExpiringSoon: false,
        },
      ],
      documents: [],
      tasks: [],
      taskCompletions: [],
      repairEvents: [],
      parts: [],
      assetCount: 1,
      roomCount: 1,
      documentCount: 0,
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

describe('asset routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ id: 'asset-dishwasher' });
    mockUseHomeVault.mockReturnValue(buildHomeVaultContext());
    mockGetHomeVaultRepository.mockResolvedValue({
      createAsset: jest.fn().mockResolvedValue({
        id: 'asset-new',
        propertyId: 'property-1',
        name: 'Dishwasher',
        category: 'Appliance',
        status: 'ready',
      }),
      updateAsset: jest.fn().mockResolvedValue({
        id: 'asset-dishwasher',
        propertyId: 'property-1',
        name: 'Dishwasher',
        category: 'Appliance',
        status: 'ready',
      }),
      deleteAsset: jest.fn().mockResolvedValue(undefined),
    });
    mockRouter.canGoBack.mockReturnValue(false);
    mockAddAssetSaveInput = {
      propertyId: 'property-1',
      name: 'Dishwasher',
      category: 'Appliance',
      status: 'ready',
    };
  });

  it('falls back to the new asset detail screen after create when there is no history', async () => {
    const context = buildHomeVaultContext();
    const repo = {
      createAsset: jest.fn().mockResolvedValue({
        id: 'asset-new',
        propertyId: 'property-1',
        name: 'Dishwasher',
        category: 'Appliance',
        status: 'ready',
      }),
    };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { getByText } = await render(<NewAssetRoute />);

    fireEvent.press(getByText('trigger save'));

    await waitFor(() =>
      expect(repo.createAsset).toHaveBeenCalledWith({
        propertyId: 'property-1',
        name: 'Dishwasher',
        category: 'Appliance',
        status: 'ready',
      }),
    );
    expect(context.reload).toHaveBeenCalledTimes(1);
    expect(context.showToast).toHaveBeenCalledWith('Asset saved');
    expect(mockRouter.replace).toHaveBeenCalledWith('/asset/asset-new');
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it('uses back navigation for new-asset cancel when history exists', async () => {
    mockRouter.canGoBack.mockReturnValue(true);

    const { getByText } = await render(<NewAssetRoute />);

    fireEvent.press(getByText('trigger cancel'));

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('shows a recovery view when the asset detail route is stale', async () => {
    const context = buildHomeVaultContext();
    context.appData.assets = [];
    mockUseHomeVault.mockReturnValue(context);

    const { getByText } = await render(<AssetDetailRoute />);

    expect(getByText('Back to Inventory')).toBeTruthy();
    fireEvent.press(getByText('Back to Inventory'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/inventory');
  });

  it('falls back to the asset detail screen after edit when there is no history', async () => {
    const context = buildHomeVaultContext();
    const repo = {
      updateAsset: jest.fn().mockResolvedValue({
        id: 'asset-dishwasher',
        propertyId: 'property-1',
        name: 'Dishwasher Pro',
        category: 'Appliance',
        status: 'ready',
      }),
    };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);
    mockAddAssetSaveInput = {
      id: 'asset-dishwasher',
      propertyId: 'property-1',
      name: 'Dishwasher Pro',
      category: 'Appliance',
      status: 'ready',
    };

    const { getByText } = await render(<EditAssetRoute />);

    fireEvent.press(getByText('trigger save'));

    await waitFor(() =>
      expect(repo.updateAsset).toHaveBeenCalledWith({
        id: 'asset-dishwasher',
        propertyId: 'property-1',
        name: 'Dishwasher Pro',
        category: 'Appliance',
        status: 'ready',
      }),
    );
    expect(context.reload).toHaveBeenCalledTimes(1);
    expect(context.showToast).toHaveBeenCalledWith('Asset updated');
    expect(mockRouter.replace).toHaveBeenCalledWith('/asset/asset-dishwasher');
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it('falls back to Inventory when leaving asset detail without history', async () => {
    const { getByText } = await render(<AssetDetailRoute />);

    fireEvent.press(getByText('trigger back'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/inventory');
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it('deletes the asset and returns to Inventory', async () => {
    const context = buildHomeVaultContext();
    const repo = {
      deleteAsset: jest.fn().mockResolvedValue(undefined),
    };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { getByText } = await render(<AssetDetailRoute />);

    fireEvent.press(getByText('trigger delete'));

    await waitFor(() => expect(repo.deleteAsset).toHaveBeenCalledWith('asset-dishwasher'));
    expect(context.showToast).toHaveBeenCalledWith('Asset deleted', 'error');
    expect(context.reload).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/inventory');
  });
});
