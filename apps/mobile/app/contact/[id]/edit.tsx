import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { UpdateEmergencyContactInput } from '@homevault/database';
import { MissingRecordView } from '../../../src/components/MissingRecordView';
import { useHomeVault } from '../../../src/context/HomeVaultContext';
import { getHomeVaultRepository } from '../../../src/data/localHomeVaultRepository';
import { AddEmergencyContactScreen } from '../../../src/screens/AddEmergencyContactScreen';
import { colors } from '../../../src/theme/colors';
import { navigateBackOrReplace } from '../../../src/utils/navigation';

export default function EditEmergencyContactRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  const contact = appData.emergencyContacts.find((candidate) => candidate.id === id);
  if (!contact) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Emergency contact not found"
          detail="This contact is no longer available to edit. Return to contacts to choose another record or add it again."
          actionLabel="Back to contacts"
          onActionPress={() => router.replace('/contact')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AddEmergencyContactScreen
        propertyId={appData.property.id}
        contact={contact}
        onCancel={() => navigateBackOrReplace(`/contact/${id}`)}
        onSave={async (input: UpdateEmergencyContactInput) => {
          try {
            const repo = await getHomeVaultRepository();
            await repo.updateEmergencyContact({
              ...input,
              lastReviewedAt: contact.lastReviewedAt,
            });
            await reload();
            showToast('Emergency contact updated');
            navigateBackOrReplace(`/contact/${id}`);
          } catch {
            showToast('Could not update emergency contact. Please try again.', 'error');
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
