import { router } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';

import { useHomeVault } from '../src/context/HomeVaultContext';
import { ServiceHistoryScreen } from '../src/screens/ServiceHistoryScreen';
import { colors } from '../src/theme/colors';

export default function ServiceHistoryRoute() {
  const { appData } = useHomeVault();

  if (!appData) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <ServiceHistoryScreen
        repairEvents={appData.repairEvents}
        taskCompletions={appData.taskCompletions}
        tasks={appData.tasks}
        assets={appData.assets}
        onBack={() => router.back()}
        onAssetPress={(id) => router.push(`/asset/${id}`)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
