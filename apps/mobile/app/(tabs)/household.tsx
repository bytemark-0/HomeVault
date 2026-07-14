import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { useHomeVault } from '../../src/context/HomeVaultContext';
import { SampleModeNotice } from '../../src/components/SampleModeNotice';
import { HouseholdScreen } from '../../src/screens/HouseholdScreen';
import { printPropertySummary } from '../../src/utils/printReport';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import { getSetupChecklistProgress } from '../../src/utils/setupChecklist';
import { buildSeasonalReadinessTracks } from '../../src/utils/seasonalReadiness';
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
  const readinessProgress = appData
    ? getSetupChecklistProgress({
        accessItems: appData.accessItems,
        assets: appData.assets,
        emergencyContacts: appData.emergencyContacts,
        importantAccounts: appData.importantAccounts,
      })
    : null;
  const hasIncompleteGettingStarted = (readinessProgress?.incomplete.length ?? 0) > 0;
  const seasonalTracks = appData
    ? buildSeasonalReadinessTracks({
        property: appData.property,
        assets: appData.assets,
        documents: appData.documents,
        accessItems: appData.accessItems,
        emergencyContacts: appData.emergencyContacts,
        importantAccounts: appData.importantAccounts,
        continuityPlaybooks: appData.continuityPlaybooks,
      })
    : [];

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
        readinessDoneCount={readinessProgress?.doneCount ?? 0}
        readinessNextLabel={readinessProgress?.next?.label}
        readinessTotal={readinessProgress?.total ?? 0}
        restoreSummary={restoreSummary ?? undefined}
        rooms={appData.rooms}
        seasonalTracks={seasonalTracks}
        onAddRoom={() => router.push('/room/new')}
        onDismissRestoreNotice={() => setRestoreSummary(null)}
        onEditProperty={() => router.push('/property/edit')}
        onExportManifest={() => router.push('/export')}
        onOpenSeasonalTrack={(trackKey) => {
          const track = seasonalTracks.find((item) => item.key === trackKey);

          if (!track) {
            return;
          }

          router.push(track.route as never);
        }}
        onShowGettingStarted={async () => {
          router.push('/readiness-setup');
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
