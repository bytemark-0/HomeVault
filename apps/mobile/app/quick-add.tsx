import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHomeVault } from '../src/context/HomeVaultContext';
import { QuickAddScreen } from '../src/screens/QuickAddScreen';
import { colors } from '../src/theme/colors';

export default function QuickAddRoute() {
  const { appData } = useHomeVault();

  if (!appData) return null;

  const quickRepairAsset = appData.assets[0];

  return (
    <SafeAreaView style={styles.safe}>
      <QuickAddScreen
        repairAssetName={quickRepairAsset?.name}
        onOpenAccess={() => { router.back(); router.push('/(tabs)/access'); }}
        onOpenDevices={() => { router.back(); router.push({ pathname: '/asset/new', params: { mode: 'device' } }); }}
        onOpenDocuments={() => { router.back(); router.push('/document/new'); }}
        onOpenEmergency={() => { router.back(); router.push('/(tabs)/emergency'); }}
        onCancel={() => router.back()}
        onRecordRepair={() => {
          router.back();
          if (quickRepairAsset) {
            router.push(`/asset/${quickRepairAsset.id}/add-repair`);
          } else {
            router.push('/asset/new');
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
