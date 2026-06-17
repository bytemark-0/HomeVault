import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../src/context/HomeVaultContext';
import { AddAssetScreen } from '../../src/screens/AddAssetScreen';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import type { CreateAssetInput } from '@homevault/database';
import { colors } from '../../src/theme/colors';

export default function NewAssetRoute() {
  const { copyFromId } = useLocalSearchParams<{ copyFromId?: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  const copyFrom = copyFromId ? appData.assets.find((a) => a.id === copyFromId) : undefined;

  async function handleSave(input: CreateAssetInput) {
    try {
      const repo = await getHomeVaultRepository();
      await repo.createAsset(input);
      await reload();
      showToast('Asset saved');
      router.replace('/(tabs)/inventory');
    } catch {
      showToast('Could not save asset. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AddAssetScreen
        propertyId={appData.property.id}
        rooms={appData.rooms}
        copyFrom={copyFrom}
        onCancel={() => router.back()}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
