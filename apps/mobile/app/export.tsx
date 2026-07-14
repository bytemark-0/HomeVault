import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../src/context/HomeVaultContext';
import { ExportManifestScreen } from '../src/screens/ExportManifestScreen';
import { colors } from '../src/theme/colors';
import {
  HOMEVAULT_TRUSTED_SHARE_AUDIENCES,
  type HomeVaultExportChecklistItem,
  type HomeVaultExportPackage,
  type HomeVaultTrustedShareAudienceKey,
} from '@homevault/export';
import { getHomeVaultRepository } from '../src/data/localHomeVaultRepository';
import { buildRestoreSnapshot, type ValidatedBackup } from '../src/utils/backupImport';
import { getAnnualReviewTaskRoute } from '../src/utils/annualReview';

export default function ExportRoute() {
  const params = useLocalSearchParams<{ audience?: string; focus?: string }>();
  const { appData, reload, setBackupSummary, setRestoreSummary, showToast } = useHomeVault();

  if (!appData) return null;

  function handleBackupCreated(pkg: HomeVaultExportPackage, fileName: string) {
    setBackupSummary({
      generatedAt: pkg.manifest.generatedAt,
      fileName,
      kind: 'created',
      propertyLabel: pkg.manifest.property.label,
      recordCounts: { ...pkg.manifest.recordCounts },
      updatedAt: new Date().toISOString(),
    });
  }

  async function handleRestoreBackup(backup: ValidatedBackup) {
    try {
      const repo = await getHomeVaultRepository();
      if (!repo.restoreSnapshot) return;
      const snapshot = await buildRestoreSnapshot(backup);
      await repo.restoreSnapshot(snapshot);
      await reload();
      setBackupSummary({
        generatedAt: backup.package.manifest.generatedAt,
        kind: 'restored',
        propertyLabel: backup.package.manifest.property.label,
        recordCounts: { ...backup.package.manifest.recordCounts },
        updatedAt: new Date().toISOString(),
      });
      setRestoreSummary({
        generatedAt: backup.package.manifest.generatedAt,
        propertyLabel: backup.package.manifest.property.label,
        recordCounts: { ...backup.package.manifest.recordCounts },
        restoredAt: new Date().toISOString(),
      });
      showToast('Backup restored');
      router.replace('/(tabs)/household');
    } catch {
      showToast('Could not restore backup. Please try again.', 'error');
    }
  }

  const handleFixPress = (fixId: HomeVaultExportChecklistItem['id']) => {
    const firstUnlinkedDocument = appData.documents.find((d) => d.linkedRecordIds.length === 0);
    const firstOpenTask = appData.tasks.find((t) => t.state !== 'completed');
    const firstAsset = appData.assets[0];

    router.back();
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
      if (firstOpenTask) { router.push(getAnnualReviewTaskRoute(firstOpenTask.id)); return; }
      router.push('/(tabs)/maintenance');
      return;
    }
    if (firstOpenTask) { router.push(getAnnualReviewTaskRoute(firstOpenTask.id)); return; }
    if (firstAsset) { router.push(`/asset/${firstAsset.id}/add-repair`); return; }
    router.push('/(tabs)/maintenance');
  };

  const initialTrustedShareAudience = HOMEVAULT_TRUSTED_SHARE_AUDIENCES.some(
    (audience) => audience.key === params.audience,
  )
    ? (params.audience as HomeVaultTrustedShareAudienceKey)
    : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <ExportManifestScreen
        property={appData.property}
        rooms={appData.rooms}
        assets={appData.assets}
        documents={appData.documents}
        accessItems={appData.accessItems}
        emergencyContacts={appData.emergencyContacts}
        importantAccounts={appData.importantAccounts}
        continuityPlaybooks={appData.continuityPlaybooks}
        parts={appData.parts}
        tasks={appData.tasks}
        taskCompletions={appData.taskCompletions}
        repairEvents={appData.repairEvents}
        initialFocusSection={params.focus === 'trusted-share' || params.focus === 'packet' ? params.focus : undefined}
        initialTrustedShareAudience={initialTrustedShareAudience}
        onBackupCreated={handleBackupCreated}
        onBack={() => router.back()}
        onFixPress={handleFixPress}
        onRestoreBackup={handleRestoreBackup}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
