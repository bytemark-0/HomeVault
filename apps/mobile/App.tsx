import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { PartSupply, Property } from '@homevault/domain';
import type { HomeVaultExportChecklistItem, HomeVaultExportPackage } from '@homevault/export';
import type {
  CompleteTaskInput,
  CreateAssetInput,
  CreateDocumentInput,
  CreatePartInput,
  CreateRepairEventInput,
  CreateRoomInput,
  CreateTaskInput,
  UpdateDocumentInput,
  UpdatePartInput,
  UpdatePropertyInput,
  UpdateRepairEventInput,
  UpdateTaskCompletionInput,
  UpdateRoomInput,
  UpdateTaskInput,
} from '@homevault/database';

import { getHomeVaultRepository } from './src/data/localHomeVaultRepository';
import {
  type AssetListItem,
  type AssetDocumentListItem,
  type AssetTaskCompletionListItem,
  type DocumentListItem,
  type HomeActivityItem,
  type RepairEventListItem,
  type RoomServiceCompletionListItem,
  type RoomListItem,
  type TaskCompletionListItem,
  type TaskListItem,
  toAssetListItem,
  toAssetDocumentListItems,
  toAssetTaskCompletionListItems,
  toDocumentListItem,
  toHomeActivityItems,
  toRepairEventListItem,
  toRoomListItems,
  toTaskCompletionListItem,
  toTaskListItem,
} from './src/data/homeVaultSampleData';
import { AddAssetScreen } from './src/screens/AddAssetScreen';
import { AddPartScreen } from './src/screens/AddPartScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { AddDocumentScreen } from './src/screens/AddDocumentScreen';
import { AddRepairEventScreen } from './src/screens/AddRepairEventScreen';
import { AddRoomScreen } from './src/screens/AddRoomScreen';
import { AddTaskScreen } from './src/screens/AddTaskScreen';
import { AssetDetailScreen } from './src/screens/AssetDetailScreen';
import { CompleteTaskScreen } from './src/screens/CompleteTaskScreen';
import { SnoozeTaskScreen } from './src/screens/SnoozeTaskScreen';
import { DocumentDetailScreen } from './src/screens/DocumentDetailScreen';
import { DocumentsScreen, type DocumentReviewFilter } from './src/screens/DocumentsScreen';
import { EditPropertyScreen } from './src/screens/EditPropertyScreen';
import { ExportManifestScreen } from './src/screens/ExportManifestScreen';
import { CostSummaryScreen } from './src/screens/CostSummaryScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ServiceHistoryScreen } from './src/screens/ServiceHistoryScreen';
import { HouseholdScreen } from './src/screens/HouseholdScreen';
import { InventoryScreen } from './src/screens/InventoryScreen';
import { MaintenanceScreen } from './src/screens/MaintenanceScreen';
import { QuickAddScreen } from './src/screens/QuickAddScreen';
import { RoomDetailScreen } from './src/screens/RoomDetailScreen';
import { TaskDetailScreen } from './src/screens/TaskDetailScreen';
import { TabIcon } from './src/components/TabIcon';
import { Toast } from './src/components/Toast';
import { colors } from './src/theme/colors';
import {
  addDaysToDateInput,
  computeNextDueDate,
  formatCurrency,
  getTaskStateForDate,
} from './src/utils/taskUtils';
import {
  clearAllNotifications,
  requestNotificationPermission,
  syncTaskNotifications,
} from './src/utils/notificationUtils';

type TabKey = 'home' | 'inventory' | 'maintenance' | 'documents' | 'household';
type AssetReturnTarget = 'inventory' | 'roomDetail';
type DocumentReturnTarget = 'documents' | 'roomDetail' | 'assetDetail';
type TaskReturnTarget = 'maintenance' | 'roomDetail' | 'assetDetail';
type AppMode =
  | 'tabs'
  | 'quickAdd'
  | 'addAsset'
  | 'addRoomAsset'
  | 'assetDetail'
  | 'editAsset'
  | 'addDocument'
  | 'documentDetail'
  | 'editDocument'
  | 'exportManifest'
  | 'editProperty'
  | 'addRoom'
  | 'roomDetail'
  | 'editRoom'
  | 'addTask'
  | 'addRoomTask'
  | 'addAssetTask'
  | 'taskDetail'
  | 'editTask'
  | 'completeTask'
  | 'editTaskCompletion'
  | 'snoozeTask'
  | 'addRepairEvent'
  | 'editRepairEvent'
  | 'addPart'
  | 'editPart'
  | 'search'
  | 'serviceHistory'
  | 'costSummary';

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'home', label: 'Home' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'maintenance', label: 'Tasks' },
  { key: 'documents', label: 'Docs' },
  { key: 'household', label: 'Household' },
];

