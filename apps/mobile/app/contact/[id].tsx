import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MissingRecordView } from '../../src/components/MissingRecordView';
import { useHomeVault } from '../../src/context/HomeVaultContext';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import { EmergencyContactDetailScreen } from '../../src/screens/EmergencyContactDetailScreen';
import { colors } from '../../src/theme/colors';
import { navigateBackOrReplace } from '../../src/utils/navigation';
import {
  createReviewedOnDate,
  getEmergencyContactReviewSummary,
} from '../../src/utils/reviewFreshness';

export default function EmergencyContactDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  const contact = appData.emergencyContacts.find((candidate) => candidate.id === id);

  if (!contact) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Emergency contact not found"
          detail="This contact may have been deleted or changed while you were viewing it. Return to contacts to keep working with the latest records."
          actionLabel="Back to contacts"
          onActionPress={() => router.replace('/contact')}
        />
      </SafeAreaView>
    );
  }
  const reviewSummary = getEmergencyContactReviewSummary(contact);

  async function handleDelete() {
    try {
      const repo = await getHomeVaultRepository();
      await repo.deleteEmergencyContact(id);
      await reload();
      showToast('Emergency contact deleted', 'error');
      router.replace('/contact');
    } catch {
      showToast('Could not delete emergency contact. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <EmergencyContactDetailScreen
        contact={contact}
        onBack={() => navigateBackOrReplace('/contact')}
        onDelete={handleDelete}
        onEdit={() => router.push(`/contact/${id}/edit`)}
        onMarkReviewed={async () => {
          try {
            const repo = await getHomeVaultRepository();
            await repo.updateEmergencyContact({
              ...contact,
              lastReviewedAt: createReviewedOnDate(),
            });
            await reload();
            showToast('Emergency contact review updated');
          } catch {
            showToast('Could not save the review date. Please try again.', 'error');
          }
        }}
        onShare={() =>
          router.push({
            pathname: '/share/item',
            params: { id, recordType: 'emergency_contact' },
          })
        }
        reviewStatusLabel={reviewSummary.detail}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
