import { useEffect, useMemo, useState } from 'react';
import { router, type Href } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { SampleModeNotice } from '../src/components/SampleModeNotice';
import { useHomeVault } from '../src/context/HomeVaultContext';
import { getHomeVaultRepository } from '../src/data/localHomeVaultRepository';
import { AnnualReviewScreen } from '../src/screens/AnnualReviewScreen';
import { colors } from '../src/theme/colors';
import {
  buildAnnualReviewChecklist,
  buildAnnualReviewTask,
  findAnnualReviewTask,
  type AnnualReviewChecklistKey,
} from '../src/utils/annualReview';
import { buildCriticalReviewQueue, isCriticalDevice } from '../src/utils/reviewFreshness';
import {
  readAnnualReviewState,
  writeAnnualReviewState,
  type AnnualReviewState,
} from '../src/utils/annualReviewStorage';
import {
  readDrillHistory,
  summarizeDrillHistory,
  type DrillHistoryEntry,
} from '../src/utils/drillHistoryStorage';
import { navigateBackOrReplace } from '../src/utils/navigation';
import { computeNextDueDate, formatDateLabel, getTaskStateForDate } from '../src/utils/taskUtils';
import { buildContinuityPlaybookGuides, supportsContinuityDrill } from '../src/utils/continuityPlaybooks';

const defaultState: AnnualReviewState = {
  lastCompletedAt: null,
  remindersEnabled: false,
};

