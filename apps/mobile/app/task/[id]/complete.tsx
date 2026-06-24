import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../../src/context/HomeVaultContext';
import { MissingRecordView } from '../../../src/components/MissingRecordView';
import { CompleteTaskScreen } from '../../../src/screens/CompleteTaskScreen';
import { getHomeVaultRepository } from '../../../src/data/localHomeVaultRepository';
import { navigateBackOrReplace } from '../../../src/utils/navigation';
import type { CompleteTaskInput } from '@homevault/database';
import { colors } from '../../../src/theme/colors';
import { computeNextDueDate, getTaskStateForDate } from '../../../src/utils/taskUtils';

export default function CompleteTaskRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const task = appData.tasks.find((t) => t.id === id);
  if (!task) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Task not found"
          detail="This task is no longer available to complete. Return to Maintenance to pick another task."
          actionLabel="Back to Maintenance"
          onActionPress={() => router.replace('/(tabs)/maintenance')}
        />
      </SafeAreaView>
    );
  }

  const handleSave = async (input: CompleteTaskInput) => {
    try {
      const repo = await getHomeVaultRepository();
      await repo.completeTask(input);

      if (task.recurrenceKind !== 'one_time') {
        const nextDueDate = computeNextDueDate(task.recurrenceLabel, input.completedAt);
        if (nextDueDate) {
          await repo.updateTask({
            ...task,
            dueDate: nextDueDate,
            state: getTaskStateForDate(nextDueDate),
          });
          showToast('Task completed — next due date scheduled');
        } else {
          showToast('Task completed');
        }
      } else {
        showToast('Task completed');
      }

      await reload();
      router.replace(`/task/${id}`);
    } catch {
      showToast('Could not save completion. Please try again.', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <CompleteTaskScreen
        task={task}
        onCancel={() => navigateBackOrReplace(`/task/${id}`)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
