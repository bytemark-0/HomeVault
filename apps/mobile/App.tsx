import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Property } from '@homevault/domain';
import type { HomeVaultExportChecklistItem, HomeVaultExportPackage } from '@homevault/export';
import type {
  CreateAssetInput,
  CreateDocumentInput,
  CreateRepairEventInput,
  CreateRoomInput,
  CreateTaskInput,
  CompleteTaskInput,
  UpdateDocumentInput,
  UpdatePropertyInput,
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
import { colors } from './src/theme/colors';

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
  | 'snoozeTask'
  | 'addRepairEvent'
  | 'serviceHistory'
  | 'costSummary';

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'home', label: 'Home', icon: 'H' },
  { key: 'inventory', label: 'Inventory', icon: 'I' },
  { key: 'maintenance', label: 'Tasks', icon: 'T' },
  { key: 'documents', label: 'Docs', icon: 'D' },
  { key: 'household', label: 'Household', icon: 'P' },
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
  const [appData, setAppData] = useState<AppData | null>(null);
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
    ] = await Promise.all([
      homeVaultRepository.getDashboard(property.id),
      homeVaultRepository.getRooms(property.id),
      homeVaultRepository.getAssets(property.id),
      homeVaultRepository.getDocuments(property.id),
      homeVaultRepository.getTasks(property.id),
      homeVaultRepository.getTaskCompletions(property.id),
      homeVaultRepository.getRepairEvents(property.id),
    ]);

    const assetList = assets.map((asset) =>
      toAssetListItem(asset, rooms, documents, repairEvents),
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
        toAssetListItem(asset, rooms, documents, repairEvents),
      ),
      recentActivity,
      savedCostLabel: formatCurrency(trackedCostCents),
      documents: documentList,
      tasks: taskList,
      taskCompletions: taskCompletionList,
      repairEvents: repairEventList,
    });
  }

  useEffect(() => {
    let isMounted = true;

    async function loadIfMounted() {
      await loadHomeVault();

      if (!isMounted) {
        return;
      }
    }

    loadIfMounted();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCreateAsset(input: CreateAssetInput) {
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
  }

  async function handleCreateRoom(input: CreateRoomInput | UpdateRoomInput) {
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
  }

  async function handleUpdateProperty(input: UpdatePropertyInput) {
    const homeVaultRepository = await getHomeVaultRepository();
    await homeVaultRepository.updateProperty(input);
    await loadHomeVault();
    setActiveTab('household');
    setMode('tabs');
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
    setActiveTab('household');
    setMode('tabs');
  }

  async function handleUpdateAsset(input: CreateAssetInput) {
    if (!input.id) {
      throw new Error('Cannot update an asset without an id.');
    }

    const homeVaultRepository = await getHomeVaultRepository();
    await homeVaultRepository.updateAsset({ ...input, id: input.id });
    await loadHomeVault();
    setSelectedAssetId(input.id);

    if (assetReturnTarget === 'roomDetail') {
      setSelectedRoomId(input.roomId ?? null);
    }

    setMode('assetDetail');
  }

  function openCompleteTask(taskId: string) {
    setSelectedTaskId(taskId);
    setMode('completeTask');
  }

  async function handleCompleteTask(input: CompleteTaskInput) {
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
      }
    }

    await loadHomeVault();
    setSelectedTaskId(input.taskId);
    setActiveTab('maintenance');
    setMode('taskDetail');
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

    const homeVaultRepository = await getHomeVaultRepository();
    await homeVaultRepository.updateTask({
      ...task,
      dueDate,
      state: 'snoozed',
    });
    await loadHomeVault();
    setSelectedTaskId(taskId);
    setActiveTab('maintenance');
    setMode('taskDetail');
  }

  async function handleCreateDocument(input: CreateDocumentInput | UpdateDocumentInput) {
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
  }

  async function handleDeleteDocument(documentId: string) {
    const homeVaultRepository = await getHomeVaultRepository();
    await homeVaultRepository.deleteDocument(documentId);
    await loadHomeVault();
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
  }

  async function handleUpdateTask(input: CreateTaskInput | UpdateTaskInput) {
    if (!input.id) {
      throw new Error('Cannot update a task without an id.');
    }

    const homeVaultRepository = await getHomeVaultRepository();
    await homeVaultRepository.updateTask({ ...input, id: input.id });
    await loadHomeVault();
    setSelectedTaskId(input.id);
    setMode('taskDetail');
  }

  async function handleDeleteTask(taskId: string) {
    const homeVaultRepository = await getHomeVaultRepository();
    await homeVaultRepository.deleteTask(taskId);
    await loadHomeVault();
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
    const homeVaultRepository = await getHomeVaultRepository();
    await homeVaultRepository.createRepairEvent(input);
    await loadHomeVault();

    if (repairReturnTarget === 'maintenance') {
      setMode('tabs');
      setActiveTab('maintenance');
    } else {
      setSelectedAssetId(input.assetId);
      setMode('assetDetail');
    }
  }

  async function handleDeleteRepairEvent(repairEventId: string) {
    const homeVaultRepository = await getHomeVaultRepository();
    await homeVaultRepository.deleteRepairEvent(repairEventId);
    await loadHomeVault();
    setMode('assetDetail');
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

  function openTaskDetail(taskId: string, returnTarget: TaskReturnTarget = 'maintenance') {
    setSelectedTaskId(taskId);
    setTaskReturnTarget(returnTarget);
    setMode('taskDetail');
  }

  const selectedAsset = appData?.assets.find((asset) => asset.id === selectedAssetId);
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
          initialRoomId={mode === 'addRoomAsset' ? selectedRoomId ?? undefined : undefined}
          onCancel={() => setMode(mode === 'addRoomAsset' ? 'roomDetail' : 'tabs')}
          onSave={handleCreateAsset}
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
        />
      </SafeAreaView>
    );
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

  if (mode === 'assetDetail' && selectedAsset) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <AssetDetailScreen
          asset={selectedAsset}
          documents={selectedAssetDocuments}
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
          onAddTask={() => setMode('addAssetTask')}
          onDocumentPress={(documentId) => {
            setSelectedDocumentId(documentId);
            setDocumentReturnTarget('assetDetail');
            setMode('documentDetail');
          }}
          onDeleteRepair={handleDeleteRepairEvent}
          onRecordRepair={() => {
            setRepairReturnTarget('assetDetail');
            setMode('addRepairEvent');
          }}
        />
      </SafeAreaView>
    );
  }

  if (mode === 'taskDetail' && selectedTask) {
    return (
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
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appFrame}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.appName}>HomeVault</Text>
            <Text style={styles.homeLabel}>{appData?.property.label ?? 'Loading home'}</Text>
          </View>
          <Pressable
            style={styles.addButton}
            accessibilityLabel="Add record"
            accessibilityRole="button"
            onPress={() => setMode('quickAdd')}
          >
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
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
                  activeTasks={appData.activeTaskCount}
                  assetCount={appData.assetCount}
                  documentCount={appData.documentCount}
                  healthScore={appData.healthScore}
                  recentActivity={appData.recentActivity}
                  dueTasks={appData.dueTasks}
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
              >
                <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                  {tab.icon}
                </Text>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
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
  tabIcon: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '900',
  },
  tabIconActive: {
    color: colors.green,
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

function addDaysToDateInput(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate.toISOString().slice(0, 10);
}

function computeNextDueDate(recurrenceLabel: string, completedAt?: string): string | null {
  const intervalDays: Record<string, number> = {
    'Monthly': 30,
    'Every 90 days': 90,
    'Twice a year': 182,
    'Yearly': 365,
  };

  const days = intervalDays[recurrenceLabel];

  if (!days) {
    return null;
  }

  const baseDate = completedAt ? new Date(completedAt) : new Date();

  return addDaysToDateInput(baseDate, days);
}

function getTaskStateForDate(dueDate: string): 'overdue' | 'due_today' | 'upcoming' {
  const today = new Date().toISOString().slice(0, 10);

  if (dueDate < today) {
    return 'overdue';
  }

  if (dueDate === today) {
    return 'due_today';
  }

  return 'upcoming';
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 100 === 0 ? 0 : 2,
  }).format(value / 100);
}
