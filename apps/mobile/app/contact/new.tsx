import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CreateEmergencyContactInput } from '@homevault/database';
import type { EmergencyContact } from '@homevault/domain';
import { useHomeVault } from '../../src/context/HomeVaultContext';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import { AddEmergencyContactScreen } from '../../src/screens/AddEmergencyContactScreen';
import { colors } from '../../src/theme/colors';
import { navigateBackOrReplace } from '../../src/utils/navigation';

export default function NewEmergencyContactRoute() {
  const { priority } = useLocalSearchParams<{ priority?: EmergencyContact['priority'] }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <AddEmergencyContactScreen
        propertyId={appData.property.id}
        initialPriority={priority}
        onCancel={() => navigateBackOrReplace('/contact')}
        onSave={async (input: CreateEmergencyContactInput) => {
          try {
            const repo = await getHomeVaultRepository();
            const contact = await repo.createEmergencyContact(input);
            await reload();
            showToast('Emergency contact saved');
            navigateBackOrReplace(`/contact/${contact.id}`);
          } catch {
            showToast('Could not save emergency contact. Please try again.', 'error');
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
