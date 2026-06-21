import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { useHomeVault } from '../../src/context/HomeVaultContext';
import { SampleModeNotice } from '../../src/components/SampleModeNotice';
import { InventoryScreen } from '../../src/screens/InventoryScreen';

export default function InventoryTab() {
  const { appData } = useHomeVault();

  if (!appData) return null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SampleModeNotice />
      <InventoryScreen
        assets={appData.assets}
        onAddAsset={() => router.push('/asset/new')}
        onAssetPress={(id) => router.push(`/asset/${id}`)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 104 },
});
