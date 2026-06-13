import assert from 'node:assert/strict';

import { createMemoryHomeVaultRepository, type HomeVaultSnapshot } from '../packages/database/src';
import {
  buildHomeVaultExportPackage,
  formatHomeVaultExportPackage,
  parseHomeVaultExportPackage,
} from '../packages/export/src';

const currentSnapshot = createSnapshot('current', 'Current home');
const backupSnapshot = createSnapshot('backup', 'Backup home');

test('round-trips a full HomeVault export package', () => {
  const exportPackage = buildPackage(backupSnapshot, '2026-06-13T12:00:00.000Z');
  const result = parseHomeVaultExportPackage(formatHomeVaultExportPackage(exportPackage));

  assert.equal(result.ok, true);

  assert.equal(result.preview.propertyLabel, 'Backup home');
  assert.deepEqual(result.preview.recordCounts, {
    assets: 1,
    documents: 1,
    repairEvents: 1,
    rooms: 1,
    taskCompletions: 1,
    tasks: 1,
  });
  assert.equal(result.preview.attachmentCount, 1);
  assert.equal(result.package.attachments[0]?.filePath, '/receipts/backup.pdf');
  assert.equal(result.summary, '1 areas, 1 assets, 1 documents, 1 tasks');
});

test('rejects packages whose manifest counts do not match records', () => {
  const exportPackage = buildPackage(backupSnapshot, '2026-06-13T12:00:00.000Z');
  exportPackage.manifest.recordCounts.assets = 2;

  const result = parseHomeVaultExportPackage(formatHomeVaultExportPackage(exportPackage));

  assert.equal(result.ok, false);

  if (result.ok) {
    throw new Error('Expected package validation to fail.');
  }

  assert.deepEqual(result.errors, ['Record count mismatch for assets.']);
});

test('restores a validated package into the local repository snapshot', async () => {
  const repository = createMemoryHomeVaultRepository(currentSnapshot);
  const result = parseHomeVaultExportPackage(
    formatHomeVaultExportPackage(buildPackage(backupSnapshot, '2026-06-13T12:00:00.000Z')),
  );

  assert.equal(result.ok, true);

  await repository.restoreSnapshot?.({
    properties: [result.package.records.property],
    rooms: result.package.records.rooms,
    assets: result.package.records.assets,
    documents: result.package.records.documents,
    tasks: result.package.records.tasks,
    taskCompletions: result.package.records.taskCompletions,
    repairEvents: result.package.records.repairEvents,
  });

  const [property] = await repository.getProperties();
  const assets = await repository.getAssets('property-backup');
  const documents = await repository.getDocuments('property-backup');
  const completions = await repository.getTaskCompletions('property-backup');

  assert.equal(property?.label, 'Backup home');
  assert.equal(assets.length, 1);
  assert.equal(documents[0]?.linkedRecordIds[0], 'asset-backup');
  assert.equal(completions[0]?.taskId, 'task-backup');
});

async function test(name: string, run: () => void | Promise<void>) {
  try {
    await run();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

function buildPackage(snapshot: HomeVaultSnapshot, generatedAt: string) {
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
  };
}
