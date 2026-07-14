import { fireEvent, render, waitFor } from '@testing-library/react-native';

import type { CreateDocumentInput, UpdateDocumentInput } from '@homevault/database';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockUseLocalSearchParams = jest.fn();
const mockUseHomeVault = jest.fn();
const mockGetHomeVaultRepository = jest.fn();
let mockDocumentSaveInput: CreateDocumentInput | UpdateDocumentInput = {
  propertyId: 'property-1',
  title: 'Manual',
  type: 'manual',
  linkedRecordIds: ['asset-1'],
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

jest.mock('../../screens/AddDocumentScreen', () => ({
  AddDocumentScreen: ({
    onCancel,
    onSave,
  }: {
    onCancel: () => void;
    onSave: (input: CreateDocumentInput | UpdateDocumentInput) => Promise<void>;
  }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <>
        <Pressable accessibilityRole="button" onPress={() => void onSave(mockDocumentSaveInput)}>
          <Text>trigger save</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onCancel}>
          <Text>trigger cancel</Text>
        </Pressable>
      </>
    );
  },
}));

jest.mock('../../screens/DocumentDetailScreen', () => ({
  DocumentDetailScreen: ({
    onBack,
    onDelete,
    onShare,
  }: {
    onBack: () => void;
    onDelete: () => Promise<void>;
    onShare?: () => void;
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
        {onShare ? (
          <Pressable accessibilityRole="button" onPress={onShare}>
            <Text>trigger share</Text>
          </Pressable>
        ) : null}
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

const DocumentDetailRoute = require('../../../app/document/[id]').default;
const EditDocumentRoute = require('../../../app/document/[id]/edit').default;
const NewDocumentRoute = require('../../../app/document/new').default;

function buildHomeVaultContext() {
  return {
    appData: {
      property: { id: 'property-1', householdId: 'household-1', label: 'Home', type: 'single_family' as const },
      assets: [{ id: 'asset-1', propertyId: 'property-1', name: 'Dishwasher', category: 'Appliance', status: 'ready' as const, roomName: 'Kitchen', documentCount: 1, lastServiceLabel: 'No', nextTaskLabel: 'None', warrantyExpiringSoon: false }],
      rooms: [{ id: 'room-1', propertyId: 'property-1', name: 'Kitchen', type: 'room' as const, assetCount: 1, activeTaskCount: 0, attentionCount: 0 }],
      documents: [{ id: 'document-1', propertyId: 'property-1', title: 'Manual', type: 'manual' as const, typeLabel: 'Manual', linkedRecordIds: ['asset-1'], linkedToLabel: 'Dishwasher', dateLabel: 'Apr 2026', linkedRecords: [] }],
      tasks: [],
      taskCompletions: [],
      repairEvents: [],
      parts: [],
      assetCount: 1,
      roomCount: 1,
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

describe('document routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ id: 'document-1' });
    mockUseHomeVault.mockReturnValue(buildHomeVaultContext());
    mockRouter.canGoBack.mockReturnValue(false);
    mockDocumentSaveInput = {
      propertyId: 'property-1',
      title: 'Manual',
      type: 'manual',
      linkedRecordIds: ['asset-1'],
    };
  });

  it('falls back to the new document detail screen after create when there is no history', async () => {
    const context = buildHomeVaultContext();
    const repo = { createDocument: jest.fn().mockResolvedValue({ id: 'document-new' }) };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { getByText } = await render(<NewDocumentRoute />);
    fireEvent.press(getByText('trigger save'));

    await waitFor(() => expect(repo.createDocument).toHaveBeenCalled());
    expect(context.reload).toHaveBeenCalledTimes(1);
    expect(context.showToast).toHaveBeenCalledWith('Document saved');
    expect(mockRouter.replace).toHaveBeenCalledWith('/document/document-new');
  });

  it('shows a recovery view when the document detail route is stale', async () => {
    const context = buildHomeVaultContext();
    context.appData.documents = [];
    mockUseHomeVault.mockReturnValue(context);

    const { getByText } = await render(<DocumentDetailRoute />);
    fireEvent.press(getByText('Back to Documents'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/documents');
  });

  it('falls back to the document detail screen after edit when there is no history', async () => {
    const context = buildHomeVaultContext();
    const repo = { updateDocument: jest.fn().mockResolvedValue({ id: 'document-1' }) };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);
    mockDocumentSaveInput = {
      id: 'document-1',
      propertyId: 'property-1',
      title: 'Manual updated',
      type: 'manual',
      linkedRecordIds: ['asset-1'],
    };

    const { getByText } = await render(<EditDocumentRoute />);
    fireEvent.press(getByText('trigger save'));

    await waitFor(() => expect(repo.updateDocument).toHaveBeenCalled());
    expect(context.showToast).toHaveBeenCalledWith('Document updated');
    expect(mockRouter.replace).toHaveBeenCalledWith('/document/document-1');
  });

  it('opens the item share flow for critical documents', async () => {
    const context = buildHomeVaultContext();
    context.appData.documents = [
      {
        ...context.appData.documents[0],
        type: 'emergency',
        typeLabel: 'Emergency',
        title: 'Water shutoff map',
      },
    ];
    mockUseHomeVault.mockReturnValue(context);

    const { getByText } = await render(<DocumentDetailRoute />);
    fireEvent.press(getByText('trigger share'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/share/item',
      params: { id: 'document-1', recordType: 'document' },
    });
  });

  it('deletes the document and returns to Documents', async () => {
    const context = buildHomeVaultContext();
    const repo = { deleteDocument: jest.fn().mockResolvedValue(undefined) };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { getByText } = await render(<DocumentDetailRoute />);
    fireEvent.press(getByText('trigger delete'));

    await waitFor(() => expect(repo.deleteDocument).toHaveBeenCalledWith('document-1'));
    expect(context.showToast).toHaveBeenCalledWith('Document deleted', 'error');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/documents');
  });
});
