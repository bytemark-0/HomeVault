import { router } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';

import { useHomeVault } from '../../src/context/HomeVaultContext';
import { AddTaskScreen } from '../../src/screens/AddTaskScreen';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import type { CreateTaskInput } from '@homevault/database';
import { colors } from '../../src/theme/colors';

export default function NewTaskRoute() {
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  async function handleSave(input: CreateTaskInput) {
    try {
      const repo = await getHomeVaultRepository();
      await repo.createTask(input);
      await reload();
      router.replace('/(tabs)/maintenance');
    } catch {
      showToast('Could not save task. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AddTaskScreen
        propertyId={appData.property.id}
        assets={appData.assets}
        rooms={appData.rooms}
        onCancel={() => router.back()}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
