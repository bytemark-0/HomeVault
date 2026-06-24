import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { SearchScreen } from '../../screens/SearchScreen';
import type {
  AssetListItem,
  DocumentListItem,
  RoomListItem,
  TaskListItem,
} from '../../data/homeVaultSampleData';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('SearchScreen', () => {
  const assets: AssetListItem[] = [
    {
      id: 'asset-hvac',
      propertyId: 'property-1',
      roomId: 'room-utility',
      name: 'Main HVAC',
      category: 'Heating & cooling',
      brand: 'Trane',
      model: 'XR16-042',
      serial: '2210-004582',
      status: 'needs_attention',
      roomName: 'Utility',
      documentCount: 1,
      lastServiceLabel: 'Apr 18, 2026',
      nextTaskLabel: 'Replace filter',
      warrantyExpiringSoon: false,
    },
  ];

  const documents: DocumentListItem[] = [
    {
      id: 'document-1',
      propertyId: 'property-1',
      title: 'HVAC Manual',
      type: 'manual',
      typeLabel: 'Manual',
      linkedRecordIds: ['asset-hvac'],
      linkedToLabel: 'Main HVAC',
      dateLabel: 'Apr 2026',
      linkedRecords: [],
      vendor: 'Trane',
    },
  ];

  const rooms: RoomListItem[] = [
    {
      id: 'room-utility',
      propertyId: 'property-1',
      name: 'Utility',
      type: 'room',
      assetCount: 1,
      activeTaskCount: 1,
      attentionCount: 1,
    },
  ];

  const tasks: TaskListItem[] = [
    {
      id: 'task-1',
      propertyId: 'property-1',
      scope: 'asset',
      scopeId: 'asset-hvac',
      title: 'Replace HVAC filter',
      dueDate: '2026-07-01',
      dueLabel: 'Jul 1',
      recurrenceKind: 'interval',
      recurrenceLabel: 'Every 90 days',
      state: 'upcoming',
      scopeLabel: 'Main HVAC',
    },
  ];

  it('finds an asset by model and opens the asset detail callback', async () => {
    const onAssetPress = jest.fn();
    const { getByPlaceholderText, getByText } = await render(
      <SearchScreen
        assets={assets}
        documents={documents}
        rooms={rooms}
        tasks={tasks}
        onAssetPress={onAssetPress}
        onDocumentPress={jest.fn()}
        onRoomPress={jest.fn()}
        onTaskPress={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    await fireEvent.changeText(getByPlaceholderText('Search assets, documents, tasks, rooms…'), 'XR16');
    await waitFor(() => expect(getByText('Main HVAC')).toBeTruthy());

    await fireEvent.press(getByText('Main HVAC'));
    expect(onAssetPress).toHaveBeenCalledWith('asset-hvac');
  });

  it('finds a document by type and opens the document detail callback', async () => {
    const onDocumentPress = jest.fn();
    const { getByPlaceholderText, getByText } = await render(
      <SearchScreen
        assets={assets}
        documents={documents}
        rooms={rooms}
        tasks={tasks}
        onAssetPress={jest.fn()}
        onDocumentPress={onDocumentPress}
        onRoomPress={jest.fn()}
        onTaskPress={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    await fireEvent.changeText(getByPlaceholderText('Search assets, documents, tasks, rooms…'), 'Manual');
    await waitFor(() => expect(getByText('HVAC Manual')).toBeTruthy());

    await fireEvent.press(getByText('HVAC Manual'));
    expect(onDocumentPress).toHaveBeenCalledWith('document-1');
  });

  it('finds a document by title and opens the document detail callback', async () => {
    const onDocumentPress = jest.fn();
    const { getByPlaceholderText, getByText } = await render(
      <SearchScreen
        assets={assets}
        documents={documents}
        rooms={rooms}
        tasks={tasks}
        onAssetPress={jest.fn()}
        onDocumentPress={onDocumentPress}
        onRoomPress={jest.fn()}
        onTaskPress={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    await fireEvent.changeText(getByPlaceholderText('Search assets, documents, tasks, rooms…'), 'HVAC');
    await waitFor(() => expect(getByText('HVAC Manual')).toBeTruthy());

    await fireEvent.press(getByText('HVAC Manual'));
    expect(onDocumentPress).toHaveBeenCalledWith('document-1');
  });
});
