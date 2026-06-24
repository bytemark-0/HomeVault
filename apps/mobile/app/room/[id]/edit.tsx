import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../../../src/context/HomeVaultContext';
import { MissingRecordView } from '../../../src/components/MissingRecordView';
import { AddRoomScreen } from '../../../src/screens/AddRoomScreen';
import { getHomeVaultRepository } from '../../../src/data/localHomeVaultRepository';
import { navigateBackOrReplace } from '../../../src/utils/navigation';
import type { CreateRoomInput, UpdateRoomInput } from '@homevault/database';
import { colors } from '../../../src/theme/colors';

export default function EditRoomRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;
  const room = appData.rooms.find((r) => r.id === id);
  if (!room) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Room not found"
          detail="This room is no longer available to edit. Return to Household to choose another area or add it again."
          actionLabel="Back to Household"
          onActionPress={() => router.replace('/(tabs)/household')}
        />
      </SafeAreaView>
    );
  }

  const handleSave = async (input: CreateRoomInput | UpdateRoomInput) => {
    try {
      const repo = await getHomeVaultRepository();
      await repo.updateRoom({ ...input, id } as UpdateRoomInput);
      await reload();
      showToast('Room updated');
      navigateBackOrReplace(`/room/${id}`);
    } catch (error) {
      showToast('Could not save room. Please try again.', 'error');
      throw error;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AddRoomScreen
        propertyId={appData.property.id}
        room={room}
        onCancel={() => navigateBackOrReplace(`/room/${id}`)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
