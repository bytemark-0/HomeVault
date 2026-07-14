import type {
  Asset,
  AccessItem,
  ContinuityPlaybook,
  DocumentRecord,
  EmergencyContact,
  MaintenanceTask,
  ImportantAccount,
  PartSupply,
  Property,
  RepairEvent,
  RoomArea,
  TaskCompletion,
} from '@homevault/domain';
import type { HomeVaultSnapshot } from '@homevault/database';
import { getDocumentTypeLabel } from '../utils/documentTaxonomy';
import { formatCurrency, formatDateLabel, formatTaskDueLabel } from '../utils/taskUtils';

export type AssetListItem = Asset & {
  roomName: string;
  documentCount: number;
  lastServiceLabel: string;
  nextTaskLabel: string;
  warrantyExpiryLabel?: string;
  warrantyExpiringSoon: boolean;
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

export type LinkedRecordItem = {
  id: string;
  label: string;
  kind: 'asset' | 'room' | 'property';
};

export type DocumentListItem = DocumentRecord & {
  typeLabel: string;
  linkedToLabel: string;
  dateLabel: string;
  linkedRecords: LinkedRecordItem[];
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

export const SAMPLE_PROPERTY_ID = 'property-maple-street';

export const sampleProperty: Property = {
  id: SAMPLE_PROPERTY_ID,
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
    installDate: '2018-09-12',
    purchaseDate: '2018-09-05',
    costCents: 389900,
    status: 'needs_attention',
    roomName: 'Utility',
    documentCount: 4,
    lastServiceLabel: 'Apr 18, 2026',
    nextTaskLabel: 'Replace 20x25x1 filter',
    warrantyExpiringSoon: false,
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
    installDate: '2021-03-18',
    purchaseDate: '2021-03-10',
    costCents: 89900,
    warrantyExpiry: '2026-08-01',
    status: 'warranty_soon',
    roomName: 'Kitchen',
    documentCount: 3,
    lastServiceLabel: 'Jan 9, 2026',
    nextTaskLabel: 'Check supply line',
    warrantyExpiryLabel: 'Aug 1, 2026',
    warrantyExpiringSoon: true,
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
    installDate: '2020-11-04',
    costCents: 149900,
    status: 'ready',
    roomName: 'Garage',
    documentCount: 2,
    lastServiceLabel: 'Mar 2, 2026',
    nextTaskLabel: 'Flush tank',
    warrantyExpiringSoon: false,
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
    costLabel: '$0',
  },
  {
    id: 'completion-dishwasher-filter-2026',
    taskId: 'task-dishwasher-filter-clean',
    completedAt: '2026-01-09T14:15:00.000Z',
    costCents: 0,
    notes: 'Removed lower filter basket and cleaned spray arm debris.',
    completedAtLabel: 'Jan 9, 2026',
    costLabel: '$0',
  },
];

export const sampleDocuments: DocumentListItem[] = [
  {
    id: 'doc-home-policy',
    propertyId: sampleProperty.id,
    title: 'Prairie Mutual home policy',
    type: 'insurance',
    linkedRecordIds: [sampleProperty.id],
    typeLabel: 'Insurance',
    linkedToLabel: 'Property',
    dateLabel: 'Jun 2026',
    linkedRecords: [{ id: sampleProperty.id, label: 'Property', kind: 'property' }],
  },
  {
    id: 'doc-dishwasher-warranty',
    propertyId: sampleProperty.id,
    title: 'Bosch dishwasher warranty packet',
    type: 'warranty',
    linkedRecordIds: ['asset-dishwasher'],
    typeLabel: 'Warranty',
    linkedToLabel: 'Dishwasher',
    dateLabel: 'Mar 2021',
    linkedRecords: [{ id: 'asset-dishwasher', label: 'Dishwasher', kind: 'asset' }],
  },
  {
    id: 'doc-hvac-manual',
    propertyId: sampleProperty.id,
    title: 'XR16 installation manual',
    type: 'manual',
    linkedRecordIds: ['asset-hvac'],
    typeLabel: 'Manual',
    linkedToLabel: 'Main HVAC',
    dateLabel: 'Apr 2024',
    linkedRecords: [{ id: 'asset-hvac', label: 'Main HVAC', kind: 'asset' }],
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
    linkedRecords: [{ id: 'asset-dishwasher', label: 'Dishwasher', kind: 'asset' }],
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
    linkedRecords: [{ id: sampleProperty.id, label: 'Property', kind: 'property' }],
  },
  {
    id: 'doc-water-shutoff-map',
    propertyId: sampleProperty.id,
    title: 'Water shutoff map',
    type: 'photo',
    linkedRecordIds: ['asset-water-heater'],
    typeLabel: 'Photo',
    linkedToLabel: 'Water heater',
    dateLabel: 'May 2026',
    linkedRecords: [{ id: 'asset-water-heater', label: 'Water heater', kind: 'asset' }],
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
    costLabel: '$149',
    summaryLabel: 'Northside Heating · $149',
  },
];

export const sampleParts: PartSupply[] = [
  {
    id: 'part-1',
    propertyId: sampleProperty.id,
    assetId: 'asset-hvac',
    name: 'HVAC filter',
    size: '20x25x1 MERV-8',
    quantity: 3,
    link: 'https://www.amazon.com/s?k=20x25x1+MERV-8+filter',
  },
  {
    id: 'part-2',
    propertyId: sampleProperty.id,
    assetId: 'asset-water-heater',
    name: 'Anode rod',
    partNumber: 'SP11654B',
    quantity: 1,
  },
];

export const sampleAccessItems: AccessItem[] = [
  {
    id: 'access-wifi',
    propertyId: sampleProperty.id,
    category: 'wifi',
    label: 'Main Wi-Fi',
    username: 'MapleStreet-5G',
    accessCode: '9274',
    location: 'Router shelf in utility room',
    instructions: 'SSID is printed on the router label. Restart power only if both lights are red.',
    linkedAssetId: 'asset-hvac',
    linkedDocumentIds: ['doc-hvac-manual'],
    lastVerifiedAt: '2026-06-01',
    lastReviewedAt: '2026-06-01',
  },
  {
    id: 'access-garage',
    propertyId: sampleProperty.id,
    category: 'garage',
    label: 'Garage keypad',
    accessCode: '1942',
    location: 'Exterior keypad beside side door',
    instructions: 'Hold enter for two seconds after the code.',
    linkedDocumentIds: [],
    lastVerifiedAt: '2026-05-15',
    lastReviewedAt: '2026-05-15',
  },
  {
    id: 'access-water-shutoff',
    propertyId: sampleProperty.id,
    category: 'utility_shutoff',
    label: 'Main water shutoff',
    location: 'Garage south wall behind the shelving',
    instructions: 'Turn the blue handle clockwise until the pipe is perpendicular, then open the basement faucet to confirm flow stopped.',
    linkedAssetId: 'asset-water-heater',
    linkedDocumentIds: ['doc-water-shutoff-map'],
    lastVerifiedAt: '2026-06-18',
    lastReviewedAt: '2026-06-18',
  },
  {
    id: 'access-lockbox',
    propertyId: sampleProperty.id,
    category: 'lockbox',
    label: 'Back gate lockbox',
    accessCode: '3118',
    location: 'Mounted low on the cedar fence behind the grill cover',
    instructions: 'Press the cover closed after returning the spare key so the latch reseals.',
    linkedDocumentIds: [],
    lastVerifiedAt: '2026-06-12',
    lastReviewedAt: '2026-06-12',
  },
  {
    id: 'access-entry-note',
    propertyId: sampleProperty.id,
    category: 'entry_note',
    label: 'Side gate and dog note',
    location: 'Left-side gate off the driveway',
    instructions: 'Use the side gate first and keep the mudroom door closed until the dog settles.',
    notes: 'Package shelf is inside the mudroom on the right.',
    linkedDocumentIds: [],
  },
];

export const sampleEmergencyContacts: EmergencyContact[] = [
  {
    id: 'contact-neighbor',
    propertyId: sampleProperty.id,
    name: 'Jamie Lee',
    role: 'Neighbor with spare key',
    priority: 'primary',
    phone: '555-0101',
    notes: 'Can reach the backyard gate if pets need help.',
    lastReviewedAt: '2026-06-20',
  },
  {
    id: 'contact-plumber',
    propertyId: sampleProperty.id,
    name: 'River City Plumbing',
    role: 'Emergency plumber',
    priority: 'service_provider',
    phone: '555-0140',
    lastReviewedAt: '2026-04-01',
  },
];

export const sampleImportantAccounts: ImportantAccount[] = [
  {
    id: 'account-insurance',
    propertyId: sampleProperty.id,
    kind: 'insurance',
    providerName: 'Prairie Mutual',
    label: 'Home policy',
    accountNumber: 'POL-883492',
    website: 'https://example.com/prairie-mutual',
    phone: '555-0119',
    managerRole: 'self',
    isSharedHouseholdAccount: false,
    mfaEnabled: true,
    recoveryCodesStored: true,
    managedInPasswordManager: true,
    recoveryNotes: 'Claim photos live in the shared drive under Home/Claims.',
    linkedDocumentIds: ['doc-home-policy'],
    lastReviewedAt: '2026-06-15',
  },
  {
    id: 'account-email',
    propertyId: sampleProperty.id,
    kind: 'email',
    providerName: 'Gmail',
    label: 'Family recovery email',
    email: 'family@example.test',
    managerRole: 'shared_household',
    isSharedHouseholdAccount: true,
    mfaEnabled: true,
    recoveryCodesStored: true,
    managedInPasswordManager: true,
    recoveryNotes: 'Used for household alerts, resets, and backup notifications.',
    linkedDocumentIds: [],
    lastReviewedAt: '2026-06-10',
  },
  {
    id: 'account-carrier',
    propertyId: sampleProperty.id,
    kind: 'carrier',
    providerName: 'Blue Wireless',
    label: 'Primary mobile carrier',
    phone: '555-0122',
    managerRole: 'partner',
    isSharedHouseholdAccount: false,
    mfaEnabled: true,
    recoveryCodesStored: false,
    managedInPasswordManager: true,
    recoveryNotes: 'Use this account first for stolen phone, line lock, or SIM-swap recovery.',
    linkedDocumentIds: [],
    lastReviewedAt: '2026-04-02',
  },
  {
    id: 'account-platform',
    propertyId: sampleProperty.id,
    kind: 'platform',
    providerName: 'Apple ID',
    label: 'Family Apple account',
    email: 'family-apple@example.test',
    managerRole: 'shared_household',
    isSharedHouseholdAccount: true,
    mfaEnabled: true,
    recoveryCodesStored: false,
    managedInPasswordManager: true,
    recoveryNotes: 'Controls iCloud backups and find-my-device for the family phones.',
    linkedDocumentIds: [],
    lastReviewedAt: '2026-02-01',
  },
  {
    id: 'account-utility',
    propertyId: sampleProperty.id,
    kind: 'utility',
    providerName: 'Maple Power & Water',
    label: 'Electric and water billing',
    phone: '555-0136',
    website: 'https://example.com/maple-utility',
    managerRole: 'shared_household',
    isSharedHouseholdAccount: true,
    mfaEnabled: true,
    recoveryCodesStored: false,
    managedInPasswordManager: true,
    recoveryNotes: 'Use this account to verify outages, billing notices, and shutoff threats by calling back directly.',
    linkedDocumentIds: [],
    lastReviewedAt: '2026-06-28',
  },
  {
    id: 'account-banking',
    propertyId: sampleProperty.id,
    kind: 'banking',
    providerName: 'River Bank',
    label: 'Primary household checking',
    phone: '555-0130',
    website: 'https://example.com/river-bank',
    managerRole: 'self',
    isSharedHouseholdAccount: false,
    mfaEnabled: true,
    recoveryCodesStored: false,
    managedInPasswordManager: true,
    recoveryNotes: 'Use only the saved app bookmark and callback number for urgent fraud checks.',
    linkedDocumentIds: [],
    lastReviewedAt: '2026-06-22',
  },
];

export const sampleContinuityPlaybooks: ContinuityPlaybook[] = [
  {
    id: 'playbook-storm',
    propertyId: sampleProperty.id,
    category: 'storm',
    title: 'Storm outage restart',
    state: 'in_progress',
    steps: [
      {
        id: 'playbook-step-1',
        label: 'Confirm sump pump breaker is on',
        isRequired: true,
        isComplete: true,
      },
      {
        id: 'playbook-step-2',
        label: 'Check router and modem lights after power returns',
        isRequired: true,
        isComplete: false,
      },
    ],
    linkedRecordIds: ['asset-hvac', 'doc-hvac-manual'],
  },
];

export const sampleSnapshot: HomeVaultSnapshot = {
  properties: [sampleProperty],
  rooms: sampleRooms,
  assets: sampleAssets,
  documents: sampleDocuments,
  accessItems: sampleAccessItems,
  emergencyContacts: sampleEmergencyContacts,
  importantAccounts: sampleImportantAccounts,
  continuityPlaybooks: sampleContinuityPlaybooks,
  tasks: sampleTasks,
  taskCompletions: sampleTaskCompletions,
  repairEvents: sampleRepairEvents,
  parts: sampleParts,
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
  tasks: MaintenanceTask[] = [],
  taskCompletions: TaskCompletion[] = [],
): AssetListItem {
  const room = rooms.find((candidate) => candidate.id === asset.roomId);
  const documentCount = documents.filter((document) =>
    document.linkedRecordIds.includes(asset.id),
  ).length;
  const latestRepair = getLatestRepairEvent(asset.id, repairEvents);

  const assetTaskIds = new Set(
    tasks.filter((t) => t.scope === 'asset' && t.scopeId === asset.id).map((t) => t.id),
  );
  const latestCompletion = taskCompletions
    .filter((c) => assetTaskIds.has(c.taskId))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .at(0);

  const lastServiceDate = [latestRepair?.date, latestCompletion?.completedAt.slice(0, 10)]
    .filter(Boolean)
    .sort()
    .at(-1);

  const nextTask = tasks
    .filter((task) => task.scope === 'asset' && task.scopeId === asset.id && task.state !== 'completed')
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    .at(0);

  return {
    ...asset,
    roomName: room?.name ?? 'Unassigned',
    documentCount,
    lastServiceLabel: lastServiceDate ? formatRecordDate(lastServiceDate) : 'Not serviced',
    nextTaskLabel: nextTask?.title ?? 'No open tasks',
    warrantyExpiryLabel: asset.warrantyExpiry ? formatRecordDate(asset.warrantyExpiry) : undefined,
    warrantyExpiringSoon: asset.warrantyExpiry ? isWithin90Days(asset.warrantyExpiry) : false,
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
    dueLabel: formatTaskDueLabel(task.dueDate, task.state),
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
  const linkedRecords = document.linkedRecordIds
    .map((recordId): LinkedRecordItem | null => {
      const asset = assets.find((a) => a.id === recordId);
      if (asset) return { id: recordId, label: asset.name, kind: 'asset' };
      const room = rooms.find((r) => r.id === recordId);
      if (room) return { id: recordId, label: room.name, kind: 'room' };
      if (recordId === document.propertyId) return { id: recordId, label: 'Property', kind: 'property' };
      return null;
    })
    .filter((item): item is LinkedRecordItem => item !== null);

  const linkedLabels = linkedRecords.map((r) => r.label);

  return {
    ...document,
    typeLabel: getDocumentTypeLabel(document.type),
    linkedToLabel: formatLinkedRecordSummary(linkedLabels),
    dateLabel: document.date ?? 'No date',
    linkedRecords,
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

function isWithin90Days(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number);

  if (!year || !month || !day) {
    return false;
  }

  const target = new Date(year, month - 1, day).getTime();
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  return target > now && target - now <= ninetyDaysMs;
}

function formatRecordDate(value?: string) {
  if (!value) {
    return 'No date';
  }

  return formatDateLabel(value);
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
