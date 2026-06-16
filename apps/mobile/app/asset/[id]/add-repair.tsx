import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../../src/context/HomeVaultContext';
import { AddRepairEventScreen } from '../../../src/screens/AddRepairEventScreen';
import { getHomeVaultRepository } from '../../../src/data/localHomeVaultRepository';
import type { CreateRepairEventInput } from '@homevault/database';
import { colors } from '../../../src/theme/colors';

export default function AssetAddRepairRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const asset = appData.assets.find((a) => a.id === id);

  async function handleSave(input: CreateRepairEventInput) {
    try {
      const repo = await getHomeVaultRepository();
      await repo.createRepairEvent(input);
      await reload();
      showToast('Repair recorded');
      router.back();
    } catch {
      showToast('Could not save repair. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AddRepairEventScreen
        asset={asset ?? undefined}
        assets={appData.assets}
        propertyId={appData.property.id}
        onCancel={() => router.back()}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
