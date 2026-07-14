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
import { getAssetMode } from '../../../src/utils/deviceMetadata';

export default function EditAssetRoute() {
  const { id, source } = useLocalSearchParams<{ id: string; source?: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const asset = appData.assets.find((a) => a.id === id);
  const fallbackRoute =
    source === 'devices' || getAssetMode(asset) === 'device'
      ? '/(tabs)/devices'
      : '/(tabs)/inventory';
  if (!asset) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Asset not found"
          detail="This asset is no longer available to edit. Return to Inventory to choose another record or add it again."
          actionLabel={fallbackRoute === '/(tabs)/devices' ? 'Back to Devices' : 'Back to Inventory'}
          onActionPress={() => router.replace(fallbackRoute)}
        />
      </SafeAreaView>
    );
  }
  const resolvedAsset = asset;

  async function handleSave(input: CreateAssetInput) {
    if (!input.id) return;
    try {
      const repo = await getHomeVaultRepository();
      await repo.updateAsset({
        ...input,
        id: input.id,
        lastReviewedAt: resolvedAsset.lastReviewedAt,
      });
      await reload();
      showToast('Asset updated');
      navigateBackOrReplace(
        source === 'devices' || getAssetMode(asset) === 'device'
          ? `/asset/${id}?source=devices`
          : `/asset/${id}`,
      );
    } catch {
      showToast('Could not save asset. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AddAssetScreen
        propertyId={appData.property.id}
        rooms={appData.rooms}
        asset={resolvedAsset}
        mode={getAssetMode(resolvedAsset)}
        onCancel={() =>
          navigateBackOrReplace(
            source === 'devices' || getAssetMode(resolvedAsset) === 'device'
              ? `/asset/${id}?source=devices`
              : `/asset/${id}`,
          )
        }
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
