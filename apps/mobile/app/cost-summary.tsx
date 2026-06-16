import { router } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';

import { useHomeVault } from '../src/context/HomeVaultContext';
import { CostSummaryScreen } from '../src/screens/CostSummaryScreen';
import { colors } from '../src/theme/colors';

export default function CostSummaryRoute() {
  const { appData } = useHomeVault();

  if (!appData) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <CostSummaryScreen
        repairEvents={appData.repairEvents}
        taskCompletions={appData.taskCompletions}
        tasks={appData.tasks}
        assets={appData.assets}
        rooms={appData.rooms}
        onBack={() => router.back()}
        onAssetPress={(id) => router.push(`/asset/${id}`)}
        onRoomPress={(id) => router.push(`/room/${id}`)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
