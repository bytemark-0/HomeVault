import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../../src/context/HomeVaultContext';
import { AddDocumentScreen } from '../../../src/screens/AddDocumentScreen';
import { getHomeVaultRepository } from '../../../src/data/localHomeVaultRepository';
import type { CreateDocumentInput, UpdateDocumentInput } from '@homevault/database';
import { colors } from '../../../src/theme/colors';

export default function EditDocumentRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const document = appData.documents.find((d) => d.id === id);
  if (!document) { router.back(); return null; }

  const handleSave = async (input: CreateDocumentInput | UpdateDocumentInput) => {
    if (!input.id) return;
    try {
      const repo = await getHomeVaultRepository();
      await repo.updateDocument(input as UpdateDocumentInput);
      await reload();
      router.back();
    } catch {
      showToast('Could not save document. Please try again.', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AddDocumentScreen
        propertyId={appData.property.id}
        assets={appData.assets}
        rooms={appData.rooms}
        document={document}
        onCancel={() => router.back()}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
