import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';

import { useHomeVault } from '../../../src/context/HomeVaultContext';
import { AddDocumentScreen } from '../../../src/screens/AddDocumentScreen';
import { getHomeVaultRepository } from '../../../src/data/localHomeVaultRepository';
import type { CreateDocumentInput } from '@homevault/database';
import { colors } from '../../../src/theme/colors';

export default function AssetAddDocumentRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  async function handleSave(input: CreateDocumentInput) {
    try {
      const repo = await getHomeVaultRepository();
      await repo.createDocument(input);
      await reload();
      router.back();
    } catch {
      showToast('Could not save document. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AddDocumentScreen
        propertyId={appData.property.id}
        assets={appData.assets}
        rooms={appData.rooms}
        initialLinkedRecordId={id}
        onCancel={() => router.back()}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
