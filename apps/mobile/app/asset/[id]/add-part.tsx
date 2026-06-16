import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';

import { useHomeVault } from '../../../src/context/HomeVaultContext';
import { AddPartScreen } from '../../../src/screens/AddPartScreen';
import { getHomeVaultRepository } from '../../../src/data/localHomeVaultRepository';
import type { CreatePartInput } from '@homevault/database';
import { colors } from '../../../src/theme/colors';

export default function AssetAddPartRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  async function handleSave(input: CreatePartInput) {
    try {
      const repo = await getHomeVaultRepository();
      await repo.createPart(input);
      await reload();
      showToast('Part saved');
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
        onCancel={() => router.back()}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
