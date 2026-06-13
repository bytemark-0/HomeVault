import type {
  Asset,
  DocumentRecord,
  MaintenanceTask,
  Property,
  RepairEvent,
  RoomArea,
  TaskCompletion,
} from '@homevault/domain';
import type { HomeVaultSnapshot } from '@homevault/database';

export type AssetListItem = Asset & {
  roomName: string;
  documentCount: number;
  lastServiceLabel: string;
  nextTaskLabel: string;
};

export type RoomListItem = RoomArea & {
  assetCount: number;
  activeTaskCount: number;
  attentionCount: number;
};

export type TaskListItem = MaintenanceTask & {
  scopeLabel: string;
  dueLabel: string;
};

export type DocumentListItem = DocumentRecord & {
  typeLabel: string;
  linkedToLabel: string;
  dateLabel: string;
};

export type RepairEventListItem = RepairEvent & {
  dateLabel: string;
  costLabel: string;
  summaryLabel: string;
};

export type TaskCompletionListItem = TaskCompletion & {
  completedAtLabel: string;
  costLabel: string;
};

export type AssetTaskCompletionListItem = TaskCompletionListItem & {
  taskTitle: string;
};

export type RoomServiceCompletionListItem = TaskCompletionListItem & {
  taskTitle: string;
  scopeLabel: string;
};

export type AssetDocumentListItem = DocumentListItem;

export type HomeActivityItem = {
  id: string;
  kind: 'document' | 'repair' | 'completion';
  targetId: string;
  title: string;
  meta: string;
  detail: string;
  occurredAt: string;
};

export const sampleProperty: Property = {
  id: 'property-maple-street',
  householdId: 'household-maple',
  label: 'Maple Street home',
  type: 'single_family',
  yearBuilt: 1998,
  purchaseDate: '2023-08-15',
};

export const sampleRooms: RoomArea[] = [
  {
    id: 'room-kitchen',
    propertyId: sampleProperty.id,
    name: 'Kitchen',
    type: 'room',
    floor: 'Main',
  },
  {
    id: 'room-utility',
    propertyId: sampleProperty.id,
    name: 'Utility',
    type: 'room',
    floor: 'Main',
  },
  {
    id: 'room-garage',
    propertyId: sampleProperty.id,
    name: 'Garage',
    type: 'area',
  },
];

export const sampleAssets: AssetListItem[] = [
  {
    id: 'asset-hvac',
    propertyId: sampleProperty.id,
    roomId: 'room-utility',
    name: 'Main HVAC',
    category: 'Heating & cooling',
    brand: 'Trane',
    model: 'XR16-042',
    serial: '2210-004582',
    status: 'needs_attention',
    roomName: 'Utility',
    documentCount: 4,
    lastServiceLabel: 'Apr 18, 2026',
    nextTaskLabel: 'Replace 20x25x1 filter',
  },
  {
    id: 'asset-dishwasher',
    propertyId: sampleProperty.id,
    roomId: 'room-kitchen',
    name: 'Dishwasher',
    category: 'Appliance',
    brand: 'Bosch',
    model: 'SHX78B75UC',
    serial: 'FD-0311-92841',
    status: 'warranty_soon',
    roomName: 'Kitchen',
    documentCount: 3,
    lastServiceLabel: 'Jan 9, 2026',
    nextTaskLabel: 'Check supply line',
  },
  {
    id: 'asset-water-heater',
    propertyId: sampleProperty.id,
    roomId: 'room-garage',
    name: 'Water heater',
    category: 'Plumbing',
    brand: 'Rheem',
    model: 'XE50T10HD50U1',
    serial: 'RH-5021-7740',
    status: 'ready',
    roomName: 'Garage',
    documentCount: 2,
    lastServiceLabel: 'Mar 2, 2026',
    nextTaskLabel: 'Flush tank',
  },
];

