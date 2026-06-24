import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../../../../src/context/HomeVaultContext';
import { MissingRecordView } from '../../../../../src/components/MissingRecordView';
import { CompleteTaskScreen } from '../../../../../src/screens/CompleteTaskScreen';
import { getHomeVaultRepository } from '../../../../../src/data/localHomeVaultRepository';
import { navigateBackOrReplace } from '../../../../../src/utils/navigation';
import type { UpdateTaskCompletionInput } from '@homevault/database';
import { colors } from '../../../../../src/theme/colors';

export default function EditCompletionRoute() {
  const { id, completionId } = useLocalSearchParams<{ id: string; completionId: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const task = appData.tasks.find((t) => t.id === id);
  const completion = appData.taskCompletions.find((c) => c.id === completionId);
  if (!task || !completion) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Completion not found"
          detail="This completion is no longer available to edit. Return to the task to review the latest history."
          actionLabel="Back to Task"
          onActionPress={() => router.replace(`/task/${id}`)}
        />
      </SafeAreaView>
    );
  }

  async function handleSave(input: UpdateTaskCompletionInput) {
    try {
      const repo = await getHomeVaultRepository();
      await repo.updateTaskCompletion(input);
      await reload();
      showToast('Completion updated');
      navigateBackOrReplace(`/task/${id}`);
    } catch {
      showToast('Could not update completion. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <CompleteTaskScreen
        task={task}
        completion={completion}
        onCancel={() => navigateBackOrReplace(`/task/${id}`)}
        onSave={(input) => handleSave(input as UpdateTaskCompletionInput)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
