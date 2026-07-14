import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CreateAccessItemInput } from '@homevault/database';
import type { AccessItem } from '@homevault/domain';
import { useHomeVault } from '../../src/context/HomeVaultContext';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import { AddAccessItemScreen } from '../../src/screens/AddAccessItemScreen';
import { colors } from '../../src/theme/colors';
import { navigateBackOrReplace } from '../../src/utils/navigation';

export default function NewAccessRoute() {
  const { category } = useLocalSearchParams<{ category?: AccessItem['category'] }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <AddAccessItemScreen
        propertyId={appData.property.id}
        assets={appData.assets}
        documents={appData.documents}
        initialCategory={category}
        onCancel={() => navigateBackOrReplace('/(tabs)/access')}
        onSave={async (input: CreateAccessItemInput) => {
          try {
            const repo = await getHomeVaultRepository();
            const accessItem = await repo.createAccessItem(input);
            await reload();
            showToast('Access record saved');
            navigateBackOrReplace(`/access/${accessItem.id}`);
          } catch {
            showToast('Could not save access record. Please try again.', 'error');
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
