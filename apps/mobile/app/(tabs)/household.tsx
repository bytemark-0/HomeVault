import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { useHomeVault } from '../../src/context/HomeVaultContext';
import { HouseholdScreen } from '../../src/screens/HouseholdScreen';
import { printPropertySummary } from '../../src/utils/printReport';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import type { HomeVaultExportChecklistItem } from '@homevault/export';

export default function HouseholdTab() {
  const { appData, backupSummary, restoreSummary, setRestoreSummary, reload, showToast } = useHomeVault();

  async function handlePrintSummary() {
    if (!appData) return;
    try {
      await printPropertySummary({
        property: appData.property,
        rooms: appData.rooms,
        assets: appData.assets,
        documents: appData.documents,
        tasks: appData.tasks,
      });
    } catch {
      showToast('Could not open print dialog. Please try again.', 'error');
    }
  }

  function handleExportFixPress(fixId: HomeVaultExportChecklistItem['id']) {
    const firstUnlinkedDocument = appData?.documents.find((d) => d.linkedRecordIds.length === 0);
    const firstOpenTask = appData?.tasks.find((t) => t.state !== 'completed');
    const firstAsset = appData?.assets[0];

    if (fixId === 'rooms') { router.push('/room/new'); return; }
    if (fixId === 'assets') { router.push('/asset/new'); return; }
    if (fixId === 'documents') {
      if (firstUnlinkedDocument) { router.push(`/document/${firstUnlinkedDocument.id}/edit`); return; }
      router.push('/document/new');
      return;
    }
    if (fixId === 'attachments') {
      router.push({ pathname: '/(tabs)/documents', params: { reviewFilter: 'missingAttachments' } });
      return;
    }
    if (fixId === 'assetDocumentation') {
      router.push({ pathname: '/(tabs)/documents', params: { reviewFilter: 'missingAssetDocumentation' } });
      return;
    }
    if (fixId === 'tasks') {
      if (firstOpenTask) { router.push(`/task/${firstOpenTask.id}`); return; }
      router.push('/(tabs)/maintenance');
      return;
    }
    if (firstOpenTask) { router.push(`/task/${firstOpenTask.id}`); return; }
    if (firstAsset) { router.push(`/asset/${firstAsset.id}/add-repair`); return; }
    router.push('/(tabs)/maintenance');
  }

  const linkedDocumentCount =
    appData?.documents.filter((d) => d.linkedRecordIds.length > 0).length ?? 0;
  const documentedAssetCount =
    appData?.assets.filter((a) => a.documentCount > 0).length ?? 0;

  if (!appData) return null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <HouseholdScreen
        activeTaskCount={appData.activeTaskCount}
        assetCount={appData.assetCount}
        documentCount={appData.documentCount}
        documentedAssetCount={documentedAssetCount}
        linkedDocumentCount={linkedDocumentCount}
        backupSummary={backupSummary ?? undefined}
        isDemo={appData.property.label === 'Maple Street home'}
        property={appData.property}
        restoreSummary={restoreSummary ?? undefined}
        rooms={appData.rooms}
        onAddRoom={() => router.push('/room/new')}
        onDismissRestoreNotice={() => setRestoreSummary(null)}
        onEditProperty={() => router.push('/property/edit')}
        onExportManifest={() => router.push('/export')}
        onPrintSummary={() => void handlePrintSummary()}
        onResetDemoData={async () => {
          const repo = await getHomeVaultRepository();
          if (repo.resetDemoData) {
            await repo.resetDemoData();
            await reload();
          }
        }}
        onRoomPress={(id) => router.push(`/room/${id}`)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 104 },
});
