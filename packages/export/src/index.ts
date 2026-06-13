import type {
  Asset,
  DocumentRecord,
  MaintenanceTask,
  Property,
  RepairEvent,
  RoomArea,
  TaskCompletion,
} from '@homevault/domain';

export type HomeVaultExportManifest = {
  app: 'HomeVault';
  version: 1;
  property: {
    id: string;
    label: string;
    type: Property['type'];
    yearBuilt?: number;
    purchaseDate?: string;
  };
  generatedAt: string;
  recordCounts: {
    rooms: number;
    assets: number;
    documents: number;
    tasks: number;
    taskCompletions: number;
    repairEvents: number;
  };
  coverage: {
    activeTaskCount: number;
    linkedDocumentCount: number;
    documentedAssetCount: number;
    repairEventsWithCostCount: number;
  };
  checklist: HomeVaultExportChecklistItem[];
};

export type HomeVaultExportPackage = {
  manifest: HomeVaultExportManifest;
  records: {
    property: Property;
    rooms: RoomArea[];
    assets: Asset[];
    documents: DocumentRecord[];
    tasks: MaintenanceTask[];
    taskCompletions: TaskCompletion[];
    repairEvents: RepairEvent[];
  };
};

export type HomeVaultExportChecklistItem = {
  id: 'rooms' | 'assets' | 'documents' | 'history' | 'tasks' | 'assetDocumentation';
  label: string;
  state: 'ready' | 'review';
  detail: string;
};

export type BuildExportManifestInput = {
  property: Property;
  assets: Asset[];
  documents: DocumentRecord[];
  repairEvents: RepairEvent[];
  rooms: RoomArea[];
  taskCompletions: TaskCompletion[];
  tasks: MaintenanceTask[];
  generatedAt?: string;
};

export function buildHomeVaultExportManifest({
  property,
  assets,
  documents,
  repairEvents,
  rooms,
  taskCompletions,
  tasks,
  generatedAt = new Date().toISOString(),
}: BuildExportManifestInput): HomeVaultExportManifest {
  const activeTaskCount = tasks.filter((task) => task.state !== 'completed').length;
  const linkedDocumentCount = documents.filter(
    (document) => document.linkedRecordIds.length > 0,
  ).length;
  const documentedAssetCount = assets.filter((asset) =>
    documents.some((document) => document.linkedRecordIds.includes(asset.id)),
  ).length;
  const repairEventsWithCostCount = repairEvents.filter(
    (repairEvent) => repairEvent.costCents !== undefined,
  ).length;

  return {
    app: 'HomeVault',
    version: 1,
    property: {
      id: property.id,
      label: property.label,
      type: property.type,
      yearBuilt: property.yearBuilt,
      purchaseDate: property.purchaseDate,
    },
    generatedAt,
    recordCounts: {
      rooms: rooms.length,
      assets: assets.length,
      documents: documents.length,
      tasks: tasks.length,
      taskCompletions: taskCompletions.length,
      repairEvents: repairEvents.length,
    },
    coverage: {
      activeTaskCount,
      linkedDocumentCount,
      documentedAssetCount,
      repairEventsWithCostCount,
    },
    checklist: buildExportChecklist({
      activeTaskCount,
      assetCount: assets.length,
      documentCount: documents.length,
      documentedAssetCount,
      linkedDocumentCount,
      repairEventCount: repairEvents.length,
      repairEventsWithCostCount,
      roomCount: rooms.length,
      taskCompletionCount: taskCompletions.length,
    }),
  };
}

export function formatHomeVaultExportManifest(manifest: HomeVaultExportManifest): string {
  return JSON.stringify(manifest, null, 2);
}

export function buildHomeVaultExportPackage(
  input: BuildExportManifestInput,
): HomeVaultExportPackage {
  return {
    manifest: buildHomeVaultExportManifest(input),
    records: {
      property: { ...input.property },
      rooms: input.rooms.map((room) => ({ ...room })),
      assets: input.assets.map((asset) => ({ ...asset })),
      documents: input.documents.map((document) => ({
        ...document,
        linkedRecordIds: [...document.linkedRecordIds],
      })),
      tasks: input.tasks.map((task) => ({ ...task })),
      taskCompletions: input.taskCompletions.map((completion) => ({ ...completion })),
      repairEvents: input.repairEvents.map((repairEvent) => ({
        ...repairEvent,
        documentIds: [...repairEvent.documentIds],
      })),
    },
  };
}

export function formatHomeVaultExportPackage(exportPackage: HomeVaultExportPackage): string {
  return JSON.stringify(exportPackage, null, 2);
}

export function createHomeVaultExportFileName(manifest: HomeVaultExportManifest): string {
  const propertySlug = slugify(manifest.property.label || manifest.property.id);
  const generatedDate = manifest.generatedAt.slice(0, 10);

  return `homevault-${propertySlug}-${generatedDate}.json`;
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'export';
}

function buildExportChecklist({
  activeTaskCount,
  assetCount,
  documentCount,
  documentedAssetCount,
  linkedDocumentCount,
  repairEventCount,
  repairEventsWithCostCount,
  roomCount,
  taskCompletionCount,
}: {
  activeTaskCount: number;
  assetCount: number;
  documentCount: number;
  documentedAssetCount: number;
  linkedDocumentCount: number;
  repairEventCount: number;
  repairEventsWithCostCount: number;
  roomCount: number;
  taskCompletionCount: number;
}) {
  return [
    {
      id: 'rooms',
      label: 'Rooms and areas',
      state: roomCount > 0 ? 'ready' : 'review',
      detail:
        roomCount > 0
          ? `${roomCount} area${roomCount === 1 ? '' : 's'} included`
          : 'Add at least one room or area before exporting',
    },
    {
      id: 'assets',
      label: 'Asset inventory',
      state: assetCount > 0 ? 'ready' : 'review',
      detail:
        assetCount > 0
          ? `${assetCount} asset${assetCount === 1 ? '' : 's'} included`
          : 'Add appliances, systems, fixtures, or exterior items',
    },
    {
      id: 'documents',
      label: 'Linked documents',
      state: documentCount > 0 && linkedDocumentCount === documentCount ? 'ready' : 'review',
      detail:
        documentCount > 0
          ? `${linkedDocumentCount} of ${documentCount} document${documentCount === 1 ? '' : 's'} linked`
          : 'Add receipts, manuals, warranties, invoices, or reports',
    },
    {
      id: 'history',
      label: 'Service history',
      state: taskCompletionCount > 0 || repairEventCount > 0 ? 'ready' : 'review',
      detail:
        taskCompletionCount > 0 || repairEventCount > 0
          ? `${taskCompletionCount} completion${taskCompletionCount === 1 ? '' : 's'} and ${repairEventsWithCostCount} costed repair${repairEventsWithCostCount === 1 ? '' : 's'}`
          : 'Complete a task or record a repair to build history',
    },
    {
      id: 'tasks',
      label: 'Open maintenance',
      state: activeTaskCount === 0 ? 'ready' : 'review',
      detail:
        activeTaskCount === 0
          ? 'No open tasks need attention'
          : `${activeTaskCount} open task${activeTaskCount === 1 ? '' : 's'} to review`,
    },
    {
      id: 'assetDocumentation',
      label: 'Asset documentation',
      state: assetCount > 0 && documentedAssetCount === assetCount ? 'ready' : 'review',
      detail:
        assetCount > 0
          ? `${documentedAssetCount} of ${assetCount} asset${assetCount === 1 ? '' : 's'} have documents`
          : 'Add assets before tracking documentation coverage',
    },
  ] satisfies HomeVaultExportChecklistItem[];
}
