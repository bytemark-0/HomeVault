import { router } from 'expo-router';
import { ScrollView, StyleSheet, View, Text, Pressable } from 'react-native';

import { useHomeVault } from '../../src/context/HomeVaultContext';
import { HomeScreen } from '../../src/screens/HomeScreen';
import { SetupChecklistCard } from '../../src/components/SetupChecklistCard';
import { SampleModeNotice } from '../../src/components/SampleModeNotice';
import { colors } from '../../src/theme/colors';
import type { HomeActivityItem } from '../../src/data/homeVaultSampleData';
import { getSetupChecklistProgress } from '../../src/utils/setupChecklist';
import { formatDateLabel } from '../../src/utils/taskUtils';

export default function HomeTab() {
  const { appData, backupSummary, loadError, reload } = useHomeVault();

  function handleActivityPress(activity: HomeActivityItem) {
    if (activity.kind === 'document') {
      router.push(`/document/${activity.targetId}`);
      return;
    }
    if (activity.kind === 'repair') {
      router.push(`/asset/${activity.targetId}`);
      return;
    }
    router.push(`/task/${activity.targetId}`);
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {appData ? (
        <>
          <SampleModeNotice />
          <SetupChecklistCard />
          <HomeScreen
            propertyLabel={appData.property.label}
            propertyPhotoUri={appData.property.photoUri}
            activeTasks={appData.activeTaskCount}
            assetCount={appData.assetCount}
            documentCount={appData.documentCount}
            healthScore={appData.healthScore}
            recentActivity={appData.recentActivity}
            dueTasks={appData.dueTasks}
            warrantyAlerts={appData.assets.filter((a) => a.warrantyExpiringSoon)}
            onActivityPress={handleActivityPress}
            onAssetPress={(id) => router.push(`/asset/${id}`)}
            onTaskPress={(id) => router.push(`/task/${id}`)}
            onViewCostSummary={() => router.push('/cost-summary')}
            onViewInventory={() => router.push('/(tabs)/inventory')}
            onViewMaintenance={() => router.push('/(tabs)/maintenance')}
            onViewServiceHistory={() => router.push('/service-history')}
            recentAssets={appData.recentAssets}
            roomCount={appData.roomCount}
            savedCostLabel={appData.savedCostLabel}
            statusCards={buildStatusCards({
              activeTasks: appData.activeTaskCount,
              backupUpdatedAt: backupSummary?.updatedAt,
              documentCount: appData.documentCount,
              hasPropertyPhoto: Boolean(appData.property.photoUri),
              recentActivityCount: appData.recentActivity.length,
              roomCount: appData.roomCount,
              taskCount: appData.tasks.length,
              assetCount: appData.assetCount,
            })}
            quickActions={[
              {
                key: 'add-asset',
                label: 'Add asset',
                detail: 'Appliance, system, or tool',
                onPress: () => router.push('/asset/new'),
                tone: 'primary',
              },
              {
                key: 'add-task',
                label: 'Add task',
                detail: 'Set a reminder',
                onPress: () => router.push('/task/new'),
              },
              {
                key: 'add-document',
                label: 'Add document',
                detail: 'Warranty, receipt, or manual',
                onPress: () => router.push('/document/new'),
              },
            ]}
          />
        </>
      ) : loadError ? (
        <View style={styles.statusPanel}>
          <Text style={styles.statusTitle}>Could not load data</Text>
          <Text style={styles.statusText}>HomeVault could not read your local records.</Text>
          <Pressable
            onPress={() => reload().catch(() => {})}
            style={styles.retryButton}
            accessibilityRole="button"
            accessibilityLabel="Retry loading"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.statusPanel}>
          <Text style={styles.statusTitle}>Loading HomeVault</Text>
          <Text style={styles.statusText}>Preparing local household records.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function buildStatusCards({
  activeTasks,
  assetCount,
  backupUpdatedAt,
  documentCount,
  hasPropertyPhoto,
  recentActivityCount,
  roomCount,
  taskCount,
}: {
  activeTasks: number;
  assetCount: number;
  backupUpdatedAt?: string;
  documentCount: number;
  hasPropertyPhoto: boolean;
  recentActivityCount: number;
  roomCount: number;
  taskCount: number;
}): Array<{
  key: string;
  label: string;
  value: string;
  detail: string;
  tone: 'default' | 'success' | 'warning';
}> {
  const checklist = getSetupChecklistProgress({
    roomCount,
    assetCount,
    taskCount,
    documentCount,
    hasPropertyPhoto,
    backupCreated: Boolean(backupUpdatedAt),
  });

  return [
    {
      key: 'setup',
      label: 'Setup',
      value: checklist.incomplete.length === 0 ? 'Complete' : 'In progress',
      detail:
        checklist.incomplete.length === 0
          ? 'All starter steps are done.'
          : `${checklist.doneCount} of ${checklist.total} starter steps done.`,
      tone: checklist.incomplete.length === 0 ? 'success' : 'default',
    },
    {
      key: 'tasks',
      label: 'Due now',
      value: activeTasks > 0 ? `${activeTasks} open` : 'All clear',
      detail:
        activeTasks > 0
          ? `${activeTasks} ${activeTasks === 1 ? 'task needs' : 'tasks need'} attention.`
          : 'No urgent maintenance reminders.',
      tone: activeTasks > 0 ? 'warning' : 'success',
    },
    {
      key: 'recent',
      label: 'Recent records',
      value: recentActivityCount > 0 ? `${recentActivityCount} updates` : 'Nothing yet',
      detail:
        recentActivityCount > 0
          ? 'Latest documents, repairs, and completions are ready to review.'
          : 'New records will appear here as you build your vault.',
      tone: recentActivityCount > 0 ? 'success' : 'default',
    },
    {
      key: 'backup',
      label: 'Backup',
      value: backupUpdatedAt ? 'Ready' : 'Not started',
      detail: backupUpdatedAt
        ? `Last updated ${formatDateLabel(backupUpdatedAt.slice(0, 10))}.`
        : 'Create a backup after your first records.',
      tone: backupUpdatedAt ? 'success' : 'default',
    },
  ];
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 104 },
  statusPanel: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    gap: 6,
  },
  statusTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  statusText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  retryButton: {
    marginTop: 12,
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  retryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
});
