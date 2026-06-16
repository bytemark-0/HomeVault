import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';

import { useHomeVault } from '../../../src/context/HomeVaultContext';
import { SnoozeTaskScreen } from '../../../src/screens/SnoozeTaskScreen';
import { getHomeVaultRepository } from '../../../src/data/localHomeVaultRepository';
import { colors } from '../../../src/theme/colors';

export default function SnoozeTaskRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const task = appData.tasks.find((t) => t.id === id);
  if (!task) { router.back(); return null; }

  const handleSave = async (taskId: string, dueDate: string) => {
    try {
      const repo = await getHomeVaultRepository();
      await repo.updateTask({ ...task, dueDate, state: 'snoozed' });
      await reload();
      showToast('Task snoozed', 'info');
      router.replace(`/task/${id}`);
    } catch {
      showToast('Could not snooze task. Please try again.', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <SnoozeTaskScreen
        task={task}
        onCancel={() => router.back()}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
