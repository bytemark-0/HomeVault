import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';

import { useHomeVault } from '../../../../../src/context/HomeVaultContext';
import { AddRepairEventScreen } from '../../../../../src/screens/AddRepairEventScreen';
import { getHomeVaultRepository } from '../../../../../src/data/localHomeVaultRepository';
import type { UpdateRepairEventInput } from '@homevault/database';
import { colors } from '../../../../../src/theme/colors';

export default function EditRepairRoute() {
  const { id, repairId } = useLocalSearchParams<{ id: string; repairId: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const asset = appData.assets.find((a) => a.id === id);
  const repairEvent = appData.repairEvents.find((r) => r.id === repairId);
  if (!repairEvent) { router.back(); return null; }

  async function handleSave(input: UpdateRepairEventInput) {
    try {
      const repo = await getHomeVaultRepository();
      await repo.updateRepairEvent(input);
      await reload();
      showToast('Repair updated');
      router.back();
    } catch {
      showToast('Could not update repair. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AddRepairEventScreen
        asset={asset ?? undefined}
        assets={appData.assets}
        propertyId={appData.property.id}
        repairEvent={repairEvent}
        onCancel={() => router.back()}
        onSave={(input) => handleSave(input as UpdateRepairEventInput)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
