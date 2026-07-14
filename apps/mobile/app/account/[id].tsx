import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MissingRecordView } from '../../src/components/MissingRecordView';
import { useHomeVault } from '../../src/context/HomeVaultContext';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import { ImportantAccountDetailScreen } from '../../src/screens/ImportantAccountDetailScreen';
import { colors } from '../../src/theme/colors';
import { navigateBackOrReplace } from '../../src/utils/navigation';
import {
  createReviewedOnDate,
  getImportantAccountReviewSummary,
} from '../../src/utils/reviewFreshness';

export default function ImportantAccountDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  const account = appData.importantAccounts.find((candidate) => candidate.id === id);
  if (!account) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Account not found"
          detail="This important account is no longer available. Return to Emergency to keep working with the latest records."
          actionLabel="Back to Emergency"
          onActionPress={() => router.replace('/(tabs)/emergency')}
        />
      </SafeAreaView>
    );
  }

  const linkedDocuments = appData.documents.filter((document) =>
    account.linkedDocumentIds.includes(document.id),
  );
  const reviewSummary = getImportantAccountReviewSummary(account);

  async function handleDelete() {
    try {
      const repo = await getHomeVaultRepository();
      await repo.deleteImportantAccount(id);
      await reload();
      showToast('Important account deleted', 'error');
      router.replace('/(tabs)/emergency');
    } catch {
      showToast('Could not delete important account. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ImportantAccountDetailScreen
        account={account}
        linkedDocuments={linkedDocuments}
        onBack={() => navigateBackOrReplace('/(tabs)/emergency')}
        onDelete={handleDelete}
        onEdit={() => router.push(`/account/${id}/edit`)}
        onMarkReviewed={async () => {
          try {
            const repo = await getHomeVaultRepository();
            await repo.updateImportantAccount({
              ...account,
              lastReviewedAt: createReviewedOnDate(),
            });
            await reload();
            showToast('Important account review updated');
          } catch {
            showToast('Could not save the review date. Please try again.', 'error');
          }
        }}
        onShare={() =>
          router.push({
            pathname: '/share/item',
            params: { id, recordType: 'important_account' },
          })
        }
        reviewStatusLabel={reviewSummary.detail}
        onLinkedDocumentPress={(documentId) => router.push(`/document/${documentId}`)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
