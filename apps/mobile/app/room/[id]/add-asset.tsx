import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';

import { useHomeVault } from '../../../src/context/HomeVaultContext';
import { AddAssetScreen } from '../../../src/screens/AddAssetScreen';
import { getHomeVaultRepository } from '../../../src/data/localHomeVaultRepository';
import type { CreateAssetInput } from '@homevault/database';
import { colors } from '../../../src/theme/colors';

export default function RoomAddAssetRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  async function handleSave(input: CreateAssetInput) {
    try {
      const repo = await getHomeVaultRepository();
      await repo.createAsset(input);
      await reload();
      router.back();
    } catch {
      showToast('Could not save asset. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AddAssetScreen
        propertyId={appData.property.id}
        rooms={appData.rooms}
        initialRoomId={id}
        onCancel={() => router.back()}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
