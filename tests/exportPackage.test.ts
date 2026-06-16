import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createMemoryHomeVaultRepository } from '../packages/database/src';
import {
  buildHomeVaultExportManifest,
  formatHomeVaultExportPackage,
  parseHomeVaultExportPackage,
  validateHomeVaultExportPackage,
} from '../packages/export/src';
import { sampleBackupPackage } from '../apps/mobile/src/data/sampleBackupPackage';
import {
  backupSnapshot,
  buildPackage,
  currentSnapshot,
  sampleBackupGeneratedAt,
} from './support/exportFixtures';

test('round-trips a full HomeVault export package', () => {
  const exportPackage = buildPackage(backupSnapshot, sampleBackupGeneratedAt);
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
  const exportPackage = buildPackage(backupSnapshot, sampleBackupGeneratedAt);
  exportPackage.manifest.recordCounts.assets = 2;

  const result = parseHomeVaultExportPackage(formatHomeVaultExportPackage(exportPackage));

  assert.equal(result.ok, false);

  if (result.ok) {
    throw new Error('Expected package validation to fail.');
  }

  assert.equal(result.errorKind, 'malformed');
  assert.deepEqual(result.errors, ['Record count mismatch for assets.']);
});

test('rejects non-JSON input with not_json errorKind', () => {
  const result = parseHomeVaultExportPackage('not valid json {{');

  assert.equal(result.ok, false);

  if (result.ok) {
    throw new Error('Expected package validation to fail.');
  }

  assert.equal(result.errorKind, 'not_json');
});

test('rejects non-HomeVault JSON with not_homevault errorKind', () => {
  const result = parseHomeVaultExportPackage(JSON.stringify({ some: 'other json' }));

  assert.equal(result.ok, false);

  if (result.ok) {
    throw new Error('Expected package validation to fail.');
  }

  assert.equal(result.errorKind, 'not_homevault');
});

test('rejects unsupported version with version_unsupported errorKind', () => {
  const exportPackage = buildPackage(backupSnapshot, sampleBackupGeneratedAt);
  const futurePackage = { ...exportPackage, manifest: { ...exportPackage.manifest, version: 99 } };

  const result = validateHomeVaultExportPackage(futurePackage);

  assert.equal(result.ok, false);

  if (result.ok) {
    throw new Error('Expected package validation to fail.');
  }

  assert.equal(result.errorKind, 'version_unsupported');
  assert.ok(result.errors[0]?.includes('version 99'));
});

test('export checklist marks rooms as review when there are no rooms', () => {
  const snapshot = { ...backupSnapshot, rooms: [] };
  const [property] = snapshot.properties;

  if (!property) {
    throw new Error('Test snapshot must include a property.');
  }

  const manifest = buildHomeVaultExportManifest({
    property,
    assets: snapshot.assets,
    documents: snapshot.documents,
    repairEvents: snapshot.repairEvents,
    rooms: [],
    taskCompletions: snapshot.taskCompletions,
    tasks: snapshot.tasks,
  });

  const roomItem = manifest.checklist.find((item) => item.id === 'rooms');

  assert.equal(roomItem?.state, 'review');
});

test('export checklist marks linked documents as review when some are unlinked', () => {
  const [property] = backupSnapshot.properties;

  if (!property) {
    throw new Error('Test snapshot must include a property.');
  }

  const unlinkedDocument = { ...backupSnapshot.documents[0]!, linkedRecordIds: [] };
  const manifest = buildHomeVaultExportManifest({
    property,
    assets: backupSnapshot.assets,
    documents: [unlinkedDocument],
    repairEvents: backupSnapshot.repairEvents,
    rooms: backupSnapshot.rooms,
    taskCompletions: backupSnapshot.taskCompletions,
    tasks: backupSnapshot.tasks,
  });

  const docsItem = manifest.checklist.find((item) => item.id === 'documents');

  assert.equal(docsItem?.state, 'review');
});

test('export checklist marks all items ready when coverage is complete', () => {
  const pkg = buildPackage(backupSnapshot, sampleBackupGeneratedAt);
  const reviewItems = pkg.manifest.checklist.filter((item) => item.state === 'review');

  assert.equal(reviewItems.length, 0);
});

test('restores a validated package into the local repository snapshot', async () => {
  const repository = createMemoryHomeVaultRepository(currentSnapshot);
  const result = parseHomeVaultExportPackage(
    formatHomeVaultExportPackage(buildPackage(backupSnapshot, sampleBackupGeneratedAt)),
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
    parts: [],
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

test('keeps the sample backup fixture valid for manual restore testing', () => {
  const fixturePath = resolve(process.cwd(), 'docs/homevault-sample-backup.json');
  const result = parseHomeVaultExportPackage(readFileSync(fixturePath, 'utf8'));

  assert.equal(result.ok, true);
  assert.equal(result.preview.generatedAt, sampleBackupGeneratedAt);
  assert.equal(result.preview.propertyLabel, 'Backup home');
});

test('keeps the bundled app sample backup aligned with the fixture data', () => {
  const expectedPackage = buildPackage(backupSnapshot, sampleBackupGeneratedAt);

  assert.deepEqual(
    sampleBackupPackage,
    JSON.parse(formatHomeVaultExportPackage(expectedPackage)),
  );
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
