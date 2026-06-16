import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../src/context/HomeVaultContext';
import { EditPropertyScreen } from '../../src/screens/EditPropertyScreen';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import type { UpdatePropertyInput } from '@homevault/database';
import { colors } from '../../src/theme/colors';

export default function EditPropertyRoute() {
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  async function handleSave(input: UpdatePropertyInput) {
    try {
      const repo = await getHomeVaultRepository();
      await repo.updateProperty(input);
      await reload();
      router.back();
    } catch {
      showToast('Could not save property. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <EditPropertyScreen
        property={appData.property}
        onCancel={() => router.back()}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
