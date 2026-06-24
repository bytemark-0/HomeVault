import { fireEvent, render, waitFor } from '@testing-library/react-native';

import type { CreatePartInput, CreateRepairEventInput, UpdateRepairEventInput } from '@homevault/database';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockUseLocalSearchParams = jest.fn();
const mockUseHomeVault = jest.fn();
const mockGetHomeVaultRepository = jest.fn();

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

jest.mock('../../screens/AddRepairEventScreen', () => ({
  AddRepairEventScreen: ({
    onCancel,
    onSave,
  }: {
    onCancel: () => void;
    onSave: (input: CreateRepairEventInput | UpdateRepairEventInput) => Promise<void>;
  }) => {
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Pressable accessibilityRole="button" onPress={() => void onSave({ propertyId: 'property-1', assetId: 'asset-1', issue: 'Leak', date: '2026-06-12', documentIds: [] })}>
          <Text>trigger repair save</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onCancel}>
          <Text>trigger repair cancel</Text>
        </Pressable>
      </>
    );
  },
}));

jest.mock('../../screens/AddPartScreen', () => ({
  AddPartScreen: ({
    onCancel,
    onSave,
  }: {
    onCancel: () => void;
    onSave: (input: CreatePartInput) => Promise<void>;
  }) => {
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Pressable accessibilityRole="button" onPress={() => void onSave({ propertyId: 'property-1', assetId: 'asset-1', name: 'Filter' })}>
          <Text>trigger part save</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onCancel}>
          <Text>trigger part cancel</Text>
        </Pressable>
      </>
    );
  },
}));

jest.mock('../../components/MissingRecordView', () => ({
  MissingRecordView: ({ actionLabel, onActionPress }: { actionLabel: string; onActionPress: () => void }) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable accessibilityRole="button" onPress={onActionPress}>
        <Text>{actionLabel}</Text>
      </Pressable>
    );
  },
}));

const AssetAddRepairRoute = require('../../../app/asset/[id]/add-repair').default;
const AssetAddPartRoute = require('../../../app/asset/[id]/add-part').default;
const EditRepairRoute = require('../../../app/asset/[id]/repair/[repairId]/edit').default;
const EditPartRoute = require('../../../app/asset/[id]/part/[partId]/edit').default;

function buildHomeVaultContext() {
  return {
    appData: {
      property: { id: 'property-1', householdId: 'household-1', label: 'Home', type: 'single_family' as const },
      assets: [{ id: 'asset-1', propertyId: 'property-1', name: 'Dishwasher', category: 'Appliance', status: 'ready' as const, roomName: 'Kitchen', documentCount: 0, lastServiceLabel: 'No', nextTaskLabel: 'None', warrantyExpiringSoon: false }],
      rooms: [],
      documents: [],
      tasks: [],
      taskCompletions: [],
      repairEvents: [{ id: 'repair-1', propertyId: 'property-1', assetId: 'asset-1', issue: 'Leak', date: '2026-06-01', documentIds: [] }],
      parts: [{ id: 'part-1', propertyId: 'property-1', assetId: 'asset-1', name: 'Filter' }],
      assetCount: 1,
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
    showToast: jest.fn(),
  };
}

describe('repair and part routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ id: 'asset-1', repairId: 'repair-1', partId: 'part-1' });
    mockUseHomeVault.mockReturnValue(buildHomeVaultContext());
    mockGetHomeVaultRepository.mockResolvedValue({
      createRepairEvent: jest.fn().mockResolvedValue(undefined),
      createPart: jest.fn().mockResolvedValue(undefined),
      updateRepairEvent: jest.fn().mockResolvedValue(undefined),
      updatePart: jest.fn().mockResolvedValue(undefined),
    });
    mockRouter.canGoBack.mockReturnValue(false);
  });

  it('shows a recovery view when the asset is missing for add-repair', async () => {
    const context = buildHomeVaultContext();
    context.appData.assets = [];
    mockUseHomeVault.mockReturnValue(context);

    const { getByText } = await render(<AssetAddRepairRoute />);
    fireEvent.press(getByText('Back to Inventory'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/inventory');
  });

  it('returns to the asset after saving a repair without history', async () => {
    const context = buildHomeVaultContext();
    const repo = { createRepairEvent: jest.fn().mockResolvedValue(undefined) };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { getByText } = await render(<AssetAddRepairRoute />);
    fireEvent.press(getByText('trigger repair save'));

    await waitFor(() => expect(repo.createRepairEvent).toHaveBeenCalled());
    expect(context.showToast).toHaveBeenCalledWith('Repair recorded');
    expect(mockRouter.replace).toHaveBeenCalledWith('/asset/asset-1');
  });

  it('shows a recovery view when the asset is missing for add-part', async () => {
    const context = buildHomeVaultContext();
    context.appData.assets = [];
    mockUseHomeVault.mockReturnValue(context);

    const { getByText } = await render(<AssetAddPartRoute />);
    fireEvent.press(getByText('Back to Inventory'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/inventory');
  });

  it('returns to the asset after saving a part without history', async () => {
    const context = buildHomeVaultContext();
    const repo = { createPart: jest.fn().mockResolvedValue(undefined) };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { getByText } = await render(<AssetAddPartRoute />);
    fireEvent.press(getByText('trigger part save'));

    await waitFor(() => expect(repo.createPart).toHaveBeenCalled());
    expect(context.showToast).toHaveBeenCalledWith('Part saved');
    expect(mockRouter.replace).toHaveBeenCalledWith('/asset/asset-1');
  });

  it('shows a recovery view when the repair edit route is stale', async () => {
    const context = buildHomeVaultContext();
    context.appData.repairEvents = [];
    mockUseHomeVault.mockReturnValue(context);

    const { getByText } = await render(<EditRepairRoute />);
    fireEvent.press(getByText('Back to Asset'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/asset/asset-1');
  });

  it('shows a recovery view when the part edit route is stale', async () => {
    const context = buildHomeVaultContext();
    context.appData.parts = [];
    mockUseHomeVault.mockReturnValue(context);

    const { getByText } = await render(<EditPartRoute />);
    fireEvent.press(getByText('Back to Asset'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/asset/asset-1');
  });
});
