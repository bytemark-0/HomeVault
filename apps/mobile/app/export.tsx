import { router } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';

import { useHomeVault } from '../src/context/HomeVaultContext';
import { ExportManifestScreen } from '../src/screens/ExportManifestScreen';
import { colors } from '../src/theme/colors';
import type { HomeVaultExportChecklistItem, HomeVaultExportPackage } from '@homevault/export';
import { getHomeVaultRepository } from '../src/data/localHomeVaultRepository';

export default function ExportRoute() {
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

  async function handleRestoreBackup(pkg: HomeVaultExportPackage) {
    try {
      const repo = await getHomeVaultRepository();
      if (!repo.restoreSnapshot) return;
      await repo.restoreSnapshot({
        properties: [pkg.records.property],
        rooms: pkg.records.rooms,
        assets: pkg.records.assets,
        documents: pkg.records.documents,
        tasks: pkg.records.tasks,
        taskCompletions: pkg.records.taskCompletions,
        repairEvents: pkg.records.repairEvents,
        parts: pkg.records.parts ?? [],
      });
      await reload();
      setBackupSummary({
        generatedAt: pkg.manifest.generatedAt,
        kind: 'restored',
        propertyLabel: pkg.manifest.property.label,
        recordCounts: { ...pkg.manifest.recordCounts },
        updatedAt: new Date().toISOString(),
      });
      setRestoreSummary({
        generatedAt: pkg.manifest.generatedAt,
        propertyLabel: pkg.manifest.property.label,
        recordCounts: { ...pkg.manifest.recordCounts },
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
      if (firstOpenTask) { router.push(`/task/${firstOpenTask.id}`); return; }
      router.push('/(tabs)/maintenance');
      return;
    }
    if (firstOpenTask) { router.push(`/task/${firstOpenTask.id}`); return; }
    if (firstAsset) { router.push(`/asset/${firstAsset.id}/add-repair`); return; }
    router.push('/(tabs)/maintenance');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ExportManifestScreen
        property={appData.property}
        rooms={appData.rooms}
        assets={appData.assets}
        documents={appData.documents}
        parts={appData.parts}
        tasks={appData.tasks}
        taskCompletions={appData.taskCompletions}
        repairEvents={appData.repairEvents}
        onBackupCreated={handleBackupCreated}
        onBack={() => router.back()}
        onFixPress={handleFixPress}
        onRestoreBackup={handleRestoreBackup}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
