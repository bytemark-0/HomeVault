import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { SampleModeNotice } from '../../src/components/SampleModeNotice';
import { useHomeVault } from '../../src/context/HomeVaultContext';
import { AccessScreen } from '../../src/screens/AccessScreen';

export default function AccessTab() {
  const { appData } = useHomeVault();

  if (!appData) return null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SampleModeNotice />
      <AccessScreen
        accessItems={appData.accessItems}
        assets={appData.assets}
        documents={appData.documents}
        onAddAccess={(category) =>
          router.push({
            pathname: '/access/new',
            params: category ? { category } : undefined,
          })
        }
        onAccessItemPress={(id) => router.push(`/access/${id}`)}
        onShareAccessItem={(id) =>
          router.push({
            pathname: '/share/item',
            params: { id, recordType: 'access_item' },
          })
        }
        onViewDevices={() => router.push('/(tabs)/devices')}
        onViewDocuments={() => router.push('/(tabs)/documents')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 104 },
});
