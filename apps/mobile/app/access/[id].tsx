import { router, useLocalSearchParams } from 'expo-router';

import { MissingRecordView } from '../../src/components/MissingRecordView';
import { useHomeVault } from '../../src/context/HomeVaultContext';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import { AccessDetailScreen } from '../../src/screens/AccessDetailScreen';
import { navigateBackOrReplace } from '../../src/utils/navigation';
import {
  createReviewedOnDate,
  getAccessItemReviewSummary,
} from '../../src/utils/reviewFreshness';

export default function AccessDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  const accessItem = appData.accessItems.find((item) => item.id === id);

  if (!accessItem) {
    return (
      <MissingRecordView
        title="Access record not found"
        detail="This access record may have been deleted or changed while you were viewing it. Return to Access to keep working with the latest details."
        actionLabel="Back to Access"
        onActionPress={() => navigateBackOrReplace('/(tabs)/access')}
      />
    );
  }
  const reviewSummary = getAccessItemReviewSummary(accessItem);

  return (
    <AccessDetailScreen
      accessItem={accessItem}
      linkedAsset={appData.assets.find((asset) => asset.id === accessItem.linkedAssetId)}
      linkedDocuments={appData.documents.filter((document) =>
        accessItem.linkedDocumentIds.includes(document.id),
      )}
      onBack={() => navigateBackOrReplace('/(tabs)/access')}
      onDelete={async () => {
        try {
          const repo = await getHomeVaultRepository();
          await repo.deleteAccessItem(accessItem.id);
          await reload();
          showToast('Access record deleted', 'error');
          navigateBackOrReplace('/(tabs)/access');
        } catch {
          showToast('Could not delete access record. Please try again.', 'error');
        }
      }}
      onEdit={() => router.push(`/access/${accessItem.id}/edit`)}
      onMarkReviewed={async () => {
        try {
          const repo = await getHomeVaultRepository();
          const reviewedOn = createReviewedOnDate();
          await repo.updateAccessItem({
            ...accessItem,
            lastReviewedAt: reviewedOn,
            lastVerifiedAt: reviewedOn,
          });
          await reload();
          showToast('Access review updated');
        } catch {
          showToast('Could not save the review date. Please try again.', 'error');
        }
      }}
      onShare={() =>
        router.push({
          pathname: '/share/item',
          params: { id: accessItem.id, recordType: 'access_item' },
        })
      }
      reviewStatusLabel={reviewSummary.detail}
      onLinkedAssetPress={(assetId) => router.push(`/asset/${assetId}`)}
      onLinkedDocumentPress={(documentId) => router.push(`/document/${documentId}`)}
    />
  );
}
