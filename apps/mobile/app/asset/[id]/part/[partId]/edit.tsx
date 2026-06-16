import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../../../../src/context/HomeVaultContext';
import { AddPartScreen } from '../../../../../src/screens/AddPartScreen';
import { getHomeVaultRepository } from '../../../../../src/data/localHomeVaultRepository';
import type { CreatePartInput, UpdatePartInput } from '@homevault/database';
import { colors } from '../../../../../src/theme/colors';

export default function EditPartRoute() {
  const { id, partId } = useLocalSearchParams<{ id: string; partId: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const part = appData.parts.find((p) => p.id === partId);
  if (!part) { router.back(); return null; }

  async function handleSave(input: CreatePartInput) {
    try {
      const repo = await getHomeVaultRepository();
      await repo.updatePart(input as UpdatePartInput);
      await reload();
      showToast('Part updated');
      router.back();
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
        onCancel={() => router.back()}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
