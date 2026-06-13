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
    attachedDocumentCount: number;
    linkedDocumentCount: number;
    documentedAssetCount: number;
    repairEventsWithCostCount: number;
  };
  checklist: HomeVaultExportChecklistItem[];
};

export type HomeVaultExportPackage = {
  manifest: HomeVaultExportManifest;
  attachments: HomeVaultExportAttachment[];
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

export type HomeVaultExportAttachment = {
  documentId: string;
  title: string;
  attachedAt?: string;
  filePath: string;
  fileName?: string;
  linkedRecordIds: string[];
  mimeType?: string;
  sizeBytes?: number;
  storageKind?: NonNullable<DocumentRecord['attachment']>['storageKind'];
  type: DocumentRecord['type'];
};

export type HomeVaultExportPackageValidation =
  | {
      ok: true;
      package: HomeVaultExportPackage;
      preview: HomeVaultImportPreview;
      summary: string;
    }
  | {
      ok: false;
      errors: string[];
    };

export type HomeVaultImportPreview = {
  attachmentCount: number;
  generatedAt: string;
  propertyLabel: string;
  recordCounts: HomeVaultExportManifest['recordCounts'];
  reviewItemCount: number;
};

export type HomeVaultExportChecklistItem = {
  id:
    | 'rooms'
    | 'assets'
    | 'documents'
    | 'history'
    | 'tasks'
    | 'assetDocumentation'
    | 'attachments';
  label: string;
  state: 'ready' | 'review';
  detail: string;
  action: string;
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
  const attachedDocumentCount = documents.filter((document) => getDocumentAttachmentUri(document)).length;
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
      attachedDocumentCount,
      linkedDocumentCount,
      documentedAssetCount,
      repairEventsWithCostCount,
    },
    checklist: buildExportChecklist({
      activeTaskCount,
      attachedDocumentCount,
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
    attachments: buildExportAttachments(input.documents),
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

export function parseHomeVaultExportPackage(
  source: string,
): HomeVaultExportPackageValidation {
  let parsed: unknown;

  try {
    parsed = JSON.parse(source);
  } catch {
    return { ok: false, errors: ['The selected file is not valid JSON.'] };
  }

  return validateHomeVaultExportPackage(parsed);
}

export function validateHomeVaultExportPackage(
  candidate: unknown,
): HomeVaultExportPackageValidation {
  const errors: string[] = [];

  if (!isRecord(candidate)) {
    return { ok: false, errors: ['The package must be a JSON object.'] };
  }

  const manifest = candidate.manifest;
  const records = candidate.records;
  const attachments = candidate.attachments;

  if (!isRecord(manifest)) {
    errors.push('Missing manifest object.');
  }

  if (!isRecord(records)) {
    errors.push('Missing records object.');
  }

  if (!Array.isArray(attachments)) {
    errors.push('Missing attachments array.');
  }

  if (errors.length > 0 || !isRecord(manifest) || !isRecord(records) || !Array.isArray(attachments)) {
    return { ok: false, errors };
  }

  if (manifest.app !== 'HomeVault') {
    errors.push('Manifest app must be HomeVault.');
  }

  if (manifest.version !== 1) {
    errors.push('Only HomeVault export version 1 is supported.');
  }

  if (!isRecord(manifest.recordCounts)) {
    errors.push('Manifest record counts are missing.');
  }

  const roomCount = validateArrayCount(records.rooms, manifest.recordCounts, 'rooms', errors);
  const assetCount = validateArrayCount(records.assets, manifest.recordCounts, 'assets', errors);
  const documentCount = validateArrayCount(
    records.documents,
    manifest.recordCounts,
    'documents',
    errors,
  );
  const taskCount = validateArrayCount(records.tasks, manifest.recordCounts, 'tasks', errors);
  validateArrayCount(records.taskCompletions, manifest.recordCounts, 'taskCompletions', errors);
  validateArrayCount(records.repairEvents, manifest.recordCounts, 'repairEvents', errors);

  if (!isRecord(records.property)) {
    errors.push('Property record is missing.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    package: candidate as HomeVaultExportPackage,
    preview: buildImportPreview(candidate as HomeVaultExportPackage),
    summary: `${roomCount} areas, ${assetCount} assets, ${documentCount} documents, ${taskCount} tasks`,
  };
}

export function formatHomeVaultImportPreview(preview: HomeVaultImportPreview): string {
  return [
    preview.propertyLabel,
    `${preview.recordCounts.rooms} areas`,
    `${preview.recordCounts.assets} assets`,
    `${preview.recordCounts.documents} documents`,
    `${preview.attachmentCount} attachments`,
    `${preview.reviewItemCount} review items`,
  ].join(' · ');
}

export function createHomeVaultExportFileName(manifest: HomeVaultExportManifest): string {
  const propertySlug = slugify(manifest.property.label || manifest.property.id);
  const generatedDate = manifest.generatedAt.slice(0, 10);

  return `homevault-${propertySlug}-${generatedDate}.json`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateArrayCount(
  recordsValue: unknown,
  countsValue: unknown,
  key: string,
  errors: string[],
) {
  if (!Array.isArray(recordsValue)) {
    errors.push(`Records.${key} must be an array.`);
    return 0;
  }

  if (!isRecord(countsValue) || countsValue[key] !== recordsValue.length) {
    errors.push(`Record count mismatch for ${key}.`);
  }

  return recordsValue.length;
}

function buildImportPreview(exportPackage: HomeVaultExportPackage): HomeVaultImportPreview {
  return {
    attachmentCount: exportPackage.attachments.length,
    generatedAt: exportPackage.manifest.generatedAt,
    propertyLabel: exportPackage.manifest.property.label,
    recordCounts: { ...exportPackage.manifest.recordCounts },
    reviewItemCount: exportPackage.manifest.checklist.filter((item) => item.state === 'review')
      .length,
  };
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
  attachedDocumentCount,
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
  attachedDocumentCount: number;
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
      action:
        roomCount > 0
          ? 'Review room list for missing outdoor areas or systems'
          : 'Add rooms, exterior zones, or home systems from Household',
    },
    {
      id: 'assets',
      label: 'Asset inventory',
      state: assetCount > 0 ? 'ready' : 'review',
      detail:
        assetCount > 0
          ? `${assetCount} asset${assetCount === 1 ? '' : 's'} included`
          : 'Add appliances, systems, fixtures, or exterior items',
      action:
        assetCount > 0
          ? 'Check that major appliances and systems are represented'
          : 'Add appliances, systems, fixtures, or exterior items from Inventory',
    },
    {
      id: 'documents',
      label: 'Linked documents',
      state: documentCount > 0 && linkedDocumentCount === documentCount ? 'ready' : 'review',
      detail:
        documentCount > 0
          ? `${linkedDocumentCount} of ${documentCount} document${documentCount === 1 ? '' : 's'} linked`
          : 'Add receipts, manuals, warranties, invoices, or reports',
      action:
        documentCount > 0 && linkedDocumentCount === documentCount
          ? 'Review document links for accuracy'
          : 'Link each document to an asset, room, or property record',
    },
    {
      id: 'attachments',
      label: 'File attachments',
      state:
        documentCount === 0 || attachedDocumentCount === documentCount ? 'ready' : 'review',
      detail:
        documentCount > 0
          ? `${attachedDocumentCount} of ${documentCount} document${documentCount === 1 ? '' : 's'} ${
              documentCount === 1 ? 'includes' : 'include'
            } file references`
          : 'No documents require file references yet',
      action:
        documentCount === 0 || attachedDocumentCount === documentCount
          ? 'Confirm file references still point to the right documents'
          : 'Open document records and attach the missing source files',
    },
    {
      id: 'history',
      label: 'Service history',
      state: taskCompletionCount > 0 || repairEventCount > 0 ? 'ready' : 'review',
      detail:
        taskCompletionCount > 0 || repairEventCount > 0
          ? `${taskCompletionCount} completion${taskCompletionCount === 1 ? '' : 's'} and ${repairEventsWithCostCount} costed repair${repairEventsWithCostCount === 1 ? '' : 's'}`
          : 'Complete a task or record a repair to build history',
      action:
        taskCompletionCount > 0 || repairEventCount > 0
          ? 'Review service history for missing costs or providers'
          : 'Complete a maintenance task or add a repair event',
    },
    {
      id: 'tasks',
      label: 'Open maintenance',
      state: activeTaskCount === 0 ? 'ready' : 'review',
      detail:
        activeTaskCount === 0
          ? 'No open tasks need attention'
          : `${activeTaskCount} open task${activeTaskCount === 1 ? '' : 's'} to review`,
      action:
        activeTaskCount === 0
          ? 'Export is clear of open maintenance tasks'
          : 'Complete, snooze, or update open maintenance tasks',
    },
    {
      id: 'assetDocumentation',
      label: 'Asset documentation',
      state: assetCount > 0 && documentedAssetCount === assetCount ? 'ready' : 'review',
      detail:
        assetCount > 0
          ? `${documentedAssetCount} of ${assetCount} asset${assetCount === 1 ? '' : 's'} ${
              assetCount === 1 ? 'has' : 'have'
            } documents`
          : 'Add assets before tracking documentation coverage',
      action:
        assetCount > 0 && documentedAssetCount === assetCount
          ? 'Confirm each asset has its most useful document attached'
          : 'Link receipts, manuals, warranties, or invoices to undocumented assets',
    },
  ] satisfies HomeVaultExportChecklistItem[];
}

function buildExportAttachments(documents: DocumentRecord[]): HomeVaultExportAttachment[] {
  return documents
    .filter((document) => getDocumentAttachmentUri(document))
    .map((document) => ({
      attachedAt: document.attachment?.attachedAt,
      documentId: document.id,
      fileName: document.attachment?.fileName,
      filePath: getDocumentAttachmentUri(document) as string,
      title: document.title,
      linkedRecordIds: [...document.linkedRecordIds],
      mimeType: document.attachment?.mimeType,
      sizeBytes: document.attachment?.sizeBytes,
      storageKind: document.attachment?.storageKind,
      type: document.type,
    }));
}

function getDocumentAttachmentUri(document: DocumentRecord) {
  return document.attachment?.storedUri ?? document.filePath;
}
