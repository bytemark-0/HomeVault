import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { useHomeVault } from '../../src/context/HomeVaultContext';
import { SampleModeNotice } from '../../src/components/SampleModeNotice';
import { MaintenanceScreen } from '../../src/screens/MaintenanceScreen';
import {
  getAnnualReviewCompletionRoute,
  getAnnualReviewTaskRoute,
} from '../../src/utils/annualReview';

export default function MaintenanceTab() {
  const { appData } = useHomeVault();

  if (!appData) return null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SampleModeNotice />
      <MaintenanceScreen
        tasks={appData.tasks}
        onAddTask={() => router.push('/task/new')}
        onCompleteTask={(id) => router.push(getAnnualReviewCompletionRoute(id))}
        onRecordRepair={() => {
          const firstAsset = appData.assets[0];
          if (firstAsset) router.push(`/asset/${firstAsset.id}/add-repair`);
          else router.push('/asset/new');
        }}
        onSnoozeTask={(id) => router.push(`/task/${id}/snooze`)}
        onTaskPress={(id) => router.push(getAnnualReviewTaskRoute(id))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 104 },
});
