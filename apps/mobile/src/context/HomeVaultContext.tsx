import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

import type { PartSupply, Property } from '@homevault/domain';
import type { HomeVaultExportPackage } from '@homevault/export';
import { getHomeVaultRepository } from '../data/localHomeVaultRepository';
import { SAMPLE_PROPERTY_ID } from '../data/homeVaultSampleData';
import { clearOnboardingState } from '../utils/onboardingStorage';
import {
  type AssetListItem,
  type DocumentListItem,
  type HomeActivityItem,
  type RepairEventListItem,
  type RoomListItem,
  type TaskCompletionListItem,
  type TaskListItem,
  toAssetListItem,
  toDocumentListItem,
  toHomeActivityItems,
  toRepairEventListItem,
  toRoomListItems,
  toTaskCompletionListItem,
  toTaskListItem,
} from '../data/homeVaultSampleData';
import { formatCurrency } from '../utils/taskUtils';
import { requestNotificationPermission, syncTaskNotifications } from '../utils/notificationUtils';
import { logDiagnostic } from '../utils/diagnosticLog';

export type AppData = {
  property: Property;
  assetCount: number;
  roomCount: number;
  documentCount: number;
  activeTaskCount: number;
  healthScore: number;
  rooms: RoomListItem[];
  assets: AssetListItem[];
  dueTasks: TaskListItem[];
  recentAssets: AssetListItem[];
  recentActivity: HomeActivityItem[];
  savedCostLabel: string;
  documents: DocumentListItem[];
  tasks: TaskListItem[];
  taskCompletions: TaskCompletionListItem[];
  repairEvents: RepairEventListItem[];
  parts: PartSupply[];
};

export type BackupSummary = {
  generatedAt: string;
  fileName?: string;
  kind: 'created' | 'restored';
  propertyLabel: string;
  recordCounts: HomeVaultExportPackage['manifest']['recordCounts'];
  updatedAt: string;
};

export type RestoreSummary = {
  generatedAt: string;
  propertyLabel: string;
  recordCounts: HomeVaultExportPackage['manifest']['recordCounts'];
  restoredAt: string;
};

type ToastState = { message: string; kind: 'success' | 'error' | 'info' } | null;

type HomeVaultContextValue = {
  appData: AppData | null;
  isNewUser: boolean;
  isSampleMode: boolean;
  loadError: boolean;
  backupSummary: BackupSummary | null;
  restoreSummary: RestoreSummary | null;
  toast: ToastState;
  setBackupSummary: (summary: BackupSummary | null) => void;
  setRestoreSummary: (summary: RestoreSummary | null) => void;
  reload: () => Promise<void>;
  enterSampleMode: () => Promise<void>;
  exitSampleMode: () => Promise<void>;
  finishOnboarding: () => Promise<void>;
  showToast: (message: string, kind?: 'success' | 'error' | 'info') => void;
  dismissToast: () => void;
};

const HomeVaultContext = createContext<HomeVaultContextValue | null>(null);