type AppData = {
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

type RestoreSummary = {
  generatedAt: string;
  propertyLabel: string;
  recordCounts: HomeVaultExportPackage['manifest']['recordCounts'];
  restoredAt: string;
};

type BackupSummary = {
  generatedAt: string;
  fileName?: string;
  kind: 'created' | 'restored';
  propertyLabel: string;
  recordCounts: HomeVaultExportPackage['manifest']['recordCounts'];
  updatedAt: string;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [mode, setMode] = useState<AppMode>('tabs');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [documentLinkTargetId, setDocumentLinkTargetId] = useState<string | null>(null);
  const [documentReviewFilter, setDocumentReviewFilter] = useState<DocumentReviewFilter | null>(
    null,
  );
  const [assetReturnTarget, setAssetReturnTarget] =
    useState<AssetReturnTarget>('inventory');
  const [documentReturnTarget, setDocumentReturnTarget] =
    useState<DocumentReturnTarget>('documents');
  const [taskReturnTarget, setTaskReturnTarget] =
    useState<TaskReturnTarget>('maintenance');
  const [repairReturnTarget, setRepairReturnTarget] =
    useState<'assetDetail' | 'maintenance'>('assetDetail');
  const [selectedRepairEventId, setSelectedRepairEventId] = useState<string | null>(null);
  const [selectedCompletionId, setSelectedCompletionId] = useState<string | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [completionEditReturnTarget, setCompletionEditReturnTarget] =
    useState<'taskDetail' | 'assetDetail'>('taskDetail');
  const [copyFromAssetId, setCopyFromAssetId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' | 'info' } | null>(null);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [backupSummary, setBackupSummary] = useState<BackupSummary | null>(null);
  const [restoreSummary, setRestoreSummary] = useState<RestoreSummary | null>(null);

  async function loadHomeVault() {
    const homeVaultRepository = await getHomeVaultRepository();
    const [property] = await homeVaultRepository.getProperties();

    if (!property) {
      throw new Error('HomeVault requires at least one local property.');
    }

    const [
      dashboard,
      rooms,
      assets,
      documents,
      tasks,
      taskCompletions,
      repairEvents,
      parts,
    ] = await Promise.all([
      homeVaultRepository.getDashboard(property.id),
      homeVaultRepository.getRooms(property.id),
      homeVaultRepository.getAssets(property.id),
      homeVaultRepository.getDocuments(property.id),
      homeVaultRepository.getTasks(property.id),
      homeVaultRepository.getTaskCompletions(property.id),
      homeVaultRepository.getRepairEvents(property.id),
      homeVaultRepository.getParts(property.id),
    ]);

    const assetList = assets.map((asset) =>
      toAssetListItem(asset, rooms, documents, repairEvents, tasks, taskCompletions),
    );
    const roomList = toRoomListItems(rooms, assets, tasks);
    const taskList = tasks.map((task) => toTaskListItem(task, assets, rooms));
    const documentList = documents.map((document) => toDocumentListItem(document, assets, rooms));
    const taskCompletionList = taskCompletions.map(toTaskCompletionListItem);
    const repairEventList = repairEvents.map(toRepairEventListItem);
    const recentActivity = toHomeActivityItems({
      documents: documentList,
      repairEvents: repairEventList,
      taskCompletions: taskCompletionList,
      tasks: taskList,
    });
    const trackedCostCents = [...taskCompletions, ...repairEvents].reduce(
      (sum, record) => sum + (record.costCents ?? 0),
      0,
    );
    const attentionAssetCount = assets.filter((asset) => asset.status !== 'ready').length;
    const healthScore = Math.max(
      0,
      Math.min(100, 100 - dashboard.activeTaskCount * 8 - attentionAssetCount * 4),
    );

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

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    void requestNotificationPermission();

    notificationListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const taskId = response.notification.request.content.data?.taskId as string | undefined;
        if (taskId) {
          setSelectedTaskId(taskId);
          setActiveTab('maintenance');
          setMode('taskDetail');
        }
      },
    );

    return () => {
      notificationListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadIfMounted() {
      try {
        await loadHomeVault();
      } catch {
        if (isMounted) {
          setLoadError(true);
        }
      }
    }

    loadIfMounted();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCreateAsset(input: CreateAssetInput) {
    try {
      const homeVaultRepository = await getHomeVaultRepository();
      await homeVaultRepository.createAsset(input);
      await loadHomeVault();

      if (mode === 'addRoomAsset' && input.roomId) {
        setSelectedRoomId(input.roomId);
        setActiveTab('household');
        setMode('roomDetail');
        return;
      }

      setSelectedRoomId(null);
      setActiveTab('inventory');
      setMode('tabs');
    } catch {
      showToast('Could not save asset. Please try again.', 'error');
    }
  }

  async function handleCreateRoom(input: CreateRoomInput | UpdateRoomInput) {
    try {
      const homeVaultRepository = await getHomeVaultRepository();

      if (input.id) {
        await homeVaultRepository.updateRoom({ ...input, id: input.id });
        setSelectedRoomId(input.id);
        await loadHomeVault();
        setActiveTab('household');
        setMode('roomDetail');
        return;
      } else {
        await homeVaultRepository.createRoom(input);
      }

      await loadHomeVault();
      setActiveTab('household');
      setMode('tabs');
    } catch {
      showToast('Could not save room. Please try again.', 'error');
    }
  }

  async function handleUpdateProperty(input: UpdatePropertyInput) {
    try {
      const homeVaultRepository = await getHomeVaultRepository();
      await homeVaultRepository.updateProperty(input);
      await loadHomeVault();
      setActiveTab('household');
      setMode('tabs');
    } catch {
      showToast('Could not save property. Please try again.', 'error');
    }
  }

  async function handleResetDemoData() {
    const homeVaultRepository = await getHomeVaultRepository();

    if (!homeVaultRepository.resetDemoData) {
      return;
    }

    await homeVaultRepository.resetDemoData();
    await loadHomeVault();
    setSelectedAssetId(null);
    setSelectedDocumentId(null);
    setSelectedRoomId(null);
    setSelectedTaskId(null);
    setSelectedPartId(null);
    setDocumentLinkTargetId(null);
    setDocumentReviewFilter(null);
    setAssetReturnTarget('inventory');
    setDocumentReturnTarget('documents');
    setTaskReturnTarget('maintenance');
    setBackupSummary(null);
    setRestoreSummary(null);
    setActiveTab('household');
    setMode('tabs');
  }

  function handleBackupCreated(backupPackage: HomeVaultExportPackage, fileName: string) {
    setBackupSummary({
      generatedAt: backupPackage.manifest.generatedAt,
      fileName,
      kind: 'created',
      propertyLabel: backupPackage.manifest.property.label,
      recordCounts: { ...backupPackage.manifest.recordCounts },
      updatedAt: new Date().toISOString(),
    });
  }

  function handleExportFixPress(fixId: HomeVaultExportChecklistItem['id']) {
    const firstUnlinkedDocument = appData?.documents.find(
      (document) => document.linkedRecordIds.length === 0,
    );
    const firstOpenTask = appData?.tasks.find((task) => task.state !== 'completed');
    const firstAsset = appData?.assets[0];

    setSelectedAssetId(null);
    setSelectedDocumentId(null);
    setSelectedRoomId(null);
    setSelectedTaskId(null);
    setDocumentLinkTargetId(null);
    setDocumentReviewFilter(null);
    setAssetReturnTarget('inventory');
    setDocumentReturnTarget('documents');
    setTaskReturnTarget('maintenance');

    if (fixId === 'rooms') {
      setActiveTab('household');
      setMode('addRoom');
      return;
    }

    if (fixId === 'assets') {
      setActiveTab('inventory');
      setMode('addAsset');
      return;
    }

    if (fixId === 'documents') {
      setActiveTab('documents');
      if (firstUnlinkedDocument) {
        setSelectedDocumentId(firstUnlinkedDocument.id);
        setMode('editDocument');
        return;
      }

      setMode('addDocument');
      return;
    }

    if (fixId === 'attachments') {
      setActiveTab('documents');
      setDocumentReviewFilter('missingAttachments');
      setMode('tabs');
      return;
    }

    if (fixId === 'assetDocumentation') {
      setActiveTab('documents');
      setDocumentReviewFilter('missingAssetDocumentation');
      setMode('tabs');
      return;
    }

    if (fixId === 'tasks') {
      setActiveTab('maintenance');
      if (firstOpenTask) {
        setSelectedTaskId(firstOpenTask.id);
        setMode('taskDetail');
        return;
      }

      setMode('tabs');
      return;
    }

    if (firstOpenTask) {
      setActiveTab('maintenance');
      setSelectedTaskId(firstOpenTask.id);
      setMode('taskDetail');
      return;
    }

    if (firstAsset) {
      setActiveTab('inventory');
      setSelectedAssetId(firstAsset.id);
      setRepairReturnTarget('assetDetail');
      setMode('addRepairEvent');
      return;
    }

    setActiveTab('maintenance');
    setMode('tabs');
  }

  async function handleRestoreBackup(backupPackage: HomeVaultExportPackage) {
    try {
      const homeVaultRepository = await getHomeVaultRepository();

      if (!homeVaultRepository.restoreSnapshot) {
        return;
      }

      await homeVaultRepository.restoreSnapshot({
        properties: [backupPackage.records.property],
        rooms: backupPackage.records.rooms,
        assets: backupPackage.records.assets,
        documents: backupPackage.records.documents,
        tasks: backupPackage.records.tasks,
        taskCompletions: backupPackage.records.taskCompletions,
        repairEvents: backupPackage.records.repairEvents,
        parts: [],
      });
      await loadHomeVault();
      setSelectedAssetId(null);
      setSelectedDocumentId(null);
      setSelectedRoomId(null);
      setSelectedTaskId(null);
      setDocumentLinkTargetId(null);
      setAssetReturnTarget('inventory');
      setDocumentReturnTarget('documents');
      setTaskReturnTarget('maintenance');
      setBackupSummary({
        generatedAt: backupPackage.manifest.generatedAt,
        kind: 'restored',
        propertyLabel: backupPackage.manifest.property.label,
        recordCounts: { ...backupPackage.manifest.recordCounts },
        updatedAt: new Date().toISOString(),
      });
      setRestoreSummary({
        generatedAt: backupPackage.manifest.generatedAt,
        propertyLabel: backupPackage.manifest.property.label,
        recordCounts: { ...backupPackage.manifest.recordCounts },
        restoredAt: new Date().toISOString(),
      });
      showToast('Backup restored');
      setActiveTab('household');
      setMode('tabs');
    } catch {
      showToast('Could not restore backup. Please try again.', 'error');
    }
  }

  async function handleUpdateAsset(input: CreateAssetInput) {
    if (!input.id) {
      throw new Error('Cannot update an asset without an id.');
    }

    try {
      const homeVaultRepository = await getHomeVaultRepository();
      await homeVaultRepository.updateAsset({ ...input, id: input.id });
      await loadHomeVault();
      setSelectedAssetId(input.id);

      if (assetReturnTarget === 'roomDetail') {
        setSelectedRoomId(input.roomId ?? null);
      }

      setMode('assetDetail');
    } catch {
      showToast('Could not save asset. Please try again.', 'error');
    }
  }

  function openCompleteTask(taskId: string) {
    setSelectedTaskId(taskId);
    setMode('completeTask');
  }

  async function handleCompleteTask(input: CompleteTaskInput) {
    try {
      const homeVaultRepository = await getHomeVaultRepository();
      const task = appData?.tasks.find((candidate) => candidate.id === input.taskId);
      await homeVaultRepository.completeTask(input);

      if (task && task.recurrenceKind !== 'one_time') {
        const nextDueDate = computeNextDueDate(task.recurrenceLabel, input.completedAt);

        if (nextDueDate) {
          await homeVaultRepository.updateTask({
            ...task,
            dueDate: nextDueDate,
            state: getTaskStateForDate(nextDueDate),
          });
          showToast('Task completed — next due date scheduled');
        } else {
          showToast('Task completed');
        }
      } else {
        showToast('Task completed');
      }

      await loadHomeVault();
      setSelectedTaskId(input.taskId);
      setActiveTab('maintenance');
      setMode('taskDetail');
    } catch {
      showToast('Could not save completion. Please try again.', 'error');
    }
  }

  function handleSnoozeTask(taskId: string) {
    const task = appData?.tasks.find((candidate) => candidate.id === taskId);

    if (!task || task.state === 'completed') {
      return;
    }

    setSelectedTaskId(taskId);
    setMode('snoozeTask');
  }

  async function handleSaveSnooze(taskId: string, dueDate: string) {
    const task = appData?.tasks.find((candidate) => candidate.id === taskId);

    if (!task) {
      return;
    }

    try {
      const homeVaultRepository = await getHomeVaultRepository();
      await homeVaultRepository.updateTask({
        ...task,
        dueDate,
        state: 'snoozed',
      });
      await loadHomeVault();
      showToast('Task snoozed', 'info');
      setSelectedTaskId(taskId);
      setActiveTab('maintenance');
      setMode('taskDetail');
    } catch {
      showToast('Could not snooze task. Please try again.', 'error');
    }
  }

  async function handleCreateDocument(input: CreateDocumentInput | UpdateDocumentInput) {
    try {
      const homeVaultRepository = await getHomeVaultRepository();

      if (input.id) {
        await homeVaultRepository.updateDocument({ ...input, id: input.id });
      } else {
        await homeVaultRepository.createDocument(input);
      }

      await loadHomeVault();

      const linkedRoom = appData?.rooms.find((room) => room.id === documentLinkTargetId);

      if (input.id) {
        setSelectedDocumentId(input.id);
        setMode('documentDetail');
      } else if (linkedRoom) {
        setSelectedRoomId(linkedRoom.id);
        setActiveTab('household');
        setMode('roomDetail');
      } else if (documentLinkTargetId && documentLinkTargetId !== appData?.property.id) {
        setSelectedAssetId(documentLinkTargetId);
        setMode('assetDetail');
      } else {
        setActiveTab('documents');
        setMode('tabs');
      }

      setDocumentLinkTargetId(null);
    } catch {
      showToast('Could not save document. Please try again.', 'error');
    }
  }

  async function handleDeleteDocument(documentId: string) {
    const homeVaultRepository = await getHomeVaultRepository();
    await homeVaultRepository.deleteDocument(documentId);
    await loadHomeVault();
    showToast('Document deleted', 'error');
    setSelectedDocumentId(null);

    if (documentReturnTarget === 'roomDetail' && selectedRoom) {
      setActiveTab('household');
      setMode('roomDetail');
      return;
    }

    if (documentReturnTarget === 'assetDetail' && selectedAsset) {
      setMode('assetDetail');
      return;
    }

    setActiveTab('documents');
    setMode('tabs');
  }

  async function handleCreateTask(input: CreateTaskInput) {
    try {
      const homeVaultRepository = await getHomeVaultRepository();
      const task = await homeVaultRepository.createTask(input);
      await loadHomeVault();

      if (mode === 'addRoomTask' && input.scope === 'room') {
        setSelectedRoomId(input.scopeId);
        setActiveTab('household');
        setMode('roomDetail');
        return;
      }

      if (mode === 'addAssetTask' && input.scope === 'asset') {
        setSelectedAssetId(input.scopeId);
        setSelectedTaskId(task.id);
        setTaskReturnTarget('assetDetail');
        setMode('taskDetail');
        return;
      }

      setActiveTab('maintenance');
      setMode('tabs');
    } catch {
      showToast('Could not save task. Please try again.', 'error');
    }
  }

  async function handleUpdateTask(input: CreateTaskInput | UpdateTaskInput) {
    if (!input.id) {
      throw new Error('Cannot update a task without an id.');
    }

    try {
      const homeVaultRepository = await getHomeVaultRepository();
      await homeVaultRepository.updateTask({ ...input, id: input.id });
      await loadHomeVault();
      setSelectedTaskId(input.id);
      setMode('taskDetail');
    } catch {
      showToast('Could not save task. Please try again.', 'error');
    }
  }

  async function handleDeleteTask(taskId: string) {
    const homeVaultRepository = await getHomeVaultRepository();
    await homeVaultRepository.deleteTask(taskId);
    await loadHomeVault();
    showToast('Task deleted', 'error');
    setSelectedTaskId(null);

    if (taskReturnTarget === 'roomDetail' && selectedRoom) {
      setActiveTab('household');
      setMode('roomDetail');
      return;
    }

    if (taskReturnTarget === 'assetDetail' && selectedAsset) {
      setMode('assetDetail');
      return;
    }

    setActiveTab('maintenance');
    setMode('tabs');
  }

  async function handleCreateRepairEvent(input: CreateRepairEventInput) {
    try {
      const homeVaultRepository = await getHomeVaultRepository();
      await homeVaultRepository.createRepairEvent(input);
      await loadHomeVault();
      showToast('Repair recorded');

      if (repairReturnTarget === 'maintenance') {
        setMode('tabs');
        setActiveTab('maintenance');
      } else {
        setSelectedAssetId(input.assetId);
        setMode('assetDetail');
      }
    } catch {
      showToast('Could not save repair. Please try again.', 'error');
    }
  }

  async function handleUpdateRepairEvent(input: UpdateRepairEventInput) {
    try {
      const homeVaultRepository = await getHomeVaultRepository();
      await homeVaultRepository.updateRepairEvent(input);
      await loadHomeVault();
      showToast('Repair updated');
      setMode('assetDetail');
    } catch {
      showToast('Could not update repair. Please try again.', 'error');
    }
  }

  async function handleUpdateTaskCompletion(input: UpdateTaskCompletionInput) {
    try {
      const homeVaultRepository = await getHomeVaultRepository();
      await homeVaultRepository.updateTaskCompletion(input);
      await loadHomeVault();
      showToast('Completion updated');
      setMode(completionEditReturnTarget);
    } catch {
      showToast('Could not update completion. Please try again.', 'error');
    }
  }

  async function handleDeleteTaskCompletion(completionId: string) {
    try {
      const homeVaultRepository = await getHomeVaultRepository();
      await homeVaultRepository.deleteTaskCompletion(completionId);
      await loadHomeVault();
      showToast('Completion deleted');
    } catch {
      showToast('Could not delete completion. Please try again.', 'error');
    }
  }

  async function handleDeleteRepairEvent(repairEventId: string) {
    const homeVaultRepository = await getHomeVaultRepository();
    await homeVaultRepository.deleteRepairEvent(repairEventId);
    showToast('Repair deleted', 'error');
    await loadHomeVault();
    setMode('assetDetail');
  }

  async function handleSavePart(input: CreatePartInput) {
    try {
      const homeVaultRepository = await getHomeVaultRepository();
      if (input.id) {
        await homeVaultRepository.updatePart(input as UpdatePartInput);
        showToast('Part updated');
      } else {
        await homeVaultRepository.createPart(input);
        showToast('Part saved');
      }
      await loadHomeVault();
      setMode('assetDetail');
    } catch {
      showToast('Could not save part. Please try again.', 'error');
    }
  }

  async function handleDeletePart(partId: string) {
    try {
      const homeVaultRepository = await getHomeVaultRepository();
      await homeVaultRepository.deletePart(partId);
      await loadHomeVault();
      showToast('Part deleted', 'error');
    } catch {
      showToast('Could not delete part. Please try again.', 'error');
    }
  }

  async function handleDeleteAsset(assetId: string) {
    try {
      const homeVaultRepository = await getHomeVaultRepository();
      await homeVaultRepository.deleteAsset(assetId);
      showToast('Asset deleted', 'error');
      await loadHomeVault();
      if (assetReturnTarget === 'roomDetail' && selectedAssetRoom) {
        setSelectedRoomId(selectedAssetRoom.id);
        setMode('roomDetail');
      } else {
        setActiveTab('inventory');
        setMode('tabs');
      }
    } catch {
      showToast('Could not delete asset. Please try again.', 'error');
    }
  }

  async function handleDeleteRoom(roomId: string) {
    try {
      const homeVaultRepository = await getHomeVaultRepository();
      await homeVaultRepository.deleteRoom(roomId);
      showToast('Room deleted', 'error');
      await loadHomeVault();
      setActiveTab('household');
      setMode('tabs');
    } catch {
      showToast('Could not delete room. Please try again.', 'error');
    }
  }

  function handleHomeActivityPress(activity: HomeActivityItem) {
    if (activity.kind === 'document') {
      setSelectedDocumentId(activity.targetId);
      setDocumentReturnTarget('documents');
      setMode('documentDetail');
      return;
    }

    if (activity.kind === 'repair') {
      setSelectedAssetId(activity.targetId);
      setAssetReturnTarget('inventory');
      setMode('assetDetail');
      return;
    }

    setSelectedTaskId(activity.targetId);
    setMode('taskDetail');
  }

  function showToast(message: string, kind: 'success' | 'error' | 'info' = 'success') {
    setToast({ message, kind });
  }

  function handleViewServiceHistory() {
    setMode('serviceHistory');
  }

  function handleViewCostSummary() {
    setMode('costSummary');
  }

  function openAssetDetail(assetId: string, returnTarget: AssetReturnTarget = 'inventory') {
    setSelectedAssetId(assetId);
    setAssetReturnTarget(returnTarget);
    setMode('assetDetail');
  }

  function handleDuplicateAsset() {
    setCopyFromAssetId(selectedAssetId);
    setMode('addAsset');
  }

  function openTaskDetail(taskId: string, returnTarget: TaskReturnTarget = 'maintenance') {
    setSelectedTaskId(taskId);
    setTaskReturnTarget(returnTarget);
    setMode('taskDetail');
  }

  const selectedAsset = appData?.assets.find((asset) => asset.id === selectedAssetId);
  const copyFromAsset = appData?.assets.find((asset) => asset.id === copyFromAssetId);
  const quickRepairAsset = selectedAsset ?? appData?.assets[0];
  const selectedAssetRoom = appData?.rooms.find((room) => room.id === selectedAsset?.roomId);
  const selectedDocument = appData?.documents.find(
    (document) => document.id === selectedDocumentId,
  );
  const selectedRoom = appData?.rooms.find((room) => room.id === selectedRoomId);
  const selectedTask = appData?.tasks.find((task) => task.id === selectedTaskId);
  const selectedRoomAssets =
    selectedRoom && appData
      ? appData.assets.filter((asset) => asset.roomId === selectedRoom.id)
      : [];
  const selectedRoomAssetIds = selectedRoomAssets.map((asset) => asset.id);
  const selectedRoomTasks =
    selectedRoom && appData
      ? appData.tasks.filter((task) => {
          if (task.state === 'completed') {
            return false;
          }

          return (
            (task.scope === 'room' && task.scopeId === selectedRoom.id) ||
            (task.scope === 'asset' && selectedRoomAssetIds.includes(task.scopeId))
          );
        })
      : [];
  const selectedRoomDocuments =
    selectedRoom && appData
      ? appData.documents.filter(
          (document) =>
            document.linkedRecordIds.includes(selectedRoom.id) ||
            selectedRoomAssetIds.some((assetId) => document.linkedRecordIds.includes(assetId)),
        )
      : [];
  const selectedRoomRepairEvents =
    selectedRoom && appData
      ? appData.repairEvents
          .filter((repairEvent) => selectedRoomAssetIds.includes(repairEvent.assetId))
          .sort((left, right) => right.date.localeCompare(left.date))
      : [];
  const selectedRoomServiceCompletions: RoomServiceCompletionListItem[] =
    selectedRoom && appData
      ? appData.taskCompletions
          .map((completion) => {
            const task = appData.tasks.find((candidate) => candidate.id === completion.taskId);

            if (!task) {
              return null;
            }

            const isRoomTask = task.scope === 'room' && task.scopeId === selectedRoom.id;
            const isRoomAssetTask =
              task.scope === 'asset' && selectedRoomAssetIds.includes(task.scopeId);

            if (!isRoomTask && !isRoomAssetTask) {
              return null;
            }

            return {
              ...completion,
              taskTitle: task.title,
              scopeLabel: task.scopeLabel,
            };
          })
          .filter((completion): completion is RoomServiceCompletionListItem => completion !== null)
          .sort((left, right) => right.completedAt.localeCompare(left.completedAt))
      : [];
  const selectedTaskCompletions =
    appData?.taskCompletions.filter((completion) => completion.taskId === selectedTaskId) ?? [];
  const selectedAssetDocuments: AssetDocumentListItem[] =
    selectedAsset && appData
      ? toAssetDocumentListItems(selectedAsset.id, appData.documents)
      : [];
  const selectedAssetTaskCompletions: AssetTaskCompletionListItem[] =
    selectedAsset && appData
      ? toAssetTaskCompletionListItems(selectedAsset.id, appData.tasks, appData.taskCompletions)
      : [];
  const selectedAssetRepairEvents =
    appData?.repairEvents.filter((repairEvent) => repairEvent.assetId === selectedAssetId) ?? [];
  const selectedAssetParts =
    appData?.parts.filter((part) => part.assetId === selectedAssetId) ?? [];
  const linkedDocumentCount =
    appData?.documents.filter((document) => document.linkedRecordIds.length > 0).length ?? 0;
  const documentedAssetCount =
    appData?.assets.filter((asset) => asset.documentCount > 0).length ?? 0;

  if ((mode === 'addAsset' || mode === 'addRoomAsset') && appData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <AddAssetScreen
          propertyId={appData.property.id}
          rooms={appData.rooms}
          copyFrom={copyFromAsset}
          initialRoomId={mode === 'addRoomAsset' ? selectedRoomId ?? undefined : undefined}
          onCancel={() => {
            setCopyFromAssetId(null);
            setMode(mode === 'addRoomAsset' ? 'roomDetail' : 'tabs');
          }}
          onSave={async (input) => {
            setCopyFromAssetId(null);
            await handleCreateAsset(input);
          }}
        />
      </SafeAreaView>
    );
  }

  if (mode === 'addRoom' && appData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <AddRoomScreen
          propertyId={appData.property.id}
          onCancel={() => setMode('tabs')}
          onSave={handleCreateRoom}
        />
      </SafeAreaView>
    );
  }

  if (mode === 'editRoom' && appData && selectedRoom) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <AddRoomScreen
          propertyId={appData.property.id}
          room={selectedRoom}
          onCancel={() => setMode('roomDetail')}
          onSave={handleCreateRoom}
        />
      </SafeAreaView>
    );
  }

  if (mode === 'roomDetail' && selectedRoom) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <RoomDetailScreen
          room={selectedRoom}
          assets={selectedRoomAssets}
          documents={selectedRoomDocuments}
          repairEvents={selectedRoomRepairEvents}
          serviceCompletions={selectedRoomServiceCompletions}
          tasks={selectedRoomTasks}
          onAddAsset={() => setMode('addRoomAsset')}
          onAddDocument={() => {
            setDocumentLinkTargetId(selectedRoom.id);
            setMode('addDocument');
          }}
          onAddTask={() => setMode('addRoomTask')}
          onAssetPress={(assetId) => openAssetDetail(assetId, 'roomDetail')}
          onBack={() => {
            setActiveTab('household');
            setMode('tabs');
          }}
          onDocumentPress={(documentId) => {
            setSelectedDocumentId(documentId);
            setDocumentReturnTarget('roomDetail');
            setMode('documentDetail');
          }}
          onDelete={() => void handleDeleteRoom(selectedRoom.id)}
          onEdit={() => setMode('editRoom')}
          onTaskPress={(taskId) => openTaskDetail(taskId, 'roomDetail')}
        />
      </SafeAreaView>
    );
  }

  if (mode === 'editProperty' && appData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <EditPropertyScreen
          property={appData.property}
          onCancel={() => setMode('tabs')}
          onSave={handleUpdateProperty}
        />
      </SafeAreaView>
    );
  }

  if (mode === 'exportManifest' && appData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <ExportManifestScreen
          property={appData.property}
          rooms={appData.rooms}
          assets={appData.assets}
          documents={appData.documents}
          tasks={appData.tasks}
          taskCompletions={appData.taskCompletions}
          repairEvents={appData.repairEvents}
          onBackupCreated={handleBackupCreated}
          onBack={() => {
            setActiveTab('household');
            setMode('tabs');
          }}
          onFixPress={handleExportFixPress}
          onRestoreBackup={handleRestoreBackup}
        />
      </SafeAreaView>
    );
  }

  if (mode === 'quickAdd' && appData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <QuickAddScreen
          repairAssetName={quickRepairAsset?.name}
          onAddAsset={() => {
            setSelectedRoomId(null);
            setMode('addAsset');
          }}
          onAddDocument={() => {
            setDocumentLinkTargetId(null);
            setMode('addDocument');
          }}
          onAddTask={() => {
            setSelectedRoomId(null);
            setMode('addTask');
          }}
          onCancel={() => setMode('tabs')}
          onRecordRepair={() => {
            if (quickRepairAsset) {
              setSelectedAssetId(quickRepairAsset.id);
              setRepairReturnTarget('assetDetail');
              setMode('addRepairEvent');
            } else {
              setMode('addAsset');
            }
          }}
        />
      </SafeAreaView>
    );
  }

  if (mode === 'editAsset' && appData && selectedAsset) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <AddAssetScreen
          propertyId={appData.property.id}
          rooms={appData.rooms}
          asset={selectedAsset}
          onCancel={() => setMode('assetDetail')}
          onSave={handleUpdateAsset}
        />
      </SafeAreaView>
    );
  }

  if (mode === 'addDocument' && appData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <AddDocumentScreen
          propertyId={appData.property.id}
          assets={appData.assets}
          rooms={appData.rooms}
          initialLinkedRecordId={documentLinkTargetId ?? undefined}
          onCancel={() => {
            const linkedRoom = appData.rooms.find((room) => room.id === documentLinkTargetId);
            setDocumentLinkTargetId(null);

            if (linkedRoom) {
              setSelectedRoomId(linkedRoom.id);
              setMode('roomDetail');
              return;
            }

            setMode(documentLinkTargetId && selectedAsset ? 'assetDetail' : 'tabs');
          }}
          onSave={handleCreateDocument}
        />
      </SafeAreaView>
    );
  }

  if (mode === 'documentDetail' && selectedDocument) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <DocumentDetailScreen
          document={selectedDocument}
          onBack={() => {
            if (documentReturnTarget === 'roomDetail' && selectedRoom) {
              setActiveTab('household');
              setMode('roomDetail');
              return;
            }

            if (documentReturnTarget === 'assetDetail' && selectedAsset) {
              setMode('assetDetail');
              return;
            }

            setActiveTab('documents');
            setMode('tabs');
          }}
          onDelete={() => handleDeleteDocument(selectedDocument.id)}
          onEdit={() => setMode('editDocument')}
          onLinkedRecordPress={(recordId) => {
            if (!appData) return;
            if (appData.assets.some((a) => a.id === recordId)) {
              openAssetDetail(recordId);
            } else if (appData.rooms.some((r) => r.id === recordId)) {
              setSelectedRoomId(recordId);
              setActiveTab('household');
              setMode('roomDetail');
            } else {
              setActiveTab('household');
              setMode('tabs');
            }
          }}
        />
      </SafeAreaView>
    );
  }

  if (mode === 'editDocument' && appData && selectedDocument) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <AddDocumentScreen
          propertyId={appData.property.id}
          assets={appData.assets}
          rooms={appData.rooms}
          document={selectedDocument}
          onCancel={() => setMode('documentDetail')}
          onSave={handleCreateDocument}
        />
      </SafeAreaView>
    );
  }

  if ((mode === 'addTask' || mode === 'addRoomTask' || mode === 'addAssetTask') && appData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <AddTaskScreen
          propertyId={appData.property.id}
          assets={appData.assets}
          rooms={appData.rooms}
          initialScopeId={
            mode === 'addRoomTask'
              ? selectedRoomId ?? undefined
              : mode === 'addAssetTask'
                ? selectedAssetId ?? undefined
                : undefined
          }
          onCancel={() => {
            if (mode === 'addRoomTask') {
              setMode('roomDetail');
              return;
            }

            if (mode === 'addAssetTask') {
              setMode('assetDetail');
              return;
            }

            setMode('tabs');
          }}
          onSave={handleCreateTask}
        />
      </SafeAreaView>
    );
  }

  if (mode === 'editTask' && appData && selectedTask) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <AddTaskScreen
          propertyId={appData.property.id}
          assets={appData.assets}
          rooms={appData.rooms}
          task={selectedTask}
          onCancel={() => setMode('taskDetail')}
          onSave={handleUpdateTask}
        />
      </SafeAreaView>
    );
  }

  if (mode === 'completeTask' && selectedTask) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <CompleteTaskScreen
          task={selectedTask}
          onCancel={() => setMode('taskDetail')}
          onSave={handleCompleteTask}
        />
      </SafeAreaView>
    );
  }

  if (mode === 'snoozeTask' && selectedTask) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <SnoozeTaskScreen
          task={selectedTask}
          onCancel={() => setMode('taskDetail')}
          onSave={handleSaveSnooze}
        />
      </SafeAreaView>
    );
  }

  if (mode === 'serviceHistory' && appData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <ServiceHistoryScreen
          repairEvents={appData.repairEvents}
          taskCompletions={appData.taskCompletions}
          tasks={appData.tasks}
          assets={appData.assets}
          onBack={() => setMode('tabs')}
          onAssetPress={(assetId) => {
            openAssetDetail(assetId);
          }}
        />
      </SafeAreaView>
    );
  }

  if (mode === 'costSummary' && appData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <CostSummaryScreen
          repairEvents={appData.repairEvents}
          taskCompletions={appData.taskCompletions}
          tasks={appData.tasks}
          assets={appData.assets}
          rooms={appData.rooms}
          onBack={() => setMode('tabs')}
          onAssetPress={(assetId) => {
            openAssetDetail(assetId);
          }}
          onRoomPress={(roomId) => {
            setSelectedRoomId(roomId);
            setActiveTab('household');
            setMode('roomDetail');
          }}
        />
      </SafeAreaView>
    );
  }

  if (mode === 'editRepairEvent' && appData && selectedRepairEventId) {
    const repairEventToEdit = appData.repairEvents.find((r) => r.id === selectedRepairEventId);

    if (repairEventToEdit) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="dark" />
          <AddRepairEventScreen
            asset={selectedAsset ?? undefined}
            assets={appData.assets}
            propertyId={appData.property.id}
            repairEvent={repairEventToEdit}
            onCancel={() => setMode('assetDetail')}
            onSave={(input) => handleUpdateRepairEvent(input as UpdateRepairEventInput)}
          />
        </SafeAreaView>
      );
    }
  }

  if (mode === 'addRepairEvent' && appData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <AddRepairEventScreen
          asset={selectedAsset ?? undefined}
          assets={appData.assets}
          propertyId={appData.property.id}
          onCancel={() => {
            if (repairReturnTarget === 'maintenance') {
              setMode('tabs');
            } else {
              setMode('assetDetail');
            }
          }}
          onSave={handleCreateRepairEvent}
        />
      </SafeAreaView>
    );
  }

  if ((mode === 'addPart' || mode === 'editPart') && appData && selectedAsset) {
    const partToEdit =
      mode === 'editPart' && selectedPartId
        ? appData.parts.find((p) => p.id === selectedPartId)
        : undefined;

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <AddPartScreen
          propertyId={appData.property.id}
          assetId={selectedAsset.id}
          part={partToEdit}
          onCancel={() => setMode('assetDetail')}
          onSave={handleSavePart}
        />
      </SafeAreaView>
    );
  }

  if (mode === 'assetDetail' && selectedAsset) {
    return (
      <>
        <Toast message={toast?.message ?? null} kind={toast?.kind} onDismiss={() => setToast(null)} />
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="dark" />
        <AssetDetailScreen
          asset={selectedAsset}
          documents={selectedAssetDocuments}
          parts={selectedAssetParts}
          repairEvents={selectedAssetRepairEvents}
          taskCompletions={selectedAssetTaskCompletions}
          onBack={() => {
            if (assetReturnTarget === 'roomDetail' && selectedAssetRoom) {
              setSelectedRoomId(selectedAssetRoom.id);
              setActiveTab('household');
              setMode('roomDetail');
              return;
            }

            setActiveTab('inventory');
            setMode('tabs');
          }}
          onEdit={() => setMode('editAsset')}
          onAddDocument={() => {
            setDocumentLinkTargetId(selectedAsset.id);
            setDocumentReturnTarget('assetDetail');
            setMode('addDocument');
          }}
          onAddPart={() => setMode('addPart')}
          onAddTask={() => setMode('addAssetTask')}
          onDocumentPress={(documentId) => {
            setSelectedDocumentId(documentId);
            setDocumentReturnTarget('assetDetail');
            setMode('documentDetail');
          }}
          onDelete={() => void handleDeleteAsset(selectedAsset.id)}
          onDuplicate={handleDuplicateAsset}
          onDeleteRepair={handleDeleteRepairEvent}
          onEditRepair={(repairEventId) => {
            setSelectedRepairEventId(repairEventId);
            setMode('editRepairEvent');
          }}
          onEditCompletion={(completionId) => {
            const completion = appData?.taskCompletions.find((c) => c.id === completionId);
            if (completion) {
              setSelectedTaskId(completion.taskId);
              setSelectedCompletionId(completionId);
              setCompletionEditReturnTarget('assetDetail');
              setMode('editTaskCompletion');
            }
          }}
          onDeleteCompletion={handleDeleteTaskCompletion}
          onEditPart={(partId) => {
            setSelectedPartId(partId);
            setMode('editPart');
          }}
          onDeletePart={handleDeletePart}
          onRecordRepair={() => {
            setRepairReturnTarget('assetDetail');
            setMode('addRepairEvent');
          }}
        />
        </SafeAreaView>
      </>
    );
  }

  if (mode === 'editTaskCompletion' && appData && selectedTask && selectedCompletionId) {
    const completionToEdit = appData.taskCompletions.find((c) => c.id === selectedCompletionId);

    if (completionToEdit) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="dark" />
          <CompleteTaskScreen
            task={selectedTask}
            completion={completionToEdit}
            onCancel={() => setMode(completionEditReturnTarget)}
            onSave={(input) => handleUpdateTaskCompletion(input as UpdateTaskCompletionInput)}
          />
        </SafeAreaView>
      );
    }
  }

  if (mode === 'taskDetail' && selectedTask) {
    return (
      <>
        <Toast message={toast?.message ?? null} kind={toast?.kind} onDismiss={() => setToast(null)} />
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="dark" />
        <TaskDetailScreen
          task={selectedTask}
          completions={selectedTaskCompletions}
          onBack={() => {
            if (taskReturnTarget === 'roomDetail' && selectedRoom) {
              setActiveTab('household');
              setMode('roomDetail');
              return;
            }

            if (taskReturnTarget === 'assetDetail' && selectedAsset) {
              setMode('assetDetail');
              return;
            }

            setActiveTab('maintenance');
            setMode('tabs');
          }}
          onComplete={openCompleteTask}
          onDelete={() => handleDeleteTask(selectedTask.id)}
          onSnooze={handleSnoozeTask}
          onEdit={() => setMode('editTask')}
          onEditCompletion={(completionId) => {
            setSelectedCompletionId(completionId);
            setMode('editTaskCompletion');
          }}
          onDeleteCompletion={handleDeleteTaskCompletion}
          onViewScope={
            selectedTask.scope === 'asset'
              ? () => { setSelectedAssetId(selectedTask.scopeId); setMode('assetDetail'); }
              : selectedTask.scope === 'room'
                ? () => { setSelectedRoomId(selectedTask.scopeId); setActiveTab('household'); setMode('roomDetail'); }
                : undefined
          }
        />
        </SafeAreaView>
      </>
    );
  }

  if (mode === 'search' && appData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <SearchScreen
          assets={appData.assets}
          documents={appData.documents}
          rooms={appData.rooms}
          tasks={appData.tasks}
          onAssetPress={(id) => {
            openAssetDetail(id);
          }}
          onDocumentPress={(id) => {
            setSelectedDocumentId(id);
            setDocumentReturnTarget('documents');
            setMode('documentDetail');
          }}
          onRoomPress={(id) => {
            setSelectedRoomId(id);
            setActiveTab('household');
            setMode('roomDetail');
          }}
          onTaskPress={(id) => {
            openTaskDetail(id);
          }}
          onClose={() => setMode('tabs')}
        />
      </SafeAreaView>
    );
  }

  return (
    <>
      <Toast message={toast?.message ?? null} kind={toast?.kind} onDismiss={() => setToast(null)} />
      <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appFrame}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.appName}>HomeVault</Text>
            <Text style={styles.homeLabel}>{appData?.property.label ?? 'Loading home'}</Text>
          </View>
          <View style={styles.topBarActions}>
            <Pressable
              style={styles.searchButton}
              accessibilityLabel="Search"
              accessibilityRole="button"
              onPress={() => appData && setMode('search')}
            >
              <Text style={styles.searchButtonText}>⌕</Text>
            </Pressable>
            <Pressable
              style={styles.addButton}
              accessibilityLabel="Add record"
              accessibilityRole="button"
              onPress={() => setMode('quickAdd')}
            >
              <Text style={styles.addButtonText}>+</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
        >
          {appData ? (
            <>
              {activeTab === 'home' && (
                <HomeScreen
                  propertyPhotoUri={appData.property.photoUri}
                  activeTasks={appData.activeTaskCount}
                  assetCount={appData.assetCount}
                  documentCount={appData.documentCount}
                  healthScore={appData.healthScore}
                  recentActivity={appData.recentActivity}
                  dueTasks={appData.dueTasks}
                  warrantyAlerts={appData.assets.filter((a) => a.warrantyExpiringSoon)}
                  onActivityPress={handleHomeActivityPress}
                  onAssetPress={openAssetDetail}
                  onTaskPress={openTaskDetail}
                  onViewCostSummary={handleViewCostSummary}
                  onViewInventory={() => setActiveTab('inventory')}
                  onViewMaintenance={() => setActiveTab('maintenance')}
                  onViewServiceHistory={handleViewServiceHistory}
                  recentAssets={appData.recentAssets}
                  roomCount={appData.roomCount}
                  savedCostLabel={appData.savedCostLabel}
                />
              )}
              {activeTab === 'inventory' && (
                <InventoryScreen
                  assets={appData.assets}
                  onAddAsset={() => {
                    setSelectedRoomId(null);
                    setMode('addAsset');
                  }}
                  onAssetPress={openAssetDetail}
                />
              )}
              {activeTab === 'maintenance' && (
                <MaintenanceScreen
                  tasks={appData.tasks}
                  onAddTask={() => setMode('addTask')}
                  onCompleteTask={openCompleteTask}
                  onRecordRepair={() => {
                    setSelectedAssetId(null);
                    setRepairReturnTarget('maintenance');
                    setMode('addRepairEvent');
                  }}
                  onSnoozeTask={handleSnoozeTask}
                  onTaskPress={openTaskDetail}
                />
              )}
              {activeTab === 'documents' && (
                <DocumentsScreen
                  assets={appData.assets}
                  rooms={appData.rooms}
                  propertyId={appData.property.id}
                  documents={appData.documents}
                  documentCount={appData.documentCount}
                  reviewFilter={documentReviewFilter}
                  onAddDocument={() => {
                    setDocumentReviewFilter(null);
                    setMode('addDocument');
                  }}
                  onAddDocumentForRecord={(recordId) => {
                    setDocumentReviewFilter(null);
                    setDocumentLinkTargetId(recordId);
                    setDocumentReturnTarget('documents');
                    setMode('addDocument');
                  }}
                  onClearReviewFilter={() => setDocumentReviewFilter(null)}
                  onDocumentPress={(documentId) => {
                    setSelectedDocumentId(documentId);
                    setDocumentReturnTarget('documents');
                    setMode('documentDetail');
                  }}
                />
              )}
              {activeTab === 'household' && (
                <HouseholdScreen
                  activeTaskCount={appData.activeTaskCount}
                  assetCount={appData.assetCount}
                  documentCount={appData.documentCount}
                  documentedAssetCount={documentedAssetCount}
                  linkedDocumentCount={linkedDocumentCount}
                  backupSummary={backupSummary ?? undefined}
                  isDemo={appData.property.label === 'Maple Street home'}
                  property={appData.property}
                  restoreSummary={restoreSummary ?? undefined}
                  rooms={appData.rooms}
                  onAddRoom={() => setMode('addRoom')}
                  onDismissRestoreNotice={() => setRestoreSummary(null)}
                  onEditProperty={() => setMode('editProperty')}
                  onExportManifest={() => setMode('exportManifest')}
                  onResetDemoData={handleResetDemoData}
                  onRoomPress={(roomId) => {
                    setSelectedRoomId(roomId);
                    setMode('roomDetail');
                  }}
                />
              )}
            </>
          ) : loadError ? (
            <View style={styles.loadingPanel}>
              <Text style={styles.loadingTitle}>Could not load data</Text>
              <Text style={styles.loadingText}>HomeVault could not read your local records.</Text>
              <Pressable
                onPress={() => {
                  setLoadError(false);
                  loadHomeVault().catch(() => setLoadError(true));
                }}
                style={styles.retryButton}
                accessibilityRole="button"
                accessibilityLabel="Retry loading"
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.loadingPanel}>
              <Text style={styles.loadingTitle}>Loading HomeVault</Text>
              <Text style={styles.loadingText}>Preparing local household records.</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;

            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: isActive }}
              >
                <TabIcon tabKey={tab.key} color={isActive ? colors.green : colors.muted} />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.page,
  },
  appFrame: {
    flex: 1,
    backgroundColor: colors.page,
  },
  topBar: {
    minHeight: 76,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appName: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0,
  },
  homeLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: colors.ink,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '400',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 16,
    paddingBottom: 104,
  },
  loadingPanel: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    gap: 6,
  },
  loadingTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
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
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  tabBar: {
    minHeight: 74,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: colors.panel,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 6,
  },
  tabButton: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabButtonActive: {
    backgroundColor: colors.greenSoft,
  },
  tabLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
  },
  tabLabelActive: {
    color: colors.green,
  },
});

