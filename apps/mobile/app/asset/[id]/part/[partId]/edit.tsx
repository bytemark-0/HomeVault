import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../../../../src/context/HomeVaultContext';
import { MissingRecordView } from '../../../../../src/components/MissingRecordView';
import { AddPartScreen } from '../../../../../src/screens/AddPartScreen';
import { getHomeVaultRepository } from '../../../../../src/data/localHomeVaultRepository';
import { navigateBackOrReplace } from '../../../../../src/utils/navigation';
import type { CreatePartInput, UpdatePartInput } from '@homevault/database';
import { colors } from '../../../../../src/theme/colors';

export default function EditPartRoute() {
  const { id, partId } = useLocalSearchParams<{ id: string; partId: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const asset = appData.assets.find((a) => a.id === id);
  const part = appData.parts.find((p) => p.id === partId);
  if (!asset || !part) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Part not found"
          detail="This part or supply record is no longer available to edit. Return to the asset to review the latest details."
          actionLabel="Back to Asset"
          onActionPress={() => router.replace(asset ? `/asset/${id}` : '/(tabs)/inventory')}
        />
      </SafeAreaView>
    );
  }

  async function handleSave(input: CreatePartInput) {
    try {
      const repo = await getHomeVaultRepository();
      await repo.updatePart(input as UpdatePartInput);
      await reload();
      showToast('Part updated');
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
        part={part}
        onCancel={() => navigateBackOrReplace(`/asset/${id}`)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
