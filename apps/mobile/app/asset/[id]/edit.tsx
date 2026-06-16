import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';

import { useHomeVault } from '../../../src/context/HomeVaultContext';
import { AddAssetScreen } from '../../../src/screens/AddAssetScreen';
import { getHomeVaultRepository } from '../../../src/data/localHomeVaultRepository';
import type { CreateAssetInput } from '@homevault/database';
import { colors } from '../../../src/theme/colors';

export default function EditAssetRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const asset = appData.assets.find((a) => a.id === id);
  if (!asset) { router.back(); return null; }

  async function handleSave(input: CreateAssetInput) {
    if (!input.id) return;
    try {
      const repo = await getHomeVaultRepository();
      await repo.updateAsset({ ...input, id: input.id });
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
        asset={asset}
        onCancel={() => router.back()}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
