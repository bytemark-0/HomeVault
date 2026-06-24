import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { useHomeVault } from '../../src/context/HomeVaultContext';
import { SampleModeNotice } from '../../src/components/SampleModeNotice';
import { HouseholdScreen } from '../../src/screens/HouseholdScreen';
import { printPropertySummary } from '../../src/utils/printReport';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import { getSetupChecklistProgress, restoreSetupChecklist } from '../../src/utils/setupChecklist';
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

  const linkedDocumentCount =
    appData?.documents.filter((d) => d.linkedRecordIds.length > 0).length ?? 0;
  const documentedAssetCount =
    appData?.assets.filter((a) => a.documentCount > 0).length ?? 0;
  const hasIncompleteGettingStarted = appData
    ? getSetupChecklistProgress({
        roomCount: appData.roomCount,
        assetCount: appData.assetCount,
        taskCount: appData.tasks.length,
        documentCount: appData.documentCount,
        hasPropertyPhoto: Boolean(appData.property.photoUri),
        backupCreated: Boolean(backupSummary),
      }).incomplete.length > 0
    : false;

  if (!appData) return null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SampleModeNotice />
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
        onShowGettingStarted={async () => {
          await restoreSetupChecklist();
          router.push('/(tabs)');
        }}
        onPrintSummary={() => void handlePrintSummary()}
        onResetDemoData={async () => {
          const repo = await getHomeVaultRepository();
          if (repo.resetDemoData) {
            await repo.resetDemoData();
            await reload();
          }
        }}
        onRoomPress={(id) => router.push(`/room/${id}`)}
        showGettingStartedAction={hasIncompleteGettingStarted}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 104 },
});
