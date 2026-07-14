import { fireEvent, render, waitFor } from '@testing-library/react-native';

import type { CreateImportantAccountInput, UpdateImportantAccountInput } from '@homevault/database';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockUseLocalSearchParams = jest.fn();
const mockUseHomeVault = jest.fn();
const mockGetHomeVaultRepository = jest.fn();
let mockAccountSaveInput: CreateImportantAccountInput | UpdateImportantAccountInput = {
  propertyId: 'property-1',
  kind: 'insurance',
  providerName: 'Prairie Mutual',
  label: 'Home policy',
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

jest.mock('../../screens/AddImportantAccountScreen', () => ({
  AddImportantAccountScreen: ({
    onCancel,
    onSave,
  }: {
    onCancel: () => void;
    onSave: (input: CreateImportantAccountInput | UpdateImportantAccountInput) => Promise<void>;
  }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <>
        <Pressable accessibilityRole="button" onPress={() => void onSave(mockAccountSaveInput)}>
          <Text>trigger save</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onCancel}>
          <Text>trigger cancel</Text>
        </Pressable>
      </>
    );
  },
}));

jest.mock('../../screens/ImportantAccountDetailScreen', () => ({
  ImportantAccountDetailScreen: ({
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

const AccountDetailRoute = require('../../../app/account/[id]').default;
const EditAccountRoute = require('../../../app/account/[id]/edit').default;
const NewAccountRoute = require('../../../app/account/new').default;

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
      accessItems: [],
      emergencyContacts: [],
      importantAccounts: [
        {
          id: 'account-1',
          propertyId: 'property-1',
          kind: 'insurance' as const,
          providerName: 'Prairie Mutual',
          label: 'Home policy',
          linkedDocumentIds: [],
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
    reload: jest.fn().mockResolvedValue(undefined),
    showToast: jest.fn(),
  };
}

describe('important account routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ id: 'account-1', kind: 'insurance' });
    mockUseHomeVault.mockReturnValue(buildHomeVaultContext());
    mockRouter.canGoBack.mockReturnValue(false);
    mockAccountSaveInput = {
      propertyId: 'property-1',
      kind: 'insurance',
      providerName: 'Prairie Mutual',
      label: 'Home policy',
      linkedDocumentIds: [],
    };
  });

  it('falls back to the new account detail screen after create when there is no history', async () => {
    const context = buildHomeVaultContext();
    const repo = { createImportantAccount: jest.fn().mockResolvedValue({ id: 'account-new' }) };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { getByText } = await render(<NewAccountRoute />);
    fireEvent.press(getByText('trigger save'));

    await waitFor(() => expect(repo.createImportantAccount).toHaveBeenCalled());
    expect(context.reload).toHaveBeenCalledTimes(1);
    expect(context.showToast).toHaveBeenCalledWith('Important account saved');
    expect(mockRouter.replace).toHaveBeenCalledWith('/account/account-new');
  });

  it('shows a recovery view when the account detail route is stale', async () => {
    const context = buildHomeVaultContext();
    context.appData.importantAccounts = [];
    mockUseHomeVault.mockReturnValue(context);

    const { getByText, queryByText } = await render(<AccountDetailRoute />);

    expect(queryByText('Home policy')).toBeNull();
    expect(queryByText('Prairie Mutual')).toBeNull();
    fireEvent.press(getByText('Back to Emergency'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/emergency');
  });

  it('falls back to the account detail screen after edit when there is no history', async () => {
    const context = buildHomeVaultContext();
    const repo = { updateImportantAccount: jest.fn().mockResolvedValue({ id: 'account-1' }) };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);
    mockAccountSaveInput = {
      id: 'account-1',
      propertyId: 'property-1',
      kind: 'insurance',
      providerName: 'Prairie Mutual Claims',
      label: 'Home policy',
      linkedDocumentIds: [],
    };

    const { getByText } = await render(<EditAccountRoute />);
    fireEvent.press(getByText('trigger save'));

    await waitFor(() => expect(repo.updateImportantAccount).toHaveBeenCalled());
    expect(context.showToast).toHaveBeenCalledWith('Important account updated');
    expect(mockRouter.replace).toHaveBeenCalledWith('/account/account-1');
  });

  it('deletes the account and returns to Emergency', async () => {
    const context = buildHomeVaultContext();
    const repo = { deleteImportantAccount: jest.fn().mockResolvedValue(undefined) };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { getByText } = await render(<AccountDetailRoute />);
    fireEvent.press(getByText('trigger delete'));

    await waitFor(() => expect(repo.deleteImportantAccount).toHaveBeenCalledWith('account-1'));
    expect(context.showToast).toHaveBeenCalledWith('Important account deleted', 'error');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/emergency');
  });

  it('opens the encrypted item-share flow from account detail', async () => {
    const { getByText } = await render(<AccountDetailRoute />);

    fireEvent.press(getByText('trigger share'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/share/item',
      params: { id: 'account-1', recordType: 'important_account' },
    });
  });

  it('marks important accounts reviewed from the detail route', async () => {
    const context = buildHomeVaultContext();
    const repo = { updateImportantAccount: jest.fn().mockResolvedValue({ id: 'account-1' }) };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { getByText } = await render(<AccountDetailRoute />);
    fireEvent.press(getByText('trigger review'));

    await waitFor(() =>
      expect(repo.updateImportantAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'account-1',
          lastReviewedAt: expect.any(String),
        }),
      ),
    );
    expect(context.showToast).toHaveBeenCalledWith('Important account review updated');
  });
});
