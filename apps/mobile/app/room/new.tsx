import { router } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';

import { useHomeVault } from '../../src/context/HomeVaultContext';
import { AddRoomScreen } from '../../src/screens/AddRoomScreen';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import type { CreateRoomInput } from '@homevault/database';
import { colors } from '../../src/theme/colors';

export default function NewRoomRoute() {
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  async function handleSave(input: CreateRoomInput) {
    try {
      const repo = await getHomeVaultRepository();
      await repo.createRoom(input);
      await reload();
      router.back();
    } catch {
      showToast('Could not save room. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AddRoomScreen
        propertyId={appData.property.id}
        onCancel={() => router.back()}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
