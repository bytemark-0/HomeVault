import { fireEvent, render, waitFor } from '@testing-library/react-native';

import type {
  CompleteTaskInput,
  CreateTaskInput,
  UpdateTaskCompletionInput,
  UpdateTaskInput,
} from '@homevault/database';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockUseLocalSearchParams = jest.fn();
const mockUseHomeVault = jest.fn();
const mockGetHomeVaultRepository = jest.fn();
let mockTaskSaveInput: CreateTaskInput | UpdateTaskInput = {
  propertyId: 'property-1',
  title: 'Replace filter',
  dueDate: '2026-07-01',
  recurrenceKind: 'one_time',
  recurrenceLabel: 'One time',
  scope: 'asset',
  scopeId: 'asset-1',
  state: 'upcoming',
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

jest.mock('../../utils/taskUtils', () => ({
  computeNextDueDate: jest.fn(() => '2026-08-01'),
  getTaskStateForDate: jest.fn(() => 'upcoming'),
}));

jest.mock('../../screens/AddTaskScreen', () => ({
  AddTaskScreen: ({ onCancel, onSave }: { onCancel: () => void; onSave: (input: CreateTaskInput | UpdateTaskInput) => Promise<void> }) => {
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Pressable accessibilityRole="button" onPress={() => void onSave(mockTaskSaveInput)}>
          <Text>trigger save</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onCancel}>
          <Text>trigger cancel</Text>
        </Pressable>
      </>
    );
  },
}));

jest.mock('../../screens/TaskDetailScreen', () => ({
  TaskDetailScreen: ({ onBack, onDelete }: { onBack: () => void; onDelete: () => Promise<void> }) => {
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Text>trigger back</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => void onDelete()}>
          <Text>trigger delete</Text>
        </Pressable>
      </>
    );
  },
}));

jest.mock('../../screens/CompleteTaskScreen', () => ({
  CompleteTaskScreen: ({
    onCancel,
    onSave,
  }: {
    onCancel: () => void;
    onSave: (input: CompleteTaskInput | UpdateTaskCompletionInput) => Promise<void>;
  }) => {
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Pressable accessibilityRole="button" onPress={() => void onSave({ taskId: 'task-1', completedAt: '2026-06-12T12:00:00.000Z' })}>
          <Text>trigger completion save</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onCancel}>
          <Text>trigger completion cancel</Text>
        </Pressable>
      </>
    );
  },
}));

