import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { useHomeVault } from '../../src/context/HomeVaultContext';
import { MaintenanceScreen } from '../../src/screens/MaintenanceScreen';

export default function MaintenanceTab() {
  const { appData } = useHomeVault();

  if (!appData) return null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <MaintenanceScreen
        tasks={appData.tasks}
        onAddTask={() => router.push('/task/new')}
        onCompleteTask={(id) => router.push(`/task/${id}/complete`)}
        onRecordRepair={() => {
          const firstAsset = appData.assets[0];
          if (firstAsset) router.push(`/asset/${firstAsset.id}/add-repair`);
          else router.push('/asset/new');
        }}
        onSnoozeTask={(id) => router.push(`/task/${id}/snooze`)}
        onTaskPress={(id) => router.push(`/task/${id}`)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 104 },
});
