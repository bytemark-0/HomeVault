import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CreateImportantAccountInput } from '@homevault/database';
import type { ImportantAccount } from '@homevault/domain';
import { useHomeVault } from '../../src/context/HomeVaultContext';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import { AddImportantAccountScreen } from '../../src/screens/AddImportantAccountScreen';
import { colors } from '../../src/theme/colors';
import { navigateBackOrReplace } from '../../src/utils/navigation';

export default function NewImportantAccountRoute() {
  const { kind } = useLocalSearchParams<{ kind?: ImportantAccount['kind'] }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <AddImportantAccountScreen
        propertyId={appData.property.id}
        documents={appData.documents}
        initialKind={kind}
        onCancel={() => navigateBackOrReplace('/(tabs)/emergency')}
        onSave={async (input: CreateImportantAccountInput) => {
          try {
            const repo = await getHomeVaultRepository();
            const account = await repo.createImportantAccount(input);
            await reload();
            showToast('Important account saved');
            navigateBackOrReplace(`/account/${account.id}`);
          } catch {
            showToast('Could not save important account. Please try again.', 'error');
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