export default function AnnualReviewRoute() {
  const { appData, reload, showToast } = useHomeVault();
  const [reviewState, setReviewState] = useState<AnnualReviewState>(defaultState);
  const [drillHistory, setDrillHistory] = useState<Record<string, DrillHistoryEntry>>({});
  const [loaded, setLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const propertyId = appData?.property.id;

  useEffect(() => {
    if (!propertyId) {
      setLoaded(false);
      return;
    }

    const stablePropertyId = propertyId;
    let isMounted = true;

    async function loadState() {
      const state = await readAnnualReviewState(stablePropertyId);
      if (!isMounted) {
        return;
      }

      setReviewState(state);
      setLoaded(true);

      void readDrillHistory(stablePropertyId).then((history) => {
        if (isMounted) {
          setDrillHistory(history);
        }
      });
    }

    void loadState();

    return () => {
      isMounted = false;
    };
  }, [propertyId]);

  const annualReviewTask = useMemo(
    () => (appData ? findAnnualReviewTask(appData.tasks, appData.property.id) : undefined),
    [appData],
  );

  const lastTaskCompletion = useMemo(() => {
    if (!appData || !annualReviewTask) {
      return null;
    }

    const completions = appData.taskCompletions
      .filter((completion) => completion.taskId === annualReviewTask.id)
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt));

    return completions[0] ?? null;
  }, [annualReviewTask, appData]);

  if (!appData || !loaded) {
    return null;
  }

  const lastCompletedAt = [reviewState.lastCompletedAt, lastTaskCompletion?.completedAt ?? null]
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => b.localeCompare(a))[0] ?? null;
  const remindersEnabled = annualReviewTask != null || reviewState.remindersEnabled;
  const nextReminderDate = annualReviewTask?.dueDate ?? null;
  const checklist = buildAnnualReviewChecklist({
    property: appData.property,
    rooms: appData.rooms,
    assets: appData.assets,
    documents: appData.documents,
    accessItems: appData.accessItems,
    emergencyContacts: appData.emergencyContacts,
    importantAccounts: appData.importantAccounts,
    continuityPlaybooks: appData.continuityPlaybooks,
    tasks: appData.tasks,
    taskCompletions: appData.taskCompletions,
    repairEvents: appData.repairEvents,
    parts: appData.parts,
  });
  const priorityReviewItems = buildCriticalReviewQueue({
    accessItems: appData.accessItems,
    assets: appData.assets,
    emergencyContacts: appData.emergencyContacts,
    importantAccounts: appData.importantAccounts,
  }).filter((item) => item.status !== 'current').slice(0, 3);
  const drillSummary = summarizeDrillHistory({
    supportedDrills: buildContinuityPlaybookGuides({
      property: appData.property,
      assets: appData.assets,
      documents: appData.documents,
      accessItems: appData.accessItems,
      emergencyContacts: appData.emergencyContacts,
      importantAccounts: appData.importantAccounts,
      continuityPlaybooks: appData.continuityPlaybooks,
    })
      .filter(supportsContinuityDrill)
      .map((guide) => ({ id: guide.id, title: guide.title })),
    history: drillHistory,
  });

  const persistState = async (nextState: AnnualReviewState) => {
    setReviewState(nextState);
    await writeAnnualReviewState(appData.property.id, nextState);
  };

  const handleOpenChecklistItem = (key: AnnualReviewChecklistKey) => {
    switch (key) {
      case 'insurance': {
        const insuranceAccount = appData.importantAccounts.find((account) => account.kind === 'insurance');
        if (insuranceAccount) {
          router.push(`/account/${insuranceAccount.id}`);
          return;
        }

        router.push({ pathname: '/account/new', params: { kind: 'insurance' } });
        return;
      }
      case 'contacts':
        if (appData.emergencyContacts[0]) {
          router.push(`/contact/${appData.emergencyContacts[0].id}`);
          return;
        }
        router.push('/contact');
        return;
      case 'access':
        if (appData.accessItems[0]) {
          router.push(`/access/${appData.accessItems[0].id}`);
          return;
        }
        router.push('/(tabs)/access');
        return;
      case 'devices':
        if (appData.assets[0]) {
          const deviceAsset = appData.assets.find((asset) => isCriticalDevice(asset)) ?? appData.assets[0];
          router.push(`/asset/${deviceAsset.id}?source=devices`);
          return;
        }
        router.push('/(tabs)/devices');
        return;
      case 'digital_safety':
        if (appData.importantAccounts[0]) {
          router.push(`/account/${appData.importantAccounts[0].id}`);
          return;
        }
        router.push('/(tabs)/emergency');
        return;
      case 'ownership':
        router.push('/(tabs)/emergency');
        return;
      case 'packet':
        router.push('/export');
        return;
      default:
        return;
    }
  };

  const handleOpenPriorityReviewItem = (key: string) => {
    const item = priorityReviewItems.find((entry) => entry.key === key);

    if (!item) {
      return;
    }

    switch (item.recordType) {
      case 'access_item':
        router.push(`/access/${item.recordId}`);
        return;
      case 'emergency_contact':
        router.push(`/contact/${item.recordId}`);
        return;
      case 'important_account':
        router.push(`/account/${item.recordId}`);
        return;
      case 'asset':
        router.push(`/asset/${item.recordId}?source=devices`);
        return;
    }
  };

  const handleOpenPracticePrompt = (guideId: string) => {
    router.push(`/drill/${guideId}` as Href);
  };

  const handleToggleReminders = async (enabled: boolean) => {
    setIsSaving(true);

    try {
      const repo = await getHomeVaultRepository();

      if (enabled) {
        const nextTask = buildAnnualReviewTask(appData.property.id, lastCompletedAt);
        if (annualReviewTask) {
          await repo.updateTask({ ...annualReviewTask, ...nextTask });
        } else {
          await repo.createTask(nextTask);
        }
        await persistState({
          lastCompletedAt,
          remindersEnabled: true,
        });
        await reload();
        showToast('Yearly annual review reminder scheduled');
      } else {
        if (annualReviewTask) {
          await repo.deleteTask(annualReviewTask.id);
        }
        await persistState({
          lastCompletedAt,
          remindersEnabled: false,
        });
        await reload();
        showToast('Yearly annual review reminder paused', 'info');
      }
    } catch {
      showToast('Could not update the annual review reminder. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteReview = async () => {
    setIsSaving(true);

    const completedAt = new Date().toISOString();
    const nextState: AnnualReviewState = {
      lastCompletedAt: completedAt,
      remindersEnabled,
    };

    try {
      const repo = await getHomeVaultRepository();
      await persistState(nextState);

      if (remindersEnabled || annualReviewTask) {
        const taskTemplate = buildAnnualReviewTask(appData.property.id, completedAt);
        const existingTask = annualReviewTask
          ? { ...annualReviewTask, ...taskTemplate }
          : await repo.createTask({
              ...taskTemplate,
              dueDate: new Date().toISOString().slice(0, 10),
              state: 'due_today',
            });

        if (annualReviewTask) {
          await repo.updateTask({
            ...existingTask,
            dueDate: new Date().toISOString().slice(0, 10),
            state: 'due_today',
          });
        }

        await repo.completeTask({ taskId: existingTask.id, completedAt });
        const nextDueDate = computeNextDueDate('Yearly', completedAt);

        if (nextDueDate) {
          await repo.updateTask({
            ...existingTask,
            dueDate: nextDueDate,
            state: getTaskStateForDate(nextDueDate),
          });
        }

        await reload();
        showToast('Annual review completed — next reminder scheduled');
      } else {
        showToast('Annual review completed');
      }
    } catch {
      showToast('Could not save annual review progress. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <SampleModeNotice />
      <AnnualReviewScreen
        checklist={checklist}
        isSaving={isSaving}
        lastCompletedLabel={lastCompletedAt ? formatDateLabel(lastCompletedAt.slice(0, 10)) : null}
        nextReminderLabel={nextReminderDate ? formatDateLabel(nextReminderDate) : null}
        practicePrompts={drillSummary.prompts}
        priorityReviewItems={priorityReviewItems.map((item) => ({
          key: item.key,
          title: item.label,
          detail: `${item.subtitle} · ${item.detail}`,
          actionLabel: 'Open record',
        }))}
        propertyLabel={appData.property.label}
        remindersEnabled={remindersEnabled}
        onBack={() => navigateBackOrReplace('/(tabs)/index' as Href)}
        onCompleteReview={() => void handleCompleteReview()}
        onOpenChecklistItem={handleOpenChecklistItem}
        onOpenPracticePrompt={handleOpenPracticePrompt}
        onOpenPriorityReviewItem={handleOpenPriorityReviewItem}
        onToggleReminders={(enabled) => void handleToggleReminders(enabled)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 104, backgroundColor: colors.page },
});