export function HomeVaultProvider({ children }: { children: React.ReactNode }) {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [backupSummary, setBackupSummary] = useState<BackupSummary | null>(null);
  const [restoreSummary, setRestoreSummary] = useState<RestoreSummary | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);

  async function loadHomeVault() {
    const repo = await getHomeVaultRepository();
    const [property] = await repo.getProperties();

    if (!property) {
      setIsNewUser(true);
      setAppData(null);
      return;
    }

    setIsNewUser(false);

    const [dashboard, rooms, assets, documents, tasks, taskCompletions, repairEvents, parts] =
      await Promise.all([
        repo.getDashboard(property.id),
        repo.getRooms(property.id),
        repo.getAssets(property.id),
        repo.getDocuments(property.id),
        repo.getTasks(property.id),
        repo.getTaskCompletions(property.id),
        repo.getRepairEvents(property.id),
        repo.getParts(property.id),
      ]);

    const assetList = assets.map((asset) =>
      toAssetListItem(asset, rooms, documents, repairEvents, tasks, taskCompletions),
    );
    const roomList = toRoomListItems(rooms, assets, tasks);
    const taskList = tasks.map((task) => toTaskListItem(task, assets, rooms));
    const documentList = documents.map((doc) => toDocumentListItem(doc, assets, rooms));
    const taskCompletionList = taskCompletions.map(toTaskCompletionListItem);
    const repairEventList = repairEvents.map(toRepairEventListItem);
    const recentActivity = toHomeActivityItems({
      documents: documentList,
      repairEvents: repairEventList,
      taskCompletions: taskCompletionList,
      tasks: taskList,
    });
    const trackedCostCents = [...taskCompletions, ...repairEvents].reduce(
      (sum, r) => sum + (r.costCents ?? 0),
      0,
    );
    const attentionAssetCount = assets.filter((a) => a.status !== 'ready').length;
    const healthScore = Math.max(
      0,
      Math.min(100, 100 - dashboard.activeTaskCount * 8 - attentionAssetCount * 4),
    );

    setLoadError(false);
    setAppData({
      property,
      assetCount: dashboard.assetCount,
      roomCount: dashboard.roomCount,
      documentCount: dashboard.documentCount,
      activeTaskCount: dashboard.activeTaskCount,
      healthScore,
      rooms: roomList,
      assets: assetList,
      dueTasks: dashboard.dueTasks.map((task) => toTaskListItem(task, assets, rooms)),
      recentAssets: dashboard.recentAssets.map((asset) =>
        toAssetListItem(asset, rooms, documents, repairEvents, tasks, taskCompletions),
      ),
      recentActivity,
      savedCostLabel: formatCurrency(trackedCostCents),
      documents: documentList,
      tasks: taskList,
      taskCompletions: taskCompletionList,
      repairEvents: repairEventList,
      parts,
    });

    void syncTaskNotifications(taskList);
  }

  useEffect(() => {
    void requestNotificationPermission();

    notificationListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const taskId = response.notification.request.content.data?.taskId as string | undefined;
        if (taskId) {
          router.push(`/task/${taskId}`);
        }
      },
    );

    return () => {
      notificationListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        await loadHomeVault();
      } catch (error) {
        logDiagnostic('data_load_failure', error);
        if (isMounted) setLoadError(true);
      }
    }

    load();
    return () => { isMounted = false; };
  }, []);

  const isSampleMode = appData?.property.id === SAMPLE_PROPERTY_ID;

  function showToast(message: string, kind: 'success' | 'error' | 'info' = 'success') {
    setToast({ message, kind });
  }

  async function enterSampleMode() {
    try {
      const repo = await getHomeVaultRepository();
      await repo.resetDemoData?.();
      await loadHomeVault();
    } catch (error) {
      logDiagnostic('data_load_failure', error);
      setLoadError(true);
    }
  }

  async function finishOnboarding() {
    try {
      await loadHomeVault();
    } catch (error) {
      logDiagnostic('data_load_failure', error);
      setLoadError(true);
    }
  }

  async function exitSampleMode() {
    try {
      const repo = await getHomeVaultRepository();
      await repo.clearAllData?.();
      await clearOnboardingState();
      setAppData(null);
      setIsNewUser(true);
    } catch (error) {
      logDiagnostic('data_load_failure', error);
      setLoadError(true);
    }
  }

  return (
    <HomeVaultContext.Provider
      value={{
        appData,
        isNewUser,
        isSampleMode,
        loadError,
        backupSummary,
        restoreSummary,
        toast,
        setBackupSummary,
        setRestoreSummary,
        reload: async () => {
          try {
            await loadHomeVault();
          } catch (error) {
            logDiagnostic('data_load_failure', error);
            setLoadError(true);
          }
        },
        enterSampleMode,
        exitSampleMode,
        finishOnboarding,
        showToast,
        dismissToast: () => setToast(null),
      }}
    >
      {children}
    </HomeVaultContext.Provider>
  );
}

export function useHomeVault() {
  const ctx = useContext(HomeVaultContext);
  if (!ctx) throw new Error('useHomeVault must be used within HomeVaultProvider');
  return ctx;
}
