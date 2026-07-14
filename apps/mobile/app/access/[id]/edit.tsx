import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { UpdateAccessItemInput } from '@homevault/database';
import { MissingRecordView } from '../../../src/components/MissingRecordView';
import { useHomeVault } from '../../../src/context/HomeVaultContext';
import { getHomeVaultRepository } from '../../../src/data/localHomeVaultRepository';
import { AddAccessItemScreen } from '../../../src/screens/AddAccessItemScreen';
import { colors } from '../../../src/theme/colors';
import { navigateBackOrReplace } from '../../../src/utils/navigation';

export default function EditAccessRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  const accessItem = appData.accessItems.find((item) => item.id === id);

  if (!accessItem) {
    return (
      <MissingRecordView
        title="Access record not found"
        detail="This access record is no longer available to edit. Return to Access to choose another record or add it again."
        actionLabel="Back to Access"
        onActionPress={() => navigateBackOrReplace('/(tabs)/access')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AddAccessItemScreen
        propertyId={appData.property.id}
        assets={appData.assets}
        documents={appData.documents}
        accessItem={accessItem}
        onCancel={() => navigateBackOrReplace(`/access/${accessItem.id}`)}
        onSave={async (input: UpdateAccessItemInput) => {
          try {
            const repo = await getHomeVaultRepository();
            await repo.updateAccessItem({
              ...input,
              lastReviewedAt: accessItem.lastReviewedAt,
            });
            await reload();
            showToast('Access record updated');
            navigateBackOrReplace(`/access/${accessItem.id}`);
          } catch {
            showToast('Could not update access record. Please try again.', 'error');
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