jest.mock('../../screens/SnoozeTaskScreen', () => ({
  SnoozeTaskScreen: ({
    onCancel,
    onSave,
  }: {
    onCancel: () => void;
    onSave: (taskId: string, dueDate: string) => Promise<void>;
  }) => {
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Pressable accessibilityRole="button" onPress={() => void onSave('task-1', '2026-07-15')}>
          <Text>trigger snooze save</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onCancel}>
          <Text>trigger snooze cancel</Text>
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

const TaskDetailRoute = require('../../../app/task/[id]').default;
const EditTaskRoute = require('../../../app/task/[id]/edit').default;
const CompleteTaskRoute = require('../../../app/task/[id]/complete').default;
const SnoozeTaskRoute = require('../../../app/task/[id]/snooze').default;
const EditCompletionRoute = require('../../../app/task/[id]/completion/[completionId]/edit').default;

function buildHomeVaultContext() {
  return {
    appData: {
      property: { id: 'property-1', householdId: 'household-1', label: 'Home', type: 'single_family' as const },
      assets: [{ id: 'asset-1', propertyId: 'property-1', name: 'Dishwasher', category: 'Appliance', status: 'ready' as const, roomName: 'Kitchen', documentCount: 0, lastServiceLabel: 'No', nextTaskLabel: 'None', warrantyExpiringSoon: false }],
      rooms: [],
      documents: [],
      tasks: [{ id: 'task-1', propertyId: 'property-1', scope: 'asset' as const, scopeId: 'asset-1', title: 'Replace filter', dueDate: '2026-07-01', dueLabel: 'Jul 1', recurrenceKind: 'interval' as const, recurrenceLabel: 'Every 90 days', state: 'upcoming' as const, scopeLabel: 'Dishwasher' }],
      taskCompletions: [{ id: 'completion-1', taskId: 'task-1', completedAt: '2026-06-01T12:00:00.000Z' }],
      repairEvents: [],
      parts: [],
      assetCount: 1,
      roomCount: 0,
      documentCount: 0,
      activeTaskCount: 1,
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

describe('task routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ id: 'task-1', completionId: 'completion-1' });
    mockUseHomeVault.mockReturnValue(buildHomeVaultContext());
    mockGetHomeVaultRepository.mockResolvedValue({
      deleteTask: jest.fn().mockResolvedValue(undefined),
      updateTask: jest.fn().mockResolvedValue(undefined),
      completeTask: jest.fn().mockResolvedValue(undefined),
      updateTaskCompletion: jest.fn().mockResolvedValue(undefined),
    });
    mockRouter.canGoBack.mockReturnValue(false);
  });

  it('shows a recovery view when the task detail route is stale', async () => {
    const context = buildHomeVaultContext();
    context.appData.tasks = [];
    mockUseHomeVault.mockReturnValue(context);

    const { getByText } = await render(<TaskDetailRoute />);
    fireEvent.press(getByText('Back to Maintenance'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/maintenance');
  });

  it('falls back to the task detail screen after edit when there is no history', async () => {
    const context = buildHomeVaultContext();
    const repo = { updateTask: jest.fn().mockResolvedValue(undefined) };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);
    mockTaskSaveInput = {
      id: 'task-1',
      propertyId: 'property-1',
      title: 'Replace filter updated',
      dueDate: '2026-07-01',
      recurrenceKind: 'one_time',
      recurrenceLabel: 'One time',
      scope: 'asset',
      scopeId: 'asset-1',
      state: 'upcoming',
    };

    const { getByText } = await render(<EditTaskRoute />);
    fireEvent.press(getByText('trigger save'));

    await waitFor(() => expect(repo.updateTask).toHaveBeenCalled());
    expect(context.showToast).toHaveBeenCalledWith('Task updated');
    expect(mockRouter.replace).toHaveBeenCalledWith('/task/task-1');
  });

  it('deletes the task and returns to Maintenance', async () => {
    const context = buildHomeVaultContext();
    const repo = { deleteTask: jest.fn().mockResolvedValue(undefined) };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { getByText } = await render(<TaskDetailRoute />);
    fireEvent.press(getByText('trigger delete'));

    await waitFor(() => expect(repo.deleteTask).toHaveBeenCalledWith('task-1'));
    expect(context.showToast).toHaveBeenCalledWith('Task deleted', 'error');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/maintenance');
  });

  it('falls back to the task detail screen when canceling complete without history', async () => {
    const { getByText } = await render(<CompleteTaskRoute />);
    fireEvent.press(getByText('trigger completion cancel'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/task/task-1');
  });

  it('returns to the task detail screen after saving a completion', async () => {
    const context = buildHomeVaultContext();
    const repo = {
      completeTask: jest.fn().mockResolvedValue(undefined),
      updateTask: jest.fn().mockResolvedValue(undefined),
    };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { getByText } = await render(<CompleteTaskRoute />);
    fireEvent.press(getByText('trigger completion save'));

    await waitFor(() => expect(repo.completeTask).toHaveBeenCalled());
    expect(repo.updateTask).toHaveBeenCalled();
    expect(context.showToast).toHaveBeenCalledWith('Task completed — next due date scheduled');
    expect(mockRouter.replace).toHaveBeenCalledWith('/task/task-1');
  });

  it('shows a recovery view when the completion edit route is stale', async () => {
    const context = buildHomeVaultContext();
    context.appData.taskCompletions = [];
    mockUseHomeVault.mockReturnValue(context);

    const { getByText } = await render(<EditCompletionRoute />);
    fireEvent.press(getByText('Back to Task'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/task/task-1');
  });

  it('falls back to the task detail screen when canceling snooze without history', async () => {
    const { getByText } = await render(<SnoozeTaskRoute />);
    fireEvent.press(getByText('trigger snooze cancel'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/task/task-1');
  });

  it('returns to the task detail screen after saving a snooze', async () => {
    const context = buildHomeVaultContext();
    const repo = { updateTask: jest.fn().mockResolvedValue(undefined) };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { getByText } = await render(<SnoozeTaskRoute />);
    fireEvent.press(getByText('trigger snooze save'));

    await waitFor(() => expect(repo.updateTask).toHaveBeenCalled());
    expect(context.showToast).toHaveBeenCalledWith('Task snoozed', 'info');
    expect(mockRouter.replace).toHaveBeenCalledWith('/task/task-1');
  });
});
