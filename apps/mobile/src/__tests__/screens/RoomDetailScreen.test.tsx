import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { RoomDetailScreen } from '../../screens/RoomDetailScreen';
import type { AssetListItem, RoomListItem } from '../../data/homeVaultSampleData';

const room: RoomListItem = {
  id: 'room-kitchen',
  propertyId: 'property-1',
  name: 'Kitchen',
  type: 'room',
  floor: 'Main',
  assetCount: 2,
  activeTaskCount: 1,
  attentionCount: 1,
};

const linkedAssets: AssetListItem[] = [
  {
    id: 'asset-dishwasher',
    propertyId: 'property-1',
    roomId: 'room-kitchen',
    name: 'Dishwasher',
    category: 'Appliance',
    roomName: 'Kitchen',
    status: 'ready',
    statusLabel: 'Ready',
    documentCount: 1,
    taskCount: 0,
    repairCount: 0,
  },
  {
    id: 'asset-fridge',
    propertyId: 'property-1',
    roomId: 'room-kitchen',
    name: 'Refrigerator',
    category: 'Appliance',
    roomName: 'Kitchen',
    status: 'needs_attention',
    statusLabel: 'Needs attention',
    documentCount: 0,
    taskCount: 1,
    repairCount: 0,
  },
];

describe('RoomDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  it('explains linked-record impact before deleting a room', async () => {
    const onDelete = jest.fn();
    const alert = jest.spyOn(Alert, 'alert');
    const { getByText } = await render(
      <RoomDetailScreen
        room={room}
        assets={linkedAssets}
        documents={[]}
        repairEvents={[]}
        serviceCompletions={[]}
        tasks={[]}
        onAddAsset={jest.fn()}
        onAddDocument={jest.fn()}
        onAddTask={jest.fn()}
        onAssetPress={jest.fn()}
        onBack={jest.fn()}
        onDelete={onDelete}
        onDocumentPress={jest.fn()}
        onEdit={jest.fn()}
        onTaskPress={jest.fn()}
      />,
    );

    expect(
      getByText(
        'Deletes this room and its 2 assets, along with their tasks and repair history. Documents stay in your library.',
      ),
    ).toBeTruthy();

    await fireEvent.press(getByText('Delete room'));

    expect(alert).toHaveBeenCalledWith(
      'Delete room?',
      '"Kitchen" will be permanently removed. This will also delete 2 assets and their tasks and repair history. Documents linked to this room\'s assets will remain in your library.',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Delete', onPress: expect.any(Function) }),
      ]),
    );

    const actions = alert.mock.calls[0]?.[2] ?? [];
    const deleteAction = actions.find((action) => action.text === 'Delete');
    deleteAction?.onPress?.();

    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
