import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';

import { useHomeVault } from '../../../src/context/HomeVaultContext';
import { CompleteTaskScreen } from '../../../src/screens/CompleteTaskScreen';
import { getHomeVaultRepository } from '../../../src/data/localHomeVaultRepository';
import type { CompleteTaskInput } from '@homevault/database';
import { colors } from '../../../src/theme/colors';
import { computeNextDueDate, getTaskStateForDate } from '../../../src/utils/taskUtils';

export default function CompleteTaskRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const task = appData.tasks.find((t) => t.id === id);
  if (!task) { router.back(); return null; }

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
        onCancel={() => router.back()}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
