import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { SampleModeNotice } from '../../src/components/SampleModeNotice';
import { useHomeVault } from '../../src/context/HomeVaultContext';
import { EmergencyScreen } from '../../src/screens/EmergencyScreen';

export default function EmergencyTab() {
  const { appData } = useHomeVault();

  if (!appData) return null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SampleModeNotice />
      <EmergencyScreen
        accessItems={appData.accessItems}
        assets={appData.assets}
        documents={appData.documents}
        emergencyContacts={appData.emergencyContacts}
        importantAccounts={appData.importantAccounts}
        continuityPlaybooks={appData.continuityPlaybooks}
        propertyId={appData.property.id}
        propertyLabel={appData.property.label}
        onAddEmergencyContact={() => router.push('/contact/new')}
        onAddImportantAccount={(kind) =>
          router.push(kind ? { pathname: '/account/new', params: { kind } } : '/account/new')
        }
        onOpenAccessArea={() => router.push('/(tabs)/access')}
        onOpenAccessItem={(accessItemId) => router.push(`/access/${accessItemId}`)}
        onOpenAsset={(assetId) => router.push(`/asset/${assetId}?source=devices`)}
        onOpenDevices={() => router.push('/(tabs)/devices')}
        onOpenDocumentArea={() => router.push({ pathname: '/(tabs)/documents', params: { collection: 'critical' } })}
        onOpenDocument={(documentId) => router.push(`/document/${documentId}`)}
        onOpenEmergencyContact={(contactId) => router.push(`/contact/${contactId}`)}
        onOpenEmergencyContacts={() => router.push('/contact')}
        onOpenExport={() => router.push('/export')}
        onOpenHousehold={() => router.push('/(tabs)/household')}
        onOpenImportantAccount={(importantAccountId) => router.push(`/account/${importantAccountId}`)}
        onOpenPlaybook={(playbookId) => router.push(`/playbook/${playbookId}`)}
        onOpenShareHub={() => router.push('/share')}
        onOpenTrustedHandoff={(audienceKey) =>
          router.push({
            pathname: '/export',
            params: audienceKey
              ? { focus: 'trusted-share', audience: audienceKey }
              : { focus: 'trusted-share' },
          })
        }
        onShareImportantAccount={(importantAccountId) =>
          router.push({
            pathname: '/share/item',
            params: { id: importantAccountId, recordType: 'important_account' },
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
