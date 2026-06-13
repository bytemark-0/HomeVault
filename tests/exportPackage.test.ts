import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createMemoryHomeVaultRepository } from '../packages/database/src';
import {
  formatHomeVaultExportPackage,
  parseHomeVaultExportPackage,
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

  assert.deepEqual(result.errors, ['Record count mismatch for assets.']);
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
