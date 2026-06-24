import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../src/context/HomeVaultContext';
import { MissingRecordView } from '../../src/components/MissingRecordView';
import { RoomDetailScreen } from '../../src/screens/RoomDetailScreen';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import { colors } from '../../src/theme/colors';
import { type RoomServiceCompletionListItem } from '../../src/data/homeVaultSampleData';
import { navigateBackOrReplace } from '../../src/utils/navigation';

export default function RoomDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  const room = appData.rooms.find((r) => r.id === id);
  if (!room) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Room not found"
          detail="This room may have been deleted or moved while you were viewing it. Return to Household to continue with the current home structure."
          actionLabel="Back to Household"
          onActionPress={() => router.replace('/(tabs)/household')}
        />
      </SafeAreaView>
    );
  }

  const roomAssets = appData.assets.filter((a) => a.roomId === id);
  const roomAssetIds = roomAssets.map((a) => a.id);
  const roomDocuments = appData.documents.filter(
    (d) =>
      d.linkedRecordIds.includes(id) ||
      roomAssetIds.some((assetId) => d.linkedRecordIds.includes(assetId)),
  );
  const roomTasks = appData.tasks.filter((t) => {
    if (t.state === 'completed') return false;
    return (
      (t.scope === 'room' && t.scopeId === id) ||
      (t.scope === 'asset' && roomAssetIds.includes(t.scopeId))
    );
  });
  const roomRepairEvents = appData.repairEvents
    .filter((r) => roomAssetIds.includes(r.assetId))
    .sort((a, b) => b.date.localeCompare(a.date));
  const roomServiceCompletions: RoomServiceCompletionListItem[] = appData.taskCompletions
    .map((completion) => {
      const task = appData.tasks.find((t) => t.id === completion.taskId);
      if (!task) return null;
      const isRoomTask = task.scope === 'room' && task.scopeId === id;
      const isRoomAssetTask = task.scope === 'asset' && roomAssetIds.includes(task.scopeId);
      if (!isRoomTask && !isRoomAssetTask) return null;
      return { ...completion, taskTitle: task.title, scopeLabel: task.scopeLabel };
    })
    .filter((c): c is RoomServiceCompletionListItem => c !== null)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  async function handleDelete() {
    try {
      const repo = await getHomeVaultRepository();
      await repo.deleteRoom(id);
      showToast('Room deleted', 'error');
      await reload();
      router.replace('/(tabs)/household');
    } catch {
      showToast('Could not delete room. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <RoomDetailScreen
        room={room}
        assets={roomAssets}
        documents={roomDocuments}
        repairEvents={roomRepairEvents}
        serviceCompletions={roomServiceCompletions}
        tasks={roomTasks}
        onAddAsset={() => router.push(`/room/${id}/add-asset`)}
        onAddDocument={() => router.push(`/room/${id}/add-document`)}
        onAddTask={() => router.push(`/room/${id}/add-task`)}
        onAssetPress={(assetId) => router.push(`/asset/${assetId}`)}
        onBack={() => navigateBackOrReplace('/(tabs)/household')}
        onDocumentPress={(docId) => router.push(`/document/${docId}`)}
        onDelete={() => void handleDelete()}
        onEdit={() => router.push(`/room/${id}/edit`)}
        onTaskPress={(taskId) => router.push(`/task/${taskId}`)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
