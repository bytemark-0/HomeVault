import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../../../../src/context/HomeVaultContext';
import { MissingRecordView } from '../../../../../src/components/MissingRecordView';
import { AddRepairEventScreen } from '../../../../../src/screens/AddRepairEventScreen';
import { getHomeVaultRepository } from '../../../../../src/data/localHomeVaultRepository';
import { navigateBackOrReplace } from '../../../../../src/utils/navigation';
import type { UpdateRepairEventInput } from '@homevault/database';
import { colors } from '../../../../../src/theme/colors';

export default function EditRepairRoute() {
  const { id, repairId } = useLocalSearchParams<{ id: string; repairId: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const asset = appData.assets.find((a) => a.id === id);
  const repairEvent = appData.repairEvents.find((r) => r.id === repairId);
  if (!asset || !repairEvent) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Repair not found"
          detail="This repair record is no longer available to edit. Return to the asset to review the latest service history."
          actionLabel="Back to Asset"
          onActionPress={() => router.replace(asset ? `/asset/${id}` : '/(tabs)/inventory')}
        />
      </SafeAreaView>
    );
  }

  async function handleSave(input: UpdateRepairEventInput) {
    try {
      const repo = await getHomeVaultRepository();
      await repo.updateRepairEvent(input);
      await reload();
      showToast('Repair updated');
      navigateBackOrReplace(`/asset/${id}`);
    } catch {
      showToast('Could not update repair. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AddRepairEventScreen
        asset={asset}
        assets={appData.assets}
        propertyId={appData.property.id}
        repairEvent={repairEvent}
        onCancel={() => navigateBackOrReplace(`/asset/${id}`)}
        onSave={(input) => handleSave(input as UpdateRepairEventInput)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
