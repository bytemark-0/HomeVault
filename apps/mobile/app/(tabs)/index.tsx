import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, Pressable } from 'react-native';

import { useHomeVault, type AppData } from '../../src/context/HomeVaultContext';
import { HomeScreen } from '../../src/screens/HomeScreen';
import { SetupChecklistCard } from '../../src/components/SetupChecklistCard';
import { SampleModeNotice } from '../../src/components/SampleModeNotice';
import { colors } from '../../src/theme/colors';
import type { HomeActivityItem } from '../../src/data/homeVaultSampleData';
import { calculateDashboardReadinessSummary } from '../../src/utils/dashboardReadiness';
import {
  readDrillHistory,
  summarizeDrillHistory,
  type DrillHistoryEntry,
} from '../../src/utils/drillHistoryStorage';
import { getSetupChecklistProgress } from '../../src/utils/setupChecklist';
import { formatCurrency, formatDateLabel } from '../../src/utils/taskUtils';
import { getAnnualReviewTaskRoute } from '../../src/utils/annualReview';
import { buildContinuityPlaybookGuides, supportsContinuityDrill } from '../../src/utils/continuityPlaybooks';

export default function HomeTab() {
  const { appData, backupSummary, loadError, reload } = useHomeVault();
  const [drillHistory, setDrillHistory] = useState<Record<string, DrillHistoryEntry>>({});

  useEffect(() => {
    if (!appData?.property.id) {
      setDrillHistory({});
      return;
    }

    const stablePropertyId = appData.property.id;
    let isMounted = true;

    async function loadDrillHistory() {
      const history = await readDrillHistory(stablePropertyId);
      if (isMounted) {
        setDrillHistory(history);
      }
    }

    void loadDrillHistory();

    return () => {
      isMounted = false;
    };
  }, [appData?.property.id]);

  function handleActivityPress(activity: HomeActivityItem) {
    if (activity.kind === 'document') {
      router.push(`/document/${activity.targetId}`);
      return;
    }
    if (activity.kind === 'repair') {
      router.push(`/asset/${activity.targetId}`);
      return;
    }
    router.push(getAnnualReviewTaskRoute(activity.targetId));
  }

  const readinessSummary = appData
    ? calculateDashboardReadinessSummary({
        property: appData.property,
        assets: appData.assets,
        documents: appData.documents,
        accessItems: appData.accessItems,
        emergencyContacts: appData.emergencyContacts,
        importantAccounts: appData.importantAccounts,
        continuityPlaybooks: appData.continuityPlaybooks,
        tasks: appData.tasks,
      })
    : null;
  const supportedDrills = appData
    ? buildContinuityPlaybookGuides({
        property: appData.property,
        assets: appData.assets,
        documents: appData.documents,
        accessItems: appData.accessItems,
        emergencyContacts: appData.emergencyContacts,
        importantAccounts: appData.importantAccounts,
        continuityPlaybooks: appData.continuityPlaybooks,
      }).filter(supportsContinuityDrill)
    : [];
  const drillSummary = appData
    ? summarizeDrillHistory({
        supportedDrills: supportedDrills.map((guide) => ({ id: guide.id, title: guide.title })),
        history: drillHistory,
      })
    : null;

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
            readinessScore={readinessSummary?.score ?? null}
            recentActivity={appData.recentActivity}
            dueTasks={appData.dueTasks}
            warrantyAlerts={appData.assets.filter((a) => a.warrantyExpiringSoon)}
            onActivityPress={handleActivityPress}
            onAssetPress={(id) => router.push(`/asset/${id}`)}
            onTaskPress={(id) => router.push(getAnnualReviewTaskRoute(id))}
            onViewCostSummary={() => router.push('/cost-summary')}
            onViewDevices={() => router.push('/(tabs)/devices')}
            onViewMaintenance={() => router.push('/(tabs)/maintenance')}
            onViewServiceHistory={() => router.push('/service-history')}
            nextOpportunity={
              readinessSummary?.nextOpportunity
                ? {
                    label: readinessSummary.nextOpportunity.label,
                    detail: readinessSummary.nextOpportunity.detail,
                    impactLabel: `+${readinessSummary.nextOpportunity.points} pts`,
                    onPress: () =>
                      router.push(
                        readinessSummary.nextOpportunity!.route as Parameters<typeof router.push>[0],
                      ),
                  }
                : null
            }
            payoffCards={buildPayoffCards(appData)}
            recentAssets={appData.recentAssets}
            roomCount={appData.roomCount}
            savedCostLabel={appData.savedCostLabel}
            statusCards={buildStatusCards({
              appData,
              activeTasks: appData.activeTaskCount,
              backupUpdatedAt: backupSummary?.updatedAt,
              drillSummary,
              recentActivityCount: appData.recentActivity.length,
              readinessSummary,
            })}
            quickActions={[
              ...(drillSummary?.highPriorityPrompt
                ? [
                    {
                      key: `drill:${drillSummary.highPriorityPrompt.guideId}`,
                      label: drillSummary.highPriorityPrompt.actionLabel,
                      detail: drillSummary.highPriorityPrompt.detail,
                      onPress: () => router.push(`/drill/${drillSummary.highPriorityPrompt.guideId}`),
                      tone: 'primary' as const,
                    },
                  ]
                : []),
              {
                key: 'open-access',
                label: 'Access details',
                detail: 'Wi-Fi, codes, and shutoff notes',
                onPress: () => router.push('/(tabs)/access'),
                tone: drillSummary?.highPriorityPrompt ? 'secondary' : 'primary',
              },
              {
                key: 'open-emergency',
                label: 'Emergency contacts',
                detail: 'Who to call and what to export',
                onPress: () => router.push('/contact'),
              },
              {
                key: 'annual-review',
                label: 'Annual review',
                detail: 'Refresh continuity records once a year',
                onPress: () => router.push('/annual-review'),
              },
              {
                key: 'insurance-records',
                label: 'Insurance records',
                detail: 'Policies, claim files, and key coverage docs',
                onPress: () =>
                  router.push({ pathname: '/(tabs)/documents', params: { collection: 'insurance' } }),
              },
              {
                key: 'add-device',
                label: 'Add device',
                detail: 'Router, system, or appliance',
                onPress: () => router.push({ pathname: '/asset/new', params: { mode: 'device' } }),
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
  appData,
  activeTasks,
  backupUpdatedAt,
  drillSummary,
  recentActivityCount,
  readinessSummary,
}: {
  appData: AppData;
  activeTasks: number;
  backupUpdatedAt?: string;
  drillSummary: ReturnType<typeof summarizeDrillHistory> | null;
  recentActivityCount: number;
  readinessSummary: ReturnType<typeof calculateDashboardReadinessSummary> | null;
}): Array<{
  key: string;
  label: string;
  value: string;
  detail: string;
  tone: 'default' | 'success' | 'warning';
}> {
  const checklist = getSetupChecklistProgress({
    accessItems: appData.accessItems,
    assets: appData.assets,
    emergencyContacts: appData.emergencyContacts,
    importantAccounts: appData.importantAccounts,
  });

  return [
    {
      key: 'setup',
      label: 'Readiness',
      value: readinessSummary ? `${readinessSummary.score}% ready` : 'Not rated',
      detail:
        readinessSummary && readinessSummary.staleRecordsCount > 0
          ? `${readinessSummary.priorityReviewAlerts[0]?.label ?? 'Review one stale emergency record'} first. ${
              readinessSummary.staleRecordsCount
            } emergency-critical record${readinessSummary.staleRecordsCount === 1 ? '' : 's'} still need review.`
          : readinessSummary?.nextOpportunity
            ? `Next lift: ${readinessSummary.nextOpportunity.label}.`
            : checklist.incomplete.length === 0
              ? 'Core household records are in place.'
              : `${checklist.doneCount} of ${checklist.total} essentials saved.`,
      tone:
        readinessSummary && readinessSummary.staleRecordsCount > 0
          ? 'warning'
          : readinessSummary && readinessSummary.score >= 80
          ? 'success'
          : checklist.incomplete.length === 0
            ? 'success'
            : 'default',
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
      label: 'Recovery playbooks',
      value: drillSummary
        ? `${drillSummary.practicedCount}/${drillSummary.totalSupportedCount} practiced`
        : readinessSummary
          ? `${readinessSummary.playbooksReadyCount} ready`
          : 'Not started',
      detail:
        drillSummary?.highPriorityPrompt
          ? drillSummary.highPriorityPrompt.detail
          : readinessSummary && readinessSummary.playbooksReadyCount >= 3
            ? 'At least three guided recovery playbooks are ready to use.'
            : 'Link the records behind your guided recovery playbooks.',
      tone:
        drillSummary?.highPriorityPrompt
          ? 'warning'
          : readinessSummary && readinessSummary.playbooksReadyCount >= 3
            ? 'success'
            : 'default',
    },
    {
      key: 'backup',
      label: 'Emergency packet',
      value: readinessSummary
        ? `${readinessSummary.packetReadySectionCount}/5 sections`
        : 'Not started',
      detail:
        backupUpdatedAt
          ? `Backup ready. Last updated ${formatDateLabel(backupUpdatedAt.slice(0, 10))}.`
          : 'Add enough continuity records to fill more packet sections.',
      tone:
        readinessSummary && readinessSummary.packetReadySectionCount >= 4
          ? 'success'
          : 'default',
    },
  ];
}

function buildPayoffCards(appData: AppData): Array<{
  key: string;
  label: string;
  value: string;
  detail: string;
  tone: 'default' | 'success';
}> {
  const hasRecords =
    appData.assetCount > 0 ||
    appData.documentCount > 0 ||
    appData.tasks.length > 0 ||
    appData.taskCompletions.length > 0 ||
    appData.repairEvents.length > 0;

  if (!hasRecords) {
    return [];
  }

  const documentedAssets = appData.assets.filter((asset) => asset.documentCount > 0).length;
  const linkedDocuments = appData.documents.filter((document) => document.linkedRecords.length > 0).length;
  const scheduledTasks = appData.tasks.filter((task) => task.state !== 'completed').length;
  const serviceEvents = appData.taskCompletions.length + appData.repairEvents.length;
  const trackedCostCents = [...appData.taskCompletions, ...appData.repairEvents].reduce(
    (sum, item) => sum + (item.costCents ?? 0),
    0,
  );

  return [
    {
      key: 'break-fix-ready',
      label: 'When Something Breaks',
      value:
        documentedAssets > 0
          ? `${documentedAssets} device${documentedAssets === 1 ? '' : 's'} documented`
          : linkedDocuments > 0
            ? `${linkedDocuments} record${linkedDocuments === 1 ? '' : 's'} saved`
            : 'No repair docs yet',
      detail:
        documentedAssets > 0
          ? 'Manuals, receipts, and warranties are already tied to the right equipment.'
          : 'Save one key record and the guide starts helping in the moment you need it.',
      tone: documentedAssets > 0 || linkedDocuments > 0 ? 'success' : 'default',
    },
    {
      key: 'maintenance-memory',
      label: 'Work You Won’t Forget',
      value:
        scheduledTasks > 0
          ? `${scheduledTasks} reminder${scheduledTasks === 1 ? '' : 's'} scheduled`
          : serviceEvents > 0
            ? `${serviceEvents} upkeep event${serviceEvents === 1 ? '' : 's'} logged`
            : 'No upkeep routine yet',
      detail:
        scheduledTasks > 0
          ? 'Recurring work no longer has to live in one person’s head.'
          : 'A saved reminder is where household continuity starts paying you back.',
      tone: scheduledTasks > 0 ? 'success' : 'default',
    },
    {
      key: 'service-history',
      label: 'History You Can Prove',
      value:
        trackedCostCents > 0
          ? formatCurrency(trackedCostCents)
          : serviceEvents > 0
            ? `${serviceEvents} service event${serviceEvents === 1 ? '' : 's'} recorded`
            : 'No service history yet',
      detail:
        trackedCostCents > 0
          ? 'Repair and maintenance costs are starting to add up in one timeline.'
          : serviceEvents > 0
            ? 'You now have a record of what was done and when.'
            : 'Complete a task or log a repair to build a usable home history.',
      tone: trackedCostCents > 0 || serviceEvents > 0 ? 'success' : 'default',
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
