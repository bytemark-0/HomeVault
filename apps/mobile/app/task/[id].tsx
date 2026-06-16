import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';

import { useHomeVault } from '../../src/context/HomeVaultContext';
import { TaskDetailScreen } from '../../src/screens/TaskDetailScreen';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import { colors } from '../../src/theme/colors';
import { computeNextDueDate, getTaskStateForDate } from '../../src/utils/taskUtils';

export default function TaskDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const task = appData.tasks.find((t) => t.id === id);
  if (!task) { router.back(); return null; }

  const completions = appData.taskCompletions.filter((c) => c.taskId === id);

  const handleDelete = async () => {
    const repo = await getHomeVaultRepository();
    await repo.deleteTask(id);
    await reload();
    showToast('Task deleted', 'error');
    router.back();
  };

  const handleSkip = async () => {
    if (task.state === 'completed') return;
    try {
      const repo = await getHomeVaultRepository();
      await repo.completeTask({ taskId: id, completedAt: new Date().toISOString(), kind: 'skipped' });
      if (task.recurrenceKind !== 'one_time') {
        const nextDueDate = computeNextDueDate(task.recurrenceLabel, new Date().toISOString());
        if (nextDueDate) {
          await repo.updateTask({ ...task, dueDate: nextDueDate, state: getTaskStateForDate(nextDueDate) });
        }
      }
      await reload();
      showToast('Task skipped', 'info');
    } catch {
      showToast('Could not record skip. Please try again.', 'error');
    }
  };

  const handleDeleteCompletion = async (completionId: string) => {
    try {
      const repo = await getHomeVaultRepository();
      await repo.deleteTaskCompletion(completionId);
      await reload();
      showToast('Completion deleted');
    } catch {
      showToast('Could not delete completion. Please try again.', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TaskDetailScreen
        task={task}
        completions={completions}
        onBack={() => router.back()}
        onComplete={() => router.push(`/task/${id}/complete`)}
        onDelete={handleDelete}
        onSkip={() => void handleSkip()}
        onSnooze={() => router.push(`/task/${id}/snooze`)}
        onEdit={() => router.push(`/task/${id}/edit`)}
        onEditCompletion={(completionId) =>
          router.push(`/task/${id}/completion/${completionId}/edit`)
        }
        onDeleteCompletion={handleDeleteCompletion}
        onViewScope={
          task.scope === 'asset'
            ? () => router.push(`/asset/${task.scopeId}`)
            : task.scope === 'room'
              ? () => router.push(`/room/${task.scopeId}`)
              : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
