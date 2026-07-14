import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { SampleModeNotice } from '../../src/components/SampleModeNotice';
import { ShareHubScreen } from '../../src/screens/ShareHubScreen';
import { navigateBackOrReplace } from '../../src/utils/navigation';

export default function ShareHubRoute() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SampleModeNotice />
      <ShareHubScreen
        onBack={() => navigateBackOrReplace('/(tabs)/emergency')}
        onOpenAccessShares={() => router.push('/(tabs)/access')}
        onOpenCareCards={() => router.push('/share/care-cards')}
        onOpenContactsShares={() => router.push('/contact')}
        onOpenDevicesShares={() => router.push('/(tabs)/devices')}
        onOpenDocumentsShares={() =>
          router.push({ pathname: '/(tabs)/documents', params: { collection: 'critical' } })
        }
        onOpenEmergencyPacket={() => router.push('/export')}
        onOpenRecoveryAccountShares={() => router.push('/(tabs)/emergency')}
        onOpenTrustedHandoff={() =>
          router.push({ pathname: '/export', params: { focus: 'trusted-share' } })
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 104 },
});
