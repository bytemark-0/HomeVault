import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';

import { useHomeVault } from '../../../src/context/HomeVaultContext';
import { AddTaskScreen } from '../../../src/screens/AddTaskScreen';
import { getHomeVaultRepository } from '../../../src/data/localHomeVaultRepository';
import type { CreateTaskInput, UpdateTaskInput } from '@homevault/database';
import { colors } from '../../../src/theme/colors';

export default function EditTaskRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const task = appData.tasks.find((t) => t.id === id);
  if (!task) { router.back(); return null; }

  const handleSave = async (input: CreateTaskInput | UpdateTaskInput) => {
    if (!input.id) return;
    try {
      const repo = await getHomeVaultRepository();
      await repo.updateTask(input as UpdateTaskInput);
      await reload();
      router.back();
    } catch {
      showToast('Could not save task. Please try again.', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AddTaskScreen
        propertyId={appData.property.id}
        assets={appData.assets}
        rooms={appData.rooms}
        task={task}
        onCancel={() => router.back()}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
