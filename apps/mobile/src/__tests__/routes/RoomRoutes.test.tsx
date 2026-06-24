import { fireEvent, render, waitFor } from '@testing-library/react-native';

import type { CreateRoomInput, UpdateRoomInput } from '@homevault/database';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockUseLocalSearchParams = jest.fn();
const mockUseHomeVault = jest.fn();
const mockGetHomeVaultRepository = jest.fn();
let mockAddRoomSaveInput: CreateRoomInput | UpdateRoomInput = {
  propertyId: 'property-1',
  name: 'Kitchen',
  type: 'room',
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

jest.mock('../../screens/AddRoomScreen', () => ({
  AddRoomScreen: ({ onCancel, onSave }: { onCancel: () => void; onSave: (input: CreateRoomInput | UpdateRoomInput) => Promise<void> }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <>
        <Pressable accessibilityRole="button" onPress={() => void onSave(mockAddRoomSaveInput)}>
          <Text>trigger save</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onCancel}>
          <Text>trigger cancel</Text>
        </Pressable>
      </>
    );
  },
}));

jest.mock('../../screens/RoomDetailScreen', () => ({
  RoomDetailScreen: ({
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
  MissingRecordView: ({ actionLabel, onActionPress }: { actionLabel: string; onActionPress: () => void }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <Pressable accessibilityRole="button" onPress={onActionPress}>
        <Text>{actionLabel}</Text>
      </Pressable>
    );
  },
}));

const RoomDetailRoute = require('../../../app/room/[id]').default;
const EditRoomRoute = require('../../../app/room/[id]/edit').default;
const NewRoomRoute = require('../../../app/room/new').default;

const baseRoom = {
  id: 'room-kitchen',
  propertyId: 'property-1',
  name: 'Kitchen',
  type: 'room' as const,
  floor: 'Main',
  assetCount: 1,
  activeTaskCount: 1,
  attentionCount: 0,
};

function buildHomeVaultContext() {
  return {
    appData: {
      property: {
        id: 'property-1',
        householdId: 'household-1',
        label: 'Home',
        type: 'single_family' as const,
      },
      assetCount: 1,
      roomCount: 1,
      documentCount: 1,
      activeTaskCount: 1,
      healthScore: null,
      rooms: [baseRoom],
      assets: [
        {
          id: 'asset-1',
          propertyId: 'property-1',
          roomId: 'room-kitchen',
          name: 'Dishwasher',
          category: 'Appliance',
          roomName: 'Kitchen',
          status: 'ready' as const,
          statusLabel: 'Ready',
          documentCount: 1,
          taskCount: 1,
          repairCount: 1,
        },
      ],
      dueTasks: [],
      recentAssets: [],
      recentActivity: [],
      savedCostLabel: '$0',
      documents: [
        {
          id: 'document-1',
          propertyId: 'property-1',
          title: 'Manual',
          type: 'manual' as const,
          typeLabel: 'Manual',
          linkedRecordIds: ['asset-1'],
          linkedToLabel: 'Dishwasher',
          dateLabel: 'Jun 2026',
          attachmentStatus: 'attached' as const,
        },
      ],
      tasks: [
        {
          id: 'task-1',
          propertyId: 'property-1',
          scope: 'room' as const,
          scopeId: 'room-kitchen',
          scopeLabel: 'Kitchen',
          title: 'Check vent',
          dueDate: '2026-07-01',
          dueLabel: 'Jul 1',
          recurrenceKind: 'one_time' as const,
          recurrenceLabel: 'One time',
          state: 'upcoming' as const,
        },
      ],
      taskCompletions: [
        {
          id: 'completion-1',
          taskId: 'task-1',
          completedAt: '2026-06-01T00:00:00.000Z',
          completedAtLabel: 'Jun 1',
          costLabel: '$0',
        },
      ],
      repairEvents: [
        {
          id: 'repair-1',
          propertyId: 'property-1',
          assetId: 'asset-1',
          issue: 'Leak',
          date: '2026-06-10',
          dateLabel: 'Jun 10',
          summaryLabel: 'Resolved',
        },
      ],
      parts: [],
    },
    reload: jest.fn().mockResolvedValue(undefined),
    showToast: jest.fn(),
  };
}

describe('room routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ id: 'room-kitchen' });
    mockUseHomeVault.mockReturnValue(buildHomeVaultContext());
    mockGetHomeVaultRepository.mockResolvedValue({
      createRoom: jest.fn().mockResolvedValue({
        id: 'room-new',
        propertyId: 'property-1',
        name: 'Kitchen',
        type: 'room',
      }),
      updateRoom: jest.fn().mockResolvedValue({
        id: 'room-kitchen',
        propertyId: 'property-1',
        name: 'Kitchen',
        type: 'room',
      }),
      deleteRoom: jest.fn().mockResolvedValue(undefined),
    });
    mockRouter.canGoBack.mockReturnValue(false);
    mockAddRoomSaveInput = {
      propertyId: 'property-1',
      name: 'Kitchen',
      type: 'room',
    };
  });

  it('falls back to the new room detail screen after create when there is no history', async () => {
    const context = buildHomeVaultContext();
    const repo = {
      createRoom: jest.fn().mockResolvedValue({
        id: 'room-new',
        propertyId: 'property-1',
        name: 'Kitchen',
        type: 'room',
      }),
    };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { getByText } = await render(<NewRoomRoute />);

    fireEvent.press(getByText('trigger save'));

    await waitFor(() =>
      expect(repo.createRoom).toHaveBeenCalledWith({
        propertyId: 'property-1',
        name: 'Kitchen',
        type: 'room',
      }),
    );
    expect(context.reload).toHaveBeenCalledTimes(1);
    expect(context.showToast).toHaveBeenCalledWith('Room saved');
    expect(mockRouter.replace).toHaveBeenCalledWith('/room/room-new');
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it('uses back navigation for new-room cancel when history exists', async () => {
    mockRouter.canGoBack.mockReturnValue(true);

    const { getByText } = await render(<NewRoomRoute />);

    fireEvent.press(getByText('trigger cancel'));

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('falls back to the room detail screen after edit when there is no history', async () => {
    const context = buildHomeVaultContext();
    const repo = {
      updateRoom: jest.fn().mockResolvedValue({
        id: 'room-kitchen',
        propertyId: 'property-1',
        name: 'Kitchen updated',
        type: 'area',
      }),
    };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);
    mockAddRoomSaveInput = {
      propertyId: 'property-1',
      id: 'room-kitchen',
      name: 'Kitchen updated',
      type: 'area',
    };

    const { getByText } = await render(<EditRoomRoute />);

    fireEvent.press(getByText('trigger save'));

    await waitFor(() =>
      expect(repo.updateRoom).toHaveBeenCalledWith({
        propertyId: 'property-1',
        id: 'room-kitchen',
        name: 'Kitchen updated',
        type: 'area',
      }),
    );
    expect(context.reload).toHaveBeenCalledTimes(1);
    expect(context.showToast).toHaveBeenCalledWith('Room updated');
    expect(mockRouter.replace).toHaveBeenCalledWith('/room/room-kitchen');
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it('falls back to Household when leaving room detail without history', async () => {
    const { getByText } = await render(<RoomDetailRoute />);

    fireEvent.press(getByText('trigger back'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/household');
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it('deletes the room and returns to Household', async () => {
    const context = buildHomeVaultContext();
    const repo = {
      deleteRoom: jest.fn().mockResolvedValue(undefined),
    };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { getByText } = await render(<RoomDetailRoute />);

    fireEvent.press(getByText('trigger delete'));

    await waitFor(() => expect(repo.deleteRoom).toHaveBeenCalledWith('room-kitchen'));
    expect(context.showToast).toHaveBeenCalledWith('Room deleted', 'error');
    expect(context.reload).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/household');
  });
});
