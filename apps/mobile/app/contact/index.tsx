import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { SampleModeNotice } from '../../src/components/SampleModeNotice';
import { useHomeVault } from '../../src/context/HomeVaultContext';
import { EmergencyContactsScreen } from '../../src/screens/EmergencyContactsScreen';
import { navigateBackOrReplace } from '../../src/utils/navigation';

export default function EmergencyContactsRoute() {
  const { appData } = useHomeVault();

  if (!appData) return null;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <SampleModeNotice />
      <EmergencyContactsScreen
        emergencyContacts={appData.emergencyContacts}
        onAddContact={(priority) =>
          router.push({
            pathname: '/contact/new',
            params: priority ? { priority } : undefined,
          })
        }
        onBack={() => navigateBackOrReplace('/(tabs)/emergency')}
        onContactPress={(contactId) => router.push(`/contact/${contactId}`)}
        onShareContact={(contactId) =>
          router.push({
            pathname: '/share/item',
            params: { id: contactId, recordType: 'emergency_contact' },
          })
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 104 },
});
