import { router } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';

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
        onAddAsset={() => { router.back(); router.push('/asset/new'); }}
        onAddDocument={() => { router.back(); router.push('/document/new'); }}
        onAddTask={() => { router.back(); router.push('/task/new'); }}
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
