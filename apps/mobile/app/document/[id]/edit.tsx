import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../../src/context/HomeVaultContext';
import { MissingRecordView } from '../../../src/components/MissingRecordView';
import { AddDocumentScreen } from '../../../src/screens/AddDocumentScreen';
import { getHomeVaultRepository } from '../../../src/data/localHomeVaultRepository';
import { navigateBackOrReplace } from '../../../src/utils/navigation';
import type { CreateDocumentInput, UpdateDocumentInput } from '@homevault/database';
import { colors } from '../../../src/theme/colors';

export default function EditDocumentRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const document = appData.documents.find((d) => d.id === id);
  if (!document) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Document not found"
          detail="This document is no longer available to edit. Return to Documents to choose another record or add it again."
          actionLabel="Back to Documents"
          onActionPress={() => router.replace('/(tabs)/documents')}
        />
      </SafeAreaView>
    );
  }

  const handleSave = async (input: CreateDocumentInput | UpdateDocumentInput) => {
    if (!input.id) return;
    try {
      const repo = await getHomeVaultRepository();
      await repo.updateDocument(input as UpdateDocumentInput);
      await reload();
      showToast('Document updated');
      navigateBackOrReplace(`/document/${id}`);
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
        onCancel={() => navigateBackOrReplace(`/document/${id}`)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