export const sampleTasks: TaskListItem[] = [
  {
    id: 'task-filter',
    propertyId: sampleProperty.id,
    scope: 'asset',
    scopeId: 'asset-hvac',
    title: 'Replace HVAC filter',
    dueDate: '2026-06-10',
    recurrenceKind: 'interval',
    recurrenceLabel: 'Every 90 days',
    state: 'overdue',
    scopeLabel: 'Main HVAC',
    dueLabel: 'Yesterday',
  },
  {
    id: 'task-detectors',
    propertyId: sampleProperty.id,
    scope: 'property',
    scopeId: sampleProperty.id,
    title: 'Test smoke detectors',
    dueDate: '2026-06-11',
    recurrenceKind: 'interval',
    recurrenceLabel: 'Monthly',
    state: 'due_today',
    scopeLabel: 'Whole home',
    dueLabel: 'Today',
  },
  {
    id: 'task-gutters',
    propertyId: sampleProperty.id,
    scope: 'room',
    scopeId: 'room-exterior',
    title: 'Clean gutters',
    dueDate: '2026-06-24',
    recurrenceKind: 'seasonal',
    recurrenceLabel: 'Spring and fall',
    state: 'upcoming',
    scopeLabel: 'Exterior',
    dueLabel: 'Jun 24',
  },
  {
    id: 'task-water-heater-flush',
    propertyId: sampleProperty.id,
    scope: 'asset',
    scopeId: 'asset-water-heater',
    title: 'Flush water heater',
    dueDate: '2026-03-02',
    recurrenceKind: 'interval',
    recurrenceLabel: 'Yearly',
    state: 'completed',
    scopeLabel: 'Water heater',
    dueLabel: 'Completed',
  },
  {
    id: 'task-dishwasher-filter-clean',
    propertyId: sampleProperty.id,
    scope: 'asset',
    scopeId: 'asset-dishwasher',
    title: 'Clean dishwasher filter',
    dueDate: '2026-01-09',
    recurrenceKind: 'interval',
    recurrenceLabel: 'Monthly',
    state: 'completed',
    scopeLabel: 'Dishwasher',
    dueLabel: 'Completed',
  },
];

export const sampleTaskCompletions: TaskCompletionListItem[] = [
  {
    id: 'completion-water-heater-flush-2026',
    taskId: 'task-water-heater-flush',
    completedAt: '2026-03-02T16:30:00.000Z',
    costCents: 0,
    notes: 'Drained tank until water ran clear and checked pressure relief valve.',
    completedAtLabel: 'Mar 2, 2026',
    costLabel: '$0.00',
  },
  {
    id: 'completion-dishwasher-filter-2026',
    taskId: 'task-dishwasher-filter-clean',
    completedAt: '2026-01-09T14:15:00.000Z',
    costCents: 0,
    notes: 'Removed lower filter basket and cleaned spray arm debris.',
    completedAtLabel: 'Jan 9, 2026',
    costLabel: '$0.00',
  },
];

export const sampleDocuments: DocumentListItem[] = [
  {
    id: 'doc-hvac-manual',
    propertyId: sampleProperty.id,
    title: 'XR16 installation manual',
    type: 'manual',
    linkedRecordIds: ['asset-hvac'],
    typeLabel: 'Manual',
    linkedToLabel: 'Main HVAC',
    dateLabel: 'Apr 2024',
  },
  {
    id: 'doc-dishwasher-receipt',
    propertyId: sampleProperty.id,
    title: 'Bosch purchase receipt',
    type: 'receipt',
    linkedRecordIds: ['asset-dishwasher'],
    typeLabel: 'Receipt',
    linkedToLabel: 'Dishwasher',
    dateLabel: 'Nov 2025',
  },
  {
    id: 'doc-inspection',
    propertyId: sampleProperty.id,
    title: 'Pre-purchase inspection',
    type: 'report',
    linkedRecordIds: [sampleProperty.id],
    typeLabel: 'Report',
    linkedToLabel: 'Property',
    dateLabel: 'Aug 2023',
  },
];

export const sampleRepairEvents: RepairEventListItem[] = [
  {
    id: 'repair-hvac-filter-service',
    propertyId: sampleProperty.id,
    assetId: 'asset-hvac',
    issue: 'Weak airflow',
    provider: 'Northside Heating',
    diagnosis: 'Filter was heavily loaded and return vent needed cleaning.',
    resolution: 'Replaced 20x25x1 filter and cleaned return grille.',
    costCents: 14900,
    date: '2026-04-18',
    documentIds: [],
    dateLabel: 'Apr 18, 2026',
    costLabel: '$149.00',
    summaryLabel: 'Northside Heating · $149.00',
  },
];

