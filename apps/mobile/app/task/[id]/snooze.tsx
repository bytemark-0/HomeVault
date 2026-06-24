import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../../src/context/HomeVaultContext';
import { MissingRecordView } from '../../../src/components/MissingRecordView';
import { SnoozeTaskScreen } from '../../../src/screens/SnoozeTaskScreen';
import { getHomeVaultRepository } from '../../../src/data/localHomeVaultRepository';
import { navigateBackOrReplace } from '../../../src/utils/navigation';
import { colors } from '../../../src/theme/colors';

export default function SnoozeTaskRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const task = appData.tasks.find((t) => t.id === id);
  if (!task) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Task not found"
          detail="This task is no longer available to snooze. Return to Maintenance to keep working with the current schedule."
          actionLabel="Back to Maintenance"
          onActionPress={() => router.replace('/(tabs)/maintenance')}
        />
      </SafeAreaView>
    );
  }

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
        onCancel={() => navigateBackOrReplace(`/task/${id}`)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
