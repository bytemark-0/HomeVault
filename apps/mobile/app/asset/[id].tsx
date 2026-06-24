import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../src/context/HomeVaultContext';
import { AssetDetailScreen } from '../../src/screens/AssetDetailScreen';
import { MissingRecordView } from '../../src/components/MissingRecordView';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import { colors } from '../../src/theme/colors';
import {
  toAssetDocumentListItems,
  toAssetTaskCompletionListItems,
} from '../../src/data/homeVaultSampleData';
import { navigateBackOrReplace } from '../../src/utils/navigation';

export default function AssetDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  const asset = appData.assets.find((a) => a.id === id);
  if (!asset) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Asset not found"
          detail="This asset may have been deleted or moved while you were viewing it. Return to Inventory to keep working with the latest records."
          actionLabel="Back to Inventory"
          onActionPress={() => router.replace('/(tabs)/inventory')}
        />
      </SafeAreaView>
    );
  }

  const assetDocuments = toAssetDocumentListItems(id, appData.documents);
  const assetTaskCompletions = toAssetTaskCompletionListItems(
    id,
    appData.tasks,
    appData.taskCompletions,
  );
  const assetRepairEvents = appData.repairEvents.filter((r) => r.assetId === id);
  const assetParts = appData.parts.filter((p) => p.assetId === id);

  async function handleDelete() {
    try {
      const repo = await getHomeVaultRepository();
      await repo.deleteAsset(id);
      showToast('Asset deleted', 'error');
      await reload();
      router.replace('/(tabs)/inventory');
    } catch {
      showToast('Could not delete asset. Please try again.', 'error');
    }
  }

  async function handleDeleteRepair(repairEventId: string) {
    const repo = await getHomeVaultRepository();
    await repo.deleteRepairEvent(repairEventId);
    showToast('Repair deleted', 'error');
    await reload();
  }

  async function handleDeleteCompletion(completionId: string) {
    try {
      const repo = await getHomeVaultRepository();
      await repo.deleteTaskCompletion(completionId);
      await reload();
      showToast('Completion deleted');
    } catch {
      showToast('Could not delete completion. Please try again.', 'error');
    }
  }

  async function handleDeletePart(partId: string) {
    try {
      const repo = await getHomeVaultRepository();
      await repo.deletePart(partId);
      await reload();
      showToast('Part deleted', 'error');
    } catch {
      showToast('Could not delete part. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AssetDetailScreen
        asset={asset}
        documents={assetDocuments}
        parts={assetParts}
        repairEvents={assetRepairEvents}
        taskCompletions={assetTaskCompletions}
        onBack={() => navigateBackOrReplace('/(tabs)/inventory')}
        onEdit={() => router.push(`/asset/${id}/edit`)}
        onAddDocument={() => router.push(`/asset/${id}/add-document`)}
        onAddPart={() => router.push(`/asset/${id}/add-part`)}
        onAddTask={() => router.push(`/asset/${id}/add-task`)}
        onDocumentPress={(docId) => router.push(`/document/${docId}`)}
        onDelete={() => void handleDelete()}
        onDuplicate={() => router.push({ pathname: '/asset/new', params: { copyFromId: id } })}
        onDeleteRepair={handleDeleteRepair}
        onEditRepair={(repairId) => router.push(`/asset/${id}/repair/${repairId}/edit`)}
        onEditCompletion={(completionId) => {
          const completion = appData.taskCompletions.find((c) => c.id === completionId);
          if (completion) {
            router.push(`/task/${completion.taskId}/completion/${completionId}/edit`);
          }
        }}
        onDeleteCompletion={handleDeleteCompletion}
        onEditPart={(partId) => router.push(`/asset/${id}/part/${partId}/edit`)}
        onDeletePart={handleDeletePart}
        onRecordRepair={() => router.push(`/asset/${id}/add-repair`)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