export const sampleSnapshot: HomeVaultSnapshot = {
  properties: [sampleProperty],
  rooms: sampleRooms,
  assets: sampleAssets,
  documents: sampleDocuments,
  tasks: sampleTasks,
  taskCompletions: sampleTaskCompletions,
  repairEvents: sampleRepairEvents,
};

export function getAssetStatusLabel(status: Asset['status']) {
  switch (status) {
    case 'needs_attention':
      return 'Needs attention';
    case 'warranty_soon':
      return 'Warranty soon';
    case 'retired':
      return 'Retired';
    case 'ready':
    default:
      return 'Ready';
  }
}

export function toAssetListItem(
  asset: Asset,
  rooms: RoomArea[],
  documents: DocumentRecord[] = [],
  repairEvents: RepairEvent[] = [],
): AssetListItem {
  const room = rooms.find((candidate) => candidate.id === asset.roomId);
  const documentCount = documents.filter((document) =>
    document.linkedRecordIds.includes(asset.id),
  ).length;
  const latestRepair = getLatestRepairEvent(asset.id, repairEvents);

  return {
    ...asset,
    roomName: room?.name ?? 'Unassigned',
    documentCount,
    lastServiceLabel: latestRepair ? formatRecordDate(latestRepair.date) : 'Not serviced',
    nextTaskLabel: asset.id === 'asset-hvac' ? 'Replace 20x25x1 filter' : 'No task yet',
  };
}

export function toTaskListItem(
  task: MaintenanceTask,
  assets: Asset[],
  rooms: RoomArea[] = [],
): TaskListItem {
  const linkedAsset = assets.find((asset) => asset.id === task.scopeId);
  const linkedRoom = rooms.find((room) => room.id === task.scopeId);

  return {
    ...task,
    scopeLabel:
      linkedAsset?.name ??
      linkedRoom?.name ??
      (task.scope === 'property' ? 'Whole home' : 'Exterior'),
    dueLabel: formatTaskDueLabel(task),
  };
}

export function toRoomListItems(
  rooms: RoomArea[],
  assets: Asset[],
  tasks: MaintenanceTask[],
): RoomListItem[] {
  return rooms.map((room) => {
    const roomAssetIds = assets
      .filter((asset) => asset.roomId === room.id)
      .map((asset) => asset.id);
    const roomTasks = tasks.filter((task) => {
      if (task.state === 'completed') {
        return false;
      }

      return (
        (task.scope === 'room' && task.scopeId === room.id) ||
        (task.scope === 'asset' && roomAssetIds.includes(task.scopeId))
      );
    });

    return {
      ...room,
      assetCount: roomAssetIds.length,
      activeTaskCount: roomTasks.length,
      attentionCount: assets.filter(
        (asset) => asset.roomId === room.id && asset.status !== 'ready',
      ).length,
    };
  });
}

export function toDocumentListItem(
  document: DocumentRecord,
  assets: Asset[],
  rooms: RoomArea[] = [],
): DocumentListItem {
  const linkedLabels = document.linkedRecordIds
    .map((recordId) => formatLinkedRecordLabel(recordId, assets, rooms, document.propertyId))
    .filter((label): label is string => Boolean(label));

  return {
    ...document,
    typeLabel: formatDocumentType(document.type),
    linkedToLabel: formatLinkedRecordSummary(linkedLabels),
    dateLabel: document.date ?? 'No date',
  };
}

export function toRepairEventListItem(repairEvent: RepairEvent): RepairEventListItem {
  return {
    ...repairEvent,
    dateLabel: formatRecordDate(repairEvent.date),
    costLabel: formatCurrency(repairEvent.costCents),
    summaryLabel: formatRepairSummary(repairEvent),
  };
}

export function toTaskCompletionListItem(
  completion: TaskCompletion,
): TaskCompletionListItem {
  return {
    ...completion,
    completedAtLabel: formatIsoDate(completion.completedAt),
    costLabel: formatCurrency(completion.costCents),
  };
}

export function toAssetTaskCompletionListItems(
  assetId: string,
  tasks: MaintenanceTask[],
  completions: TaskCompletionListItem[],
): AssetTaskCompletionListItem[] {
  const assetTaskTitles = new Map(
    tasks
      .filter((task) => task.scope === 'asset' && task.scopeId === assetId)
      .map((task) => [task.id, task.title]),
  );

  return completions
    .filter((completion) => assetTaskTitles.has(completion.taskId))
    .map((completion) => ({
      ...completion,
      taskTitle: assetTaskTitles.get(completion.taskId) ?? 'Maintenance task',
    }));
}

