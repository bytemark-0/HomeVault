import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../../src/context/HomeVaultContext';
import { MissingRecordView } from '../../../src/components/MissingRecordView';
import { AddAssetScreen } from '../../../src/screens/AddAssetScreen';
import { getHomeVaultRepository } from '../../../src/data/localHomeVaultRepository';
import { navigateBackOrReplace } from '../../../src/utils/navigation';
import type { CreateAssetInput } from '@homevault/database';
import { colors } from '../../../src/theme/colors';

export default function EditAssetRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const asset = appData.assets.find((a) => a.id === id);
  if (!asset) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Asset not found"
          detail="This asset is no longer available to edit. Return to Inventory to choose another record or add it again."
          actionLabel="Back to Inventory"
          onActionPress={() => router.replace('/(tabs)/inventory')}
        />
      </SafeAreaView>
    );
  }

  async function handleSave(input: CreateAssetInput) {
    if (!input.id) return;
    try {
      const repo = await getHomeVaultRepository();
      await repo.updateAsset({ ...input, id: input.id });
      await reload();
      showToast('Asset updated');
      navigateBackOrReplace(`/asset/${id}`);
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
        onCancel={() => navigateBackOrReplace(`/asset/${id}`)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
