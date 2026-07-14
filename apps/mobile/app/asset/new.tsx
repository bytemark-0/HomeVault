import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../src/context/HomeVaultContext';
import { AddAssetScreen } from '../../src/screens/AddAssetScreen';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import { maybeAddRecommendedMaintenanceTasks } from '../../src/utils/recommendedMaintenance';
import { navigateBackOrReplace } from '../../src/utils/navigation';
import type { CreateAssetInput } from '@homevault/database';
import { colors } from '../../src/theme/colors';
import { getAssetMode, getDeviceTemplate } from '../../src/utils/deviceMetadata';

export default function NewAssetRoute() {
  const { copyFromId, mode, source, template } = useLocalSearchParams<{
    copyFromId?: string;
    mode?: 'asset' | 'device';
    source?: string;
    template?: string;
  }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  const copyFrom = copyFromId ? appData.assets.find((a) => a.id === copyFromId) : undefined;
  const resolvedMode = mode ?? getAssetMode(copyFrom);
  const fallbackRoute =
    source === 'devices' || resolvedMode === 'device' ? '/(tabs)/devices' : '/(tabs)/inventory';

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
        navigateBackOrReplace(`/asset/${asset.id}`);
        return;
      }

      await reload();
      showToast(
        reminderCount > 0
          ? `Asset saved with ${reminderCount} recommended reminder${reminderCount === 1 ? '' : 's'}`
          : 'Asset saved',
      );
      navigateBackOrReplace(
        source === 'devices' || resolvedMode === 'device'
          ? `/asset/${asset.id}?source=devices`
          : `/asset/${asset.id}`,
      );
    } catch {
      showToast('Could not save asset. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AddAssetScreen
        propertyId={appData.property.id}
        rooms={appData.rooms}
        copyFrom={copyFrom}
        mode={resolvedMode}
        deviceTemplate={getDeviceTemplate(template)?.key}
        onCancel={() => navigateBackOrReplace(fallbackRoute)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
