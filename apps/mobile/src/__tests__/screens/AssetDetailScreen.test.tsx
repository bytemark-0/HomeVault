import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import type { PartSupply } from '@homevault/domain';

import { AssetDetailScreen } from '../../screens/AssetDetailScreen';
import type {
  AssetDocumentListItem,
  AssetListItem,
  AssetTaskCompletionListItem,
  RepairEventListItem,
} from '../../data/homeVaultSampleData';

describe('AssetDetailScreen', () => {
  const asset: AssetListItem = {
    id: 'asset-dishwasher',
    propertyId: 'property-1',
    roomId: 'room-kitchen',
    name: 'Dishwasher',
    category: 'Appliance',
    brand: 'Bosch',
    model: 'SHX78B75UC',
    serial: 'FD-0311-92841',
    installDate: '2021-03-18',
    purchaseDate: '2021-03-10',
    costCents: 89900,
    warrantyExpiry: '2026-08-01',
    status: 'warranty_soon',
    roomName: 'Kitchen',
    documentCount: 1,
    lastServiceLabel: 'Jan 9, 2026',
    nextTaskLabel: 'Check supply line',
    warrantyExpiryLabel: 'Aug 1, 2026',
    warrantyExpiringSoon: true,
  };

  const documents: AssetDocumentListItem[] = [
    {
      id: 'document-manual',
      propertyId: 'property-1',
      title: 'Dishwasher manual',
      type: 'manual',
      typeLabel: 'Manual',
      linkedRecordIds: ['asset-dishwasher'],
      linkedToLabel: 'Dishwasher',
      dateLabel: 'Mar 2021',
      linkedRecords: [],
    },
  ];

  const taskCompletions: AssetTaskCompletionListItem[] = [
    {
      id: 'completion-1',
      taskId: 'task-1',
      taskTitle: 'Replace filter',
      completedAt: '2026-06-02T12:00:00.000Z',
      completedAtLabel: 'Jun 2',
      costLabel: '$15',
      notes: 'Used spare filter',
    },
  ];

  const repairEvents: RepairEventListItem[] = [
    {
      id: 'repair-1',
      propertyId: 'property-1',
      assetId: 'asset-dishwasher',
      issue: 'Drain pump jam',
      date: '2026-06-04',
      dateLabel: 'Jun 4',
      costLabel: '$125',
      summaryLabel: 'Provider · $125',
      documentIds: [],
    },
  ];

  const parts: PartSupply[] = [
    {
      id: 'part-1',
      propertyId: 'property-1',
      assetId: 'asset-dishwasher',
      name: 'Drain filter',
      partNumber: 'DF-100',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  it('renders linked records and explains delete impact', async () => {
    const onDelete = jest.fn();
    const onDeletePart = jest.fn().mockResolvedValue(undefined);
    const onDeleteRepair = jest.fn().mockResolvedValue(undefined);
    const alert = jest.spyOn(Alert, 'alert');
    const { getAllByText, getByText } = await render(
      <AssetDetailScreen
        asset={asset}
        documents={documents}
        parts={parts}
        repairEvents={repairEvents}
        taskCompletions={taskCompletions}
        onBack={jest.fn()}
        onAddDocument={jest.fn()}
        onAddPart={jest.fn()}
        onAddTask={jest.fn()}
        onDelete={onDelete}
        onDocumentPress={jest.fn()}
        onDuplicate={jest.fn()}
        onEdit={jest.fn()}
        onDeleteRepair={onDeleteRepair}
        onEditRepair={jest.fn()}
        onEditCompletion={jest.fn()}
        onDeleteCompletion={jest.fn()}
        onEditPart={jest.fn()}
        onDeletePart={onDeletePart}
        onRecordRepair={jest.fn()}
      />,
    );

    expect(getByText('Dishwasher manual')).toBeTruthy();
    expect(getByText('Drain filter')).toBeTruthy();
    expect(getByText('Drain pump jam')).toBeTruthy();
    expect(getByText('Replace filter')).toBeTruthy();
    expect(getByText('FD-0311-92841')).toBeTruthy();
    expect(getByText('Aug 1, 2026 · Expiring soon')).toBeTruthy();
    expect(getByText('No notes yet.')).toBeTruthy();
    expect(
      getByText(
        'Deletes this asset along with its tasks and repair history. Documents stay in your library.',
      ),
    ).toBeTruthy();

    await fireEvent.press(getByText('Delete asset'));

    expect(alert).toHaveBeenCalledWith(
      'Delete asset?',
      '"Dishwasher" and its tasks and repair history will be permanently removed. Documents linked to this asset will remain in your library.',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Delete', onPress: expect.any(Function) }),
      ]),
    );

    const actions = alert.mock.calls[0]?.[2] ?? [];
    const deleteAction = actions.find((action) => action.text === 'Delete');
    deleteAction?.onPress?.();

    expect(onDelete).toHaveBeenCalledTimes(1);

    const deleteButtons = getAllByText('Delete');
    const partDeleteButton = deleteButtons[0];
    if (!partDeleteButton) {
      throw new Error('Expected the part delete button to render.');
    }
    await fireEvent.press(partDeleteButton);
    const partActions = alert.mock.calls[1]?.[2] ?? [];
    const partDeleteAction = partActions.find((action) => action.text === 'Delete');
    partDeleteAction?.onPress?.();
    expect(onDeletePart).toHaveBeenCalledWith('part-1');

    const repairDeleteButton = deleteButtons[1];
    if (!repairDeleteButton) {
      throw new Error('Expected the repair delete button to render.');
    }
    await fireEvent.press(repairDeleteButton);
    const repairActions = alert.mock.calls[2]?.[2] ?? [];
    const repairDeleteAction = repairActions.find((action) => action.text === 'Delete');
    repairDeleteAction?.onPress?.();
    expect(onDeleteRepair).toHaveBeenCalledWith('repair-1');
  });

  it('surfaces device readiness and router details', async () => {
    const onShare = jest.fn();
    const onMarkReviewed = jest.fn();
    const deviceAsset: AssetListItem = {
      ...asset,
      id: 'asset-router',
      name: 'Main Wi-Fi router',
      category: 'Router',
      ownerName: 'Household',
      backupEnabled: true,
      screenLockEnabled: false,
      findMyDeviceEnabled: undefined,
      networkName: 'OakStreet-5G',
      internetProvider: 'FiberCo',
      networkAdminUrl: 'http://192.168.1.1',
      documentCount: 0,
    };

    const { getByText } = await render(
      <AssetDetailScreen
        asset={deviceAsset}
        documents={[]}
        parts={[]}
        repairEvents={[]}
        taskCompletions={[]}
        onBack={jest.fn()}
        onAddDocument={jest.fn()}
        onAddPart={jest.fn()}
        onAddTask={jest.fn()}
        onDelete={jest.fn()}
        onDocumentPress={jest.fn()}
        onDuplicate={jest.fn()}
        onEdit={jest.fn()}
        onDeleteRepair={jest.fn()}
        onEditRepair={jest.fn()}
        onEditCompletion={jest.fn()}
        onDeleteCompletion={jest.fn()}
        onEditPart={jest.fn()}
        onDeletePart={jest.fn()}
        onRecordRepair={jest.fn()}
        onMarkReviewed={onMarkReviewed}
        onShare={onShare}
        reviewStatusLabel="Reviewed 2 days ago."
      />,
    );

    expect(getByText('Recovery readiness')).toBeTruthy();
    expect(getByText('Enabled')).toBeTruthy();
    expect(getByText('Off')).toBeTruthy();
    expect(getByText('Not reviewed')).toBeTruthy();
    expect(getByText('Router details')).toBeTruthy();
    expect(getByText('OakStreet-5G')).toBeTruthy();
    expect(getByText('FiberCo')).toBeTruthy();
    expect(getByText('http://192.168.1.1')).toBeTruthy();
    expect(getByText('Delete device')).toBeTruthy();
    expect(getByText('Reviewed 2 days ago.')).toBeTruthy();

    fireEvent.press(getByText('Review'));
    expect(onMarkReviewed).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Share'));
    expect(onShare).toHaveBeenCalledTimes(1);
  });
});
