import type { HomeVaultSnapshot } from '../../packages/database/src';
import { buildHomeVaultExportPackage } from '../../packages/export/src';

export const sampleBackupGeneratedAt = '2026-06-13T12:00:00.000Z';

export const currentSnapshot = createSnapshot('current', 'Current home');
export const backupSnapshot = createSnapshot('backup', 'Backup home');

export function buildPackage(snapshot: HomeVaultSnapshot, generatedAt = sampleBackupGeneratedAt) {
  const [property] = snapshot.properties;

  if (!property) {
    throw new Error('Test snapshot must include a property.');
  }

  return buildHomeVaultExportPackage({
    property,
    assets: snapshot.assets,
    documents: snapshot.documents,
    repairEvents: snapshot.repairEvents,
    rooms: snapshot.rooms,
    taskCompletions: snapshot.taskCompletions,
    tasks: snapshot.tasks,
    generatedAt,
  });
}

function createSnapshot(id: string, label: string): HomeVaultSnapshot {
  const propertyId = `property-${id}`;
  const assetId = `asset-${id}`;
  const roomId = `room-${id}`;
  const documentId = `document-${id}`;
  const taskId = `task-${id}`;

  return {
    properties: [
      {
        id: propertyId,
        householdId: `household-${id}`,
        label,
        type: 'single_family',
        yearBuilt: 2001,
      },
    ],
    rooms: [
      {
        id: roomId,
        propertyId,
        name: 'Kitchen',
        type: 'room',
      },
    ],
    assets: [
      {
        id: assetId,
        propertyId,
        roomId,
        name: 'Dishwasher',
        category: 'Appliance',
        brand: 'Bosch',
        status: 'ready',
      },
    ],
    documents: [
      {
        id: documentId,
        propertyId,
        title: 'Dishwasher receipt',
        type: 'receipt',
        filePath: `/receipts/${id}.pdf`,
        linkedRecordIds: [assetId],
      },
    ],
    tasks: [
      {
        id: taskId,
        propertyId,
        scope: 'asset',
        scopeId: assetId,
        title: 'Clean dishwasher filter',
        dueDate: '2026-06-01',
        recurrenceKind: 'interval',
        recurrenceLabel: 'Monthly',
        state: 'completed',
      },
    ],
    taskCompletions: [
      {
        id: `completion-${id}`,
        taskId,
        completedAt: '2026-06-02T13:00:00.000Z',
        costCents: 0,
      },
    ],
    repairEvents: [
      {
        id: `repair-${id}`,
        propertyId,
        assetId,
        issue: 'Leaking supply line',
        resolution: 'Replaced hose',
        costCents: 4200,
        date: '2026-05-15',
        documentIds: [documentId],
      },
    ],
    parts: [],
  };
}
