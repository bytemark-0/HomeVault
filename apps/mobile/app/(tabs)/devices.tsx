import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { isDeviceAsset } from '@homevault/domain';

import { SampleModeNotice } from '../../src/components/SampleModeNotice';
import { useHomeVault } from '../../src/context/HomeVaultContext';
import { InventoryScreen } from '../../src/screens/InventoryScreen';

export default function DevicesTab() {
  const { appData } = useHomeVault();

  if (!appData) return null;
  const deviceAssets = appData.assets.filter(isDeviceAsset);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SampleModeNotice />
      <InventoryScreen
        assets={deviceAssets}
        mode="device"
        onAddAsset={() => router.push({ pathname: '/asset/new', params: { mode: 'device', source: 'devices' } })}
        onQuickAddTemplate={(template) =>
          router.push({ pathname: '/asset/new', params: { mode: 'device', source: 'devices', template } })
        }
        onAssetPress={(id) => router.push(`/asset/${id}?source=devices`)}
        onShareAsset={(id) =>
          router.push({
            pathname: '/share/item',
            params: { id, recordType: 'asset' },
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
