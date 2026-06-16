import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../src/context/HomeVaultContext';
import { DocumentDetailScreen } from '../../src/screens/DocumentDetailScreen';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import { colors } from '../../src/theme/colors';

export default function DocumentDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const document = appData.documents.find((d) => d.id === id);
  if (!document) { router.back(); return null; }

  async function handleDelete() {
    const repo = await getHomeVaultRepository();
    await repo.deleteDocument(id);
    await reload();
    showToast('Document deleted', 'error');
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <DocumentDetailScreen
        document={document}
        onBack={() => router.back()}
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
