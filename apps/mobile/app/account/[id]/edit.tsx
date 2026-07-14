import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CreateImportantAccountInput } from '@homevault/database';
import { MissingRecordView } from '../../../src/components/MissingRecordView';
import { useHomeVault } from '../../../src/context/HomeVaultContext';
import { getHomeVaultRepository } from '../../../src/data/localHomeVaultRepository';
import { AddImportantAccountScreen } from '../../../src/screens/AddImportantAccountScreen';
import { colors } from '../../../src/theme/colors';
import { navigateBackOrReplace } from '../../../src/utils/navigation';

export default function EditImportantAccountRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  const account = appData.importantAccounts.find((candidate) => candidate.id === id);
  if (!account) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Account not found"
          detail="This important account is no longer available to edit. Return to Emergency to choose another record or add it again."
          actionLabel="Back to Emergency"
          onActionPress={() => router.replace('/(tabs)/emergency')}
        />
      </SafeAreaView>
    );
  }
  const resolvedAccount = account;

  async function handleSave(input: CreateImportantAccountInput) {
    if (!input.id) return;

    try {
      const repo = await getHomeVaultRepository();
      await repo.updateImportantAccount({
        ...input,
        id: input.id,
        lastReviewedAt: resolvedAccount.lastReviewedAt,
      });
      await reload();
      showToast('Important account updated');
      navigateBackOrReplace(`/account/${id}`);
    } catch {
      showToast('Could not save important account. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AddImportantAccountScreen
        propertyId={appData.property.id}
        documents={appData.documents}
        account={resolvedAccount}
        onCancel={() => navigateBackOrReplace(`/account/${id}`)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
