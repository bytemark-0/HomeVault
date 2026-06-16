import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../../src/context/HomeVaultContext';
import { AddRoomScreen } from '../../../src/screens/AddRoomScreen';
import { getHomeVaultRepository } from '../../../src/data/localHomeVaultRepository';
import type { CreateRoomInput, UpdateRoomInput } from '@homevault/database';
import { colors } from '../../../src/theme/colors';

export default function EditRoomRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const room = appData.rooms.find((r) => r.id === id);
  if (!room) { router.back(); return null; }

  const handleSave = async (input: CreateRoomInput | UpdateRoomInput) => {
    try {
      const repo = await getHomeVaultRepository();
      await repo.updateRoom({ ...input, id } as UpdateRoomInput);
      await reload();
      router.back();
    } catch {
      showToast('Could not save room. Please try again.', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AddRoomScreen
        propertyId={appData.property.id}
        room={room}
        onCancel={() => router.back()}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
