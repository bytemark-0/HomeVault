import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../src/context/HomeVaultContext';
import { AddTaskScreen } from '../../src/screens/AddTaskScreen';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import { navigateBackOrReplace } from '../../src/utils/navigation';
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
      showToast('Task saved');
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
        onCancel={() => navigateBackOrReplace('/(tabs)/maintenance')}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
