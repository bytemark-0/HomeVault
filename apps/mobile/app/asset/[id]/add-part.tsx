import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../../src/context/HomeVaultContext';
import { MissingRecordView } from '../../../src/components/MissingRecordView';
import { AddPartScreen } from '../../../src/screens/AddPartScreen';
import { getHomeVaultRepository } from '../../../src/data/localHomeVaultRepository';
import { navigateBackOrReplace } from '../../../src/utils/navigation';
import type { CreatePartInput } from '@homevault/database';
import { colors } from '../../../src/theme/colors';

export default function AssetAddPartRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const asset = appData.assets.find((a) => a.id === id);
  if (!asset) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Asset not found"
          detail="This asset is no longer available for parts and supplies. Return to Inventory to choose another asset."
          actionLabel="Back to Inventory"
          onActionPress={() => router.replace('/(tabs)/inventory')}
        />
      </SafeAreaView>
    );
  }

  async function handleSave(input: CreatePartInput) {
    try {
      const repo = await getHomeVaultRepository();
      await repo.createPart(input);
      await reload();
      showToast('Part saved');
      navigateBackOrReplace(`/asset/${id}`);
    } catch {
      showToast('Could not save part. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AddPartScreen
        propertyId={appData.property.id}
        assetId={id}
        onCancel={() => navigateBackOrReplace(`/asset/${id}`)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
