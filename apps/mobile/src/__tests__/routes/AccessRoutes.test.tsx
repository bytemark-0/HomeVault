import { fireEvent, render, waitFor } from '@testing-library/react-native';

import type { CreateAccessItemInput, UpdateAccessItemInput } from '@homevault/database';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockUseLocalSearchParams = jest.fn();
const mockUseHomeVault = jest.fn();
const mockGetHomeVaultRepository = jest.fn();
let mockAccessSaveInput: CreateAccessItemInput | UpdateAccessItemInput = {
  propertyId: 'property-1',
  category: 'wifi',
  label: 'Wi-Fi access',
  username: 'OakStreet-5G',
  accessCode: '9274',
  linkedDocumentIds: [],
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

jest.mock('../../screens/AddAccessItemScreen', () => ({
  AddAccessItemScreen: ({
    onCancel,
    onSave,
  }: {
    onCancel: () => void;
    onSave: (input: CreateAccessItemInput | UpdateAccessItemInput) => Promise<void>;
  }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <>
        <Pressable accessibilityRole="button" onPress={() => void onSave(mockAccessSaveInput)}>
          <Text>trigger save</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onCancel}>
          <Text>trigger cancel</Text>
        </Pressable>
      </>
    );
  },
}));

jest.mock('../../screens/AccessDetailScreen', () => ({
  AccessDetailScreen: ({
    onBack,
    onDelete,
    onMarkReviewed,
    onShare,
  }: {
    onBack: () => void;
    onDelete: () => Promise<void>;
    onMarkReviewed: () => void;
    onShare: () => void;
  }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <>
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Text>trigger back</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => void onDelete()}>
          <Text>trigger delete</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onMarkReviewed}>
          <Text>trigger review</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onShare}>
          <Text>trigger share</Text>
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

const AccessDetailRoute = require('../../../app/access/[id]').default;
const EditAccessRoute = require('../../../app/access/[id]/edit').default;
const NewAccessRoute = require('../../../app/access/new').default;

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
          name: 'Wi-Fi router',
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
          id: 'document-1',
          propertyId: 'property-1',
          title: 'Router quick start',
          type: 'manual' as const,
          typeLabel: 'Manual',
          linkedToLabel: 'Wi-Fi router',
          dateLabel: 'Jul 1, 2026',
          linkedRecords: [],
          linkedRecordIds: ['asset-router'],
        },
      ],
      accessItems: [
        {
          id: 'access-1',
          propertyId: 'property-1',
          category: 'wifi' as const,
          label: 'Wi-Fi access',
          username: 'OakStreet-5G',
          accessCode: '9274',
          linkedAssetId: 'asset-router',
          linkedDocumentIds: ['document-1'],
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

describe('access routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ id: 'access-1', category: 'wifi' });
    mockUseHomeVault.mockReturnValue(buildHomeVaultContext());
    mockRouter.canGoBack.mockReturnValue(false);
    mockAccessSaveInput = {
      propertyId: 'property-1',
      category: 'wifi',
      label: 'Wi-Fi access',
      username: 'OakStreet-5G',
      accessCode: '9274',
      linkedDocumentIds: [],
    };
  });

  it('falls back to the new access detail screen after create when there is no history', async () => {
    const context = buildHomeVaultContext();
    const repo = { createAccessItem: jest.fn().mockResolvedValue({ id: 'access-new' }) };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { getByText } = await render(<NewAccessRoute />);
    fireEvent.press(getByText('trigger save'));

    await waitFor(() => expect(repo.createAccessItem).toHaveBeenCalled());
    expect(context.reload).toHaveBeenCalledTimes(1);
    expect(context.showToast).toHaveBeenCalledWith('Access record saved');
    expect(mockRouter.replace).toHaveBeenCalledWith('/access/access-new');
  });

  it('shows a recovery view when the access detail route is stale', async () => {
    const context = buildHomeVaultContext();
    context.appData.accessItems = [];
    mockUseHomeVault.mockReturnValue(context);

    const { getByText, queryByText } = await render(<AccessDetailRoute />);

    expect(queryByText('Wi-Fi access')).toBeNull();
    expect(queryByText('9274')).toBeNull();
    fireEvent.press(getByText('Back to Access'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/access');
  });

  it('falls back to the access detail screen after edit when there is no history', async () => {
    const context = buildHomeVaultContext();
    const repo = { updateAccessItem: jest.fn().mockResolvedValue({ id: 'access-1' }) };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);
    mockAccessSaveInput = {
      id: 'access-1',
      propertyId: 'property-1',
      category: 'wifi',
      label: 'Wi-Fi access updated',
      username: 'OakStreet-5G',
      accessCode: 'new-password',
      linkedDocumentIds: [],
    };

    const { getByText } = await render(<EditAccessRoute />);
    fireEvent.press(getByText('trigger save'));

    await waitFor(() => expect(repo.updateAccessItem).toHaveBeenCalled());
    expect(context.showToast).toHaveBeenCalledWith('Access record updated');
    expect(mockRouter.replace).toHaveBeenCalledWith('/access/access-1');
  });

  it('deletes the access record and returns to Access', async () => {
    const context = buildHomeVaultContext();
    const repo = { deleteAccessItem: jest.fn().mockResolvedValue(undefined) };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { getByText } = await render(<AccessDetailRoute />);
    fireEvent.press(getByText('trigger delete'));

    await waitFor(() => expect(repo.deleteAccessItem).toHaveBeenCalledWith('access-1'));
    expect(context.showToast).toHaveBeenCalledWith('Access record deleted', 'error');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/access');
  });

  it('opens the encrypted item-share flow from access detail', async () => {
    const { getByText } = await render(<AccessDetailRoute />);

    fireEvent.press(getByText('trigger share'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/share/item',
      params: { id: 'access-1', recordType: 'access_item' },
    });
  });

  it('marks access records reviewed from the detail route', async () => {
    const context = buildHomeVaultContext();
    const repo = { updateAccessItem: jest.fn().mockResolvedValue({ id: 'access-1' }) };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { getByText } = await render(<AccessDetailRoute />);
    fireEvent.press(getByText('trigger review'));

    await waitFor(() =>
      expect(repo.updateAccessItem).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'access-1',
          lastReviewedAt: expect.any(String),
          lastVerifiedAt: expect.any(String),
        }),
      ),
    );
    expect(context.showToast).toHaveBeenCalledWith('Access review updated');
  });
});
