import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../src/context/HomeVaultContext';
import { MissingRecordView } from '../../src/components/MissingRecordView';
import { DocumentDetailScreen } from '../../src/screens/DocumentDetailScreen';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import { navigateBackOrReplace } from '../../src/utils/navigation';
import { colors } from '../../src/theme/colors';

export default function DocumentDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const document = appData.documents.find((d) => d.id === id);
  if (!document) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Document not found"
          detail="This document may have been deleted or moved while you were viewing it. Return to Documents to keep working with the latest records."
          actionLabel="Back to Documents"
          onActionPress={() => router.replace('/(tabs)/documents')}
        />
      </SafeAreaView>
    );
  }

  async function handleDelete() {
    const repo = await getHomeVaultRepository();
    await repo.deleteDocument(id);
    await reload();
    showToast('Document deleted', 'error');
    router.replace('/(tabs)/documents');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <DocumentDetailScreen
        document={document}
        onBack={() => navigateBackOrReplace('/(tabs)/documents')}
        onDelete={handleDelete}
        onEdit={() => router.push(`/document/${id}/edit`)}
        onLinkedRecordPress={(recordId) => {
          if (appData.assets.some((a) => a.id === recordId)) {
            router.push(`/asset/${recordId}`);
          } else if (appData.rooms.some((r) => r.id === recordId)) {
            router.push(`/room/${recordId}`);
          } else {
            router.push('/(tabs)/household');
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
