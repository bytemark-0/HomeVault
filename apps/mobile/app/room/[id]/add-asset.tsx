import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../../src/context/HomeVaultContext';
import { AddAssetScreen } from '../../../src/screens/AddAssetScreen';
import { getHomeVaultRepository } from '../../../src/data/localHomeVaultRepository';
import { maybeAddRecommendedMaintenanceTasks } from '../../../src/utils/recommendedMaintenance';
import type { CreateAssetInput } from '@homevault/database';
import { colors } from '../../../src/theme/colors';

export default function RoomAddAssetRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  async function handleSave(input: CreateAssetInput) {
    try {
      const repo = await getHomeVaultRepository();
      const asset = await repo.createAsset(input);
      let reminderCount = 0;

      try {
        reminderCount = await maybeAddRecommendedMaintenanceTasks(repo, asset);
      } catch {
        await reload();
        showToast('Asset saved, but we could not add the recommended reminders.', 'error');
        router.back();
        return;
      }

      await reload();
      if (reminderCount > 0) {
        showToast(`Added ${reminderCount} recommended reminder${reminderCount === 1 ? '' : 's'}`);
      }
      router.back();
    } catch {
      showToast('Could not save asset. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AddAssetScreen
        propertyId={appData.property.id}
        rooms={appData.rooms}
        initialRoomId={id}
        onCancel={() => router.back()}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