export function toAssetDocumentListItems(
  assetId: string,
  documents: DocumentListItem[],
): AssetDocumentListItem[] {
  return documents.filter((document) => document.linkedRecordIds.includes(assetId));
}

export function toHomeActivityItems({
  documents,
  repairEvents,
  taskCompletions,
  tasks,
}: {
  documents: DocumentListItem[];
  repairEvents: RepairEventListItem[];
  taskCompletions: TaskCompletionListItem[];
  tasks: TaskListItem[];
}): HomeActivityItem[] {
  const taskTitles = new Map(tasks.map((task) => [task.id, task.title]));
  const documentItems = documents.map((document) => ({
    id: `document-${document.id}`,
    kind: 'document' as const,
    targetId: document.id,
    title: document.title,
    meta: `${document.typeLabel} · ${document.linkedToLabel}`,
    detail: document.dateLabel,
    occurredAt: document.date ?? '',
  }));
  const repairItems = repairEvents.map((repairEvent) => ({
    id: `repair-${repairEvent.id}`,
    kind: 'repair' as const,
    targetId: repairEvent.assetId,
    title: repairEvent.issue,
    meta: repairEvent.summaryLabel,
    detail: repairEvent.dateLabel,
    occurredAt: repairEvent.date,
  }));
  const completionItems = taskCompletions.map((completion) => ({
    id: `completion-${completion.id}`,
    kind: 'completion' as const,
    targetId: completion.taskId,
    title: taskTitles.get(completion.taskId) ?? 'Maintenance completed',
    meta: completion.costLabel,
    detail: completion.completedAtLabel,
    occurredAt: completion.completedAt,
  }));

  return [...completionItems, ...repairItems, ...documentItems]
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    .slice(0, 5);
}

export function formatCostTotal(values: Array<number | undefined>) {
  const total = values.reduce<number>((sum, value) => sum + (value ?? 0), 0);

  return formatCurrency(total);
}

function formatTaskDueLabel(task: MaintenanceTask) {
  switch (task.state) {
    case 'overdue':
      return 'Yesterday';
    case 'due_today':
      return 'Today';
    case 'upcoming':
      return 'Jun 24';
    case 'completed':
      return 'Completed';
    case 'snoozed':
      return `Snoozed to ${formatRecordDate(task.dueDate)}`;
    default:
      return formatRecordDate(task.dueDate);
  }
}

function formatDocumentType(type: DocumentRecord['type']) {
  return type.slice(0, 1).toUpperCase() + type.slice(1);
}

function formatLinkedRecordLabel(
  recordId: string,
  assets: Asset[],
  rooms: RoomArea[],
  propertyId: string,
) {
  const linkedAsset = assets.find((asset) => asset.id === recordId);

  if (linkedAsset) {
    return linkedAsset.name;
  }

  const linkedRoom = rooms.find((room) => room.id === recordId);

  if (linkedRoom) {
    return linkedRoom.name;
  }

  if (recordId === propertyId) {
    return 'Property';
  }

  return undefined;
}

function formatLinkedRecordSummary(labels: string[]) {
  if (labels.length === 0) {
    return 'Unlinked';
  }

  if (labels.length <= 2) {
    return labels.join(' + ');
  }

  return `${labels[0]} + ${labels.length - 1} more`;
}

function getLatestRepairEvent(assetId: string, repairEvents: RepairEvent[]) {
  return repairEvents
    .filter((repairEvent) => repairEvent.assetId === assetId)
    .sort((left, right) => right.date.localeCompare(left.date))[0];
}

function formatRepairSummary(repairEvent: RepairEvent) {
  const provider = repairEvent.provider ?? 'Self-recorded';
  const cost = formatCurrency(repairEvent.costCents);

  return cost === 'No cost recorded' ? provider : `${provider} · ${cost}`;
}

function formatRecordDate(value?: string) {
  if (!value) {
    return 'No date';
  }

  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function formatIsoDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatCurrency(value?: number) {
  if (value === undefined) {
    return 'No cost recorded';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value / 100);
}
