import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createMemoryHomeVaultRepository, type HomeVaultSnapshot } from '../packages/database/src';
import {
  buildHomeVaultCareCard,
  buildHomeVaultCaregiverPlan,
  buildHomeVaultEmergencyPacket,
  buildHomeVaultExportManifest,
  buildHomeVaultOfflineCompanionPack,
  buildHomeVaultTrustedShareArtifact,
  formatHomeVaultCareCard,
  formatHomeVaultCaregiverPlan,
  formatHomeVaultOfflineCompanionPack,
  formatSensitiveDataWarning,
  formatHomeVaultExportPackage,
  parseHomeVaultOfflineCompanionPack,
  parseHomeVaultExportPackage,
  validateHomeVaultOfflineCompanionPack,
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
    accessItems: 3,
    assets: 1,
    continuityPlaybooks: 1,
    documents: 2,
    emergencyContacts: 1,
    importantAccounts: 1,
    repairEvents: 1,
    rooms: 1,
    taskCompletions: 1,
    tasks: 1,
    parts: 0,
  });
  assert.equal(result.preview.attachmentCount, 2);
  assert.equal(result.package.attachments[0]?.filePath, '/receipts/backup.pdf');
  assert.equal(result.summary, '1 areas, 1 assets, 2 documents, 1 tasks');
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
    accessItems: snapshot.accessItems,
    emergencyContacts: snapshot.emergencyContacts,
    importantAccounts: snapshot.importantAccounts,
    continuityPlaybooks: snapshot.continuityPlaybooks,
    parts: snapshot.parts ?? [],
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
    accessItems: backupSnapshot.accessItems,
    emergencyContacts: backupSnapshot.emergencyContacts,
    importantAccounts: backupSnapshot.importantAccounts,
    continuityPlaybooks: backupSnapshot.continuityPlaybooks,
    parts: backupSnapshot.parts ?? [],
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
    accessItems: result.package.records.accessItems,
    emergencyContacts: result.package.records.emergencyContacts,
    importantAccounts: result.package.records.importantAccounts,
    continuityPlaybooks: result.package.records.continuityPlaybooks,
    tasks: result.package.records.tasks,
    taskCompletions: result.package.records.taskCompletions,
    repairEvents: result.package.records.repairEvents,
    parts: result.package.records.parts,
  });

  const [property] = await repository.getProperties();
  const assets = await repository.getAssets('property-backup');
  const accessItems = await repository.getAccessItems('property-backup');
  const documents = await repository.getDocuments('property-backup');
  const emergencyContacts = await repository.getEmergencyContacts('property-backup');
  const importantAccounts = await repository.getImportantAccounts('property-backup');
  const continuityPlaybooks = await repository.getContinuityPlaybooks('property-backup');
  const completions = await repository.getTaskCompletions('property-backup');

  assert.equal(property?.label, 'Backup home');
  assert.equal(assets.length, 1);
  assert.equal(accessItems.length, 3);
  assert.equal(accessItems[1]?.linkedAssetId, 'asset-backup');
  assert.deepEqual(accessItems[1]?.linkedDocumentIds, ['document-shutoff-backup']);
  assert.equal(documents[0]?.linkedRecordIds[0], 'asset-backup');
  assert.equal(emergencyContacts[0]?.name, 'Jamie Lee');
  assert.equal(importantAccounts[0]?.recoveryNotes, 'Claim documents are in the fire safe.');
  assert.equal(continuityPlaybooks[0]?.title, 'Water leak response');
  assert.equal(continuityPlaybooks[0]?.steps[0]?.label, 'Shut off the main water valve');
  assert.deepEqual(continuityPlaybooks[0]?.linkedRecordIds, ['document-backup']);
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

test('parts are included in export package records and manifest counts', () => {
  const snapshotWithParts: HomeVaultSnapshot = {
    ...backupSnapshot,
    parts: [
      {
        id: 'part-1',
        propertyId: 'property-backup',
        assetId: 'asset-backup',
        name: 'Replacement filter',
        quantity: 2,
      },
    ],
  };

  const pkg = buildPackage(snapshotWithParts, sampleBackupGeneratedAt);

  assert.equal(pkg.manifest.recordCounts.parts, 1);
  assert.equal(pkg.records.parts.length, 1);
  assert.equal(pkg.records.parts[0]?.name, 'Replacement filter');
});

test('validates old backup without parts and normalizes to empty array', () => {
  const pkg = buildPackage(backupSnapshot, sampleBackupGeneratedAt);
  // Simulate an old backup by removing parts from records and manifest counts.
  const oldPkg = JSON.parse(formatHomeVaultExportPackage(pkg)) as Record<string, unknown>;
  delete (oldPkg.records as Record<string, unknown>)['accessItems'];
  delete (oldPkg.records as Record<string, unknown>)['emergencyContacts'];
  delete (oldPkg.records as Record<string, unknown>)['importantAccounts'];
  delete (oldPkg.records as Record<string, unknown>)['continuityPlaybooks'];
  delete (oldPkg.records as Record<string, unknown>)['parts'];
  delete (oldPkg.manifest as Record<string, unknown>)['recordCounts'];
  (oldPkg.manifest as Record<string, unknown>)['recordCounts'] = {
    rooms: 1, assets: 1, documents: 2, tasks: 1, taskCompletions: 1, repairEvents: 1,
  };

  const result = validateHomeVaultExportPackage(oldPkg);

  assert.equal(result.ok, true);
  if (!result.ok) throw new Error('Expected ok');
  assert.deepEqual(result.package.records.parts, []);
  assert.equal(result.package.manifest.recordCounts.parts, 0);
  assert.deepEqual(result.package.records.accessItems, []);
  assert.equal(result.package.manifest.recordCounts.accessItems, 0);
});

test('marks exports with continuity data as sensitive', () => {
  const pkg = buildPackage(backupSnapshot, sampleBackupGeneratedAt);

  assert.equal(pkg.manifest.sensitiveData.includesSensitiveData, true);
  assert.equal(
    formatSensitiveDataWarning(pkg.manifest.sensitiveData),
    'Sensitive household details included: 3 access items, 1 emergency contact, 1 important account, 1 device serial.',
  );
});

test('builds an emergency packet with masked account numbers only', () => {
  const [property] = backupSnapshot.properties;

  if (!property) {
    throw new Error('Test snapshot must include a property.');
  }

  const packet = buildHomeVaultEmergencyPacket({
    property,
    assets: backupSnapshot.assets,
    documents: backupSnapshot.documents,
    accessItems: backupSnapshot.accessItems,
    emergencyContacts: backupSnapshot.emergencyContacts,
    importantAccounts: backupSnapshot.importantAccounts,
    continuityPlaybooks: backupSnapshot.continuityPlaybooks,
    parts: backupSnapshot.parts,
    repairEvents: backupSnapshot.repairEvents,
    rooms: backupSnapshot.rooms,
    taskCompletions: backupSnapshot.taskCompletions,
    tasks: backupSnapshot.tasks,
    generatedAt: sampleBackupGeneratedAt,
  });

  assert.equal(packet.records.importantAccounts[0]?.accountNumberLast4, '••••ckup');
  assert.equal('accountNumber' in packet.records.importantAccounts[0]!, false);
  assert.equal(packet.records.importantAccounts[0]?.mfaEnabled, true);
  assert.equal(packet.records.importantAccounts[0]?.recoveryCodesStored, true);
  assert.equal(packet.records.importantAccounts[0]?.managedInPasswordManager, true);
  assert.deepEqual(
    packet.summary.includedSections.map((section) => section.key),
    ['accessInfo', 'emergencyContacts', 'insurance', 'recoveryNotes'],
  );
  assert.equal(packet.sections.insurance.items[0]?.linkedDocumentIds[0], 'document-backup');
  assert.equal(packet.records.accessItems[0]?.accessCode, '9274');
});

test('emergency packet keeps physical continuity links for access records', () => {
  const [property] = backupSnapshot.properties;

  if (!property) {
    throw new Error('Test snapshot must include a property.');
  }

  const packet = buildHomeVaultEmergencyPacket({
    property,
    assets: [
      {
        ...backupSnapshot.assets[0]!,
        name: 'Main water valve',
      },
    ],
    documents: [
      {
        ...backupSnapshot.documents[0]!,
        title: 'Water shutoff map',
      },
    ],
    accessItems: [
      {
        id: 'access-water',
        propertyId: property.id,
        category: 'utility_shutoff',
        label: 'Main water shutoff',
        location: 'Garage south wall',
        instructions: 'Turn clockwise until water stops.',
        linkedAssetId: 'asset-backup',
        linkedDocumentIds: ['document-backup'],
      },
    ],
    emergencyContacts: backupSnapshot.emergencyContacts,
    importantAccounts: backupSnapshot.importantAccounts,
    continuityPlaybooks: backupSnapshot.continuityPlaybooks,
    parts: backupSnapshot.parts,
    repairEvents: backupSnapshot.repairEvents,
    rooms: backupSnapshot.rooms,
    taskCompletions: backupSnapshot.taskCompletions,
    tasks: backupSnapshot.tasks,
    generatedAt: sampleBackupGeneratedAt,
  });

  assert.equal(packet.records.accessItems[0]?.linkedAssetLabel, 'Main water valve');
  assert.deepEqual(packet.records.accessItems[0]?.linkedDocumentIds, ['document-backup']);
  assert.equal(packet.records.documents[0]?.title, 'Water shutoff map');
});

test('emergency packet groups key devices separately from the full asset inventory', () => {
  const [property] = backupSnapshot.properties;

  if (!property) {
    throw new Error('Test snapshot must include a property.');
  }

  const packet = buildHomeVaultEmergencyPacket({
    property,
    assets: [
      {
        ...backupSnapshot.assets[0]!,
        id: 'asset-router',
        name: 'Main Wi-Fi router',
        category: 'Networking',
        networkName: 'Maple Street Wi-Fi',
        internetProvider: 'FiberFast',
      },
      {
        ...backupSnapshot.assets[0]!,
        id: 'asset-dishwasher',
        name: 'Dishwasher',
        category: 'Appliance',
      },
    ],
    documents: backupSnapshot.documents,
    accessItems: [
      {
        ...backupSnapshot.accessItems[0]!,
        linkedAssetId: 'asset-router',
      },
    ],
    emergencyContacts: backupSnapshot.emergencyContacts,
    importantAccounts: backupSnapshot.importantAccounts,
    continuityPlaybooks: backupSnapshot.continuityPlaybooks,
    parts: backupSnapshot.parts,
    repairEvents: backupSnapshot.repairEvents,
    rooms: backupSnapshot.rooms,
    taskCompletions: backupSnapshot.taskCompletions,
    tasks: backupSnapshot.tasks,
    generatedAt: sampleBackupGeneratedAt,
  });

  assert.equal(packet.sections.keyDevices.items.length, 1);
  assert.equal(packet.sections.keyDevices.items[0]?.name, 'Main Wi-Fi router');
  assert.equal(packet.sections.keyDevices.items[0]?.networkName, 'Maple Street Wi-Fi');
  assert.equal(packet.sections.keyDevices.linkedAccessItems[0]?.label, 'Main Wi-Fi');
});

test('emergency packet summary marks missing sections when no packet data exists', () => {
  const [property] = backupSnapshot.properties;

  if (!property) {
    throw new Error('Test snapshot must include a property.');
  }

  const packet = buildHomeVaultEmergencyPacket({
    property,
    assets: [],
    documents: [],
    accessItems: [],
    emergencyContacts: [],
    importantAccounts: [],
    continuityPlaybooks: [],
    parts: [],
    repairEvents: [],
    rooms: [],
    taskCompletions: [],
    tasks: [],
    generatedAt: sampleBackupGeneratedAt,
  });

  assert.equal(packet.summary.hasContent, false);
  assert.equal(packet.summary.includedSectionCount, 0);
  assert.equal(packet.summary.missingSectionCount, 5);
  assert.deepEqual(
    packet.summary.missingSections.map((section) => section.key),
    ['accessInfo', 'emergencyContacts', 'insurance', 'keyDevices', 'recoveryNotes'],
  );
});

test('trusted share includes only selected sections and supporting documents', () => {
  const [property] = backupSnapshot.properties;

  if (!property) {
    throw new Error('Test snapshot must include a property.');
  }

  const trustedShare = buildHomeVaultTrustedShareArtifact(
    {
      property,
      assets: backupSnapshot.assets,
      documents: backupSnapshot.documents,
      accessItems: backupSnapshot.accessItems,
      emergencyContacts: backupSnapshot.emergencyContacts,
      importantAccounts: backupSnapshot.importantAccounts,
      continuityPlaybooks: backupSnapshot.continuityPlaybooks,
      parts: backupSnapshot.parts ?? [],
      repairEvents: backupSnapshot.repairEvents,
      rooms: backupSnapshot.rooms,
      taskCompletions: backupSnapshot.taskCompletions,
      tasks: backupSnapshot.tasks,
      generatedAt: sampleBackupGeneratedAt,
    },
    {
      audience: 'house_sitter',
      includeSections: ['accessInfo', 'emergencyContacts'],
    },
  );

  assert.equal(trustedShare.kind, 'trusted_share');
  assert.equal(trustedShare.audience.key, 'house_sitter');
  assert.equal(trustedShare.summary.includedSectionCount, 2);
  assert.equal(trustedShare.summary.omittedSectionCount, 3);
  assert.equal(trustedShare.records.accessItems.length, 3);
  assert.equal(trustedShare.records.emergencyContacts.length, 1);
  assert.equal(trustedShare.records.importantAccounts.length, 0);
  assert.equal(trustedShare.records.continuityPlaybooks.length, 0);
  assert.equal(trustedShare.records.documents.length, 2);
  assert.equal(
    trustedShare.summary.omittedSections.find((section) => section.key === 'insurance')?.rationale,
    'Left out to avoid sharing unrelated household details.',
  );
  assert.match(trustedShare.v1Notice, /document-based handoff/);
});

test('travel handoff preset keeps the trusted-share default lighter than emergency use', () => {
  const [property] = backupSnapshot.properties;

  if (!property) {
    throw new Error('Test snapshot must include a property.');
  }

  const trustedShare = buildHomeVaultTrustedShareArtifact(
    {
      property,
      assets: backupSnapshot.assets,
      documents: backupSnapshot.documents,
      accessItems: backupSnapshot.accessItems,
      emergencyContacts: backupSnapshot.emergencyContacts,
      importantAccounts: backupSnapshot.importantAccounts,
      continuityPlaybooks: backupSnapshot.continuityPlaybooks,
      parts: backupSnapshot.parts ?? [],
      repairEvents: backupSnapshot.repairEvents,
      rooms: backupSnapshot.rooms,
      taskCompletions: backupSnapshot.taskCompletions,
      tasks: backupSnapshot.tasks,
      generatedAt: sampleBackupGeneratedAt,
    },
    {
      audience: 'travel_handoff',
    },
  );

  assert.equal(trustedShare.audience.key, 'travel_handoff');
  assert.equal(trustedShare.audience.scope, 'temporary');
  assert.deepEqual(Object.keys(trustedShare.selections).filter((key) => trustedShare.selections[key as keyof typeof trustedShare.selections]), [
    'accessInfo',
    'emergencyContacts',
    'keyDevices',
  ]);
  assert.equal(
    trustedShare.summary.omittedSections.find((section) => section.key === 'insurance')?.rationale,
    'Left out to avoid sharing unrelated household details.',
  );
});

test('trusted share can intentionally export no sections', () => {
  const [property] = backupSnapshot.properties;

  if (!property) {
    throw new Error('Test snapshot must include a property.');
  }

  const trustedShare = buildHomeVaultTrustedShareArtifact(
    {
      property,
      assets: backupSnapshot.assets,
      documents: backupSnapshot.documents,
      accessItems: backupSnapshot.accessItems,
      emergencyContacts: backupSnapshot.emergencyContacts,
      importantAccounts: backupSnapshot.importantAccounts,
      continuityPlaybooks: backupSnapshot.continuityPlaybooks,
      parts: backupSnapshot.parts ?? [],
      repairEvents: backupSnapshot.repairEvents,
      rooms: backupSnapshot.rooms,
      taskCompletions: backupSnapshot.taskCompletions,
      tasks: backupSnapshot.tasks,
      generatedAt: sampleBackupGeneratedAt,
    },
    {
      audience: 'spouse',
      includeSections: [],
    },
  );

  assert.equal(trustedShare.summary.hasContent, false);
  assert.equal(trustedShare.summary.includedSectionCount, 0);
  assert.equal(trustedShare.records.accessItems.length, 0);
  assert.equal(trustedShare.records.documents.length, 0);
});

test('offline companion pack builds a broader primary-user copy from emergency packet data', () => {
  const [property] = backupSnapshot.properties;

  if (!property) {
    throw new Error('Test snapshot must include a property.');
  }

  const pack = buildHomeVaultOfflineCompanionPack(
    {
      property,
      assets: backupSnapshot.assets,
      documents: backupSnapshot.documents,
      accessItems: backupSnapshot.accessItems,
      emergencyContacts: backupSnapshot.emergencyContacts,
      importantAccounts: backupSnapshot.importantAccounts,
      continuityPlaybooks: backupSnapshot.continuityPlaybooks,
      parts: backupSnapshot.parts ?? [],
      repairEvents: backupSnapshot.repairEvents,
      rooms: backupSnapshot.rooms,
      taskCompletions: backupSnapshot.taskCompletions,
      tasks: backupSnapshot.tasks,
      generatedAt: sampleBackupGeneratedAt,
    },
    {
      target: 'primary_user',
    },
  );

  assert.equal(pack.kind, 'offline_companion_pack');
  assert.equal(pack.target.key, 'primary_user');
  assert.equal(pack.readOnly, true);
  assert.equal(pack.unlock.mode, 'device_local_when_available');
  assert.equal(pack.summary.incidentCount, 1);
  assert.equal(pack.summary.contactCount, 1);
  assert.equal(pack.records.continuityPlaybooks[0]?.title, 'Water leak response');
  assert.equal(pack.records.accessItems.length, 3);
  assert.ok(pack.warnings.deviceLoss.includes('lost'));
  assert.ok(pack.sections.some((section) => section.key === 'accessInfo' && section.state === 'included'));
  assert.equal(JSON.parse(formatHomeVaultOfflineCompanionPack(pack)).kind, 'offline_companion_pack');
});

test('offline companion pack builds a narrower helper-device copy from trusted-share rules', () => {
  const [property] = backupSnapshot.properties;

  if (!property) {
    throw new Error('Test snapshot must include a property.');
  }

  const pack = buildHomeVaultOfflineCompanionPack(
    {
      property,
      assets: backupSnapshot.assets,
      documents: backupSnapshot.documents,
      accessItems: backupSnapshot.accessItems,
      emergencyContacts: backupSnapshot.emergencyContacts,
      importantAccounts: backupSnapshot.importantAccounts,
      continuityPlaybooks: backupSnapshot.continuityPlaybooks,
      parts: backupSnapshot.parts ?? [],
      repairEvents: backupSnapshot.repairEvents,
      rooms: backupSnapshot.rooms,
      taskCompletions: backupSnapshot.taskCompletions,
      tasks: backupSnapshot.tasks,
      generatedAt: sampleBackupGeneratedAt,
    },
    {
      target: 'helper_device',
    },
  );

  assert.equal(pack.target.key, 'helper_device');
  assert.equal(pack.derivedFrom.trustedShareAudienceKey, 'emergency_contact');
  assert.equal(pack.records.keyDevices.length, 0);
  assert.equal(pack.records.emergencyContacts.length, 1);
  assert.equal(pack.records.continuityPlaybooks.length, 1);
  assert.ok(pack.sections.some((section) => section.key === 'keyDevices' && section.state === 'omitted'));
  assert.ok(pack.unlock.detail.includes('helper device'));
  assert.ok(pack.warnings.staleness.includes('static'));
});

test('offline companion packs round-trip into a receiver preview with scope details', () => {
  const [property] = backupSnapshot.properties;

  if (!property) {
    throw new Error('Test snapshot must include a property.');
  }

  const pack = buildHomeVaultOfflineCompanionPack(
    {
      property,
      assets: backupSnapshot.assets,
      documents: backupSnapshot.documents,
      accessItems: backupSnapshot.accessItems,
      emergencyContacts: backupSnapshot.emergencyContacts,
      importantAccounts: backupSnapshot.importantAccounts,
      continuityPlaybooks: backupSnapshot.continuityPlaybooks,
      parts: backupSnapshot.parts ?? [],
      repairEvents: backupSnapshot.repairEvents,
      rooms: backupSnapshot.rooms,
      taskCompletions: backupSnapshot.taskCompletions,
      tasks: backupSnapshot.tasks,
      generatedAt: sampleBackupGeneratedAt,
    },
    {
      target: 'helper_device',
    },
  );

  const result = parseHomeVaultOfflineCompanionPack(formatHomeVaultOfflineCompanionPack(pack));

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error('Expected offline companion validation to succeed.');
  }

  assert.equal(result.preview.householdLabel, 'Backup home');
  assert.equal(result.preview.target.key, 'helper_device');
  assert.equal(result.preview.readOnly, true);
  assert.equal(result.preview.summary.recordCount, pack.summary.recordCount);
  assert.ok(result.preview.sections.some((section) => section.state === 'omitted'));
  assert.equal(result.summary.includes('Helper device'), true);
});

test('offline companion packs reject incomplete rescue metadata', () => {
  const [property] = backupSnapshot.properties;

  if (!property) {
    throw new Error('Test snapshot must include a property.');
  }

  const pack = buildHomeVaultOfflineCompanionPack(
    {
      property,
      assets: backupSnapshot.assets,
      documents: backupSnapshot.documents,
      accessItems: backupSnapshot.accessItems,
      emergencyContacts: backupSnapshot.emergencyContacts,
      importantAccounts: backupSnapshot.importantAccounts,
      continuityPlaybooks: backupSnapshot.continuityPlaybooks,
      parts: backupSnapshot.parts ?? [],
      repairEvents: backupSnapshot.repairEvents,
      rooms: backupSnapshot.rooms,
      taskCompletions: backupSnapshot.taskCompletions,
      tasks: backupSnapshot.tasks,
      generatedAt: sampleBackupGeneratedAt,
    },
    {
      target: 'primary_user',
    },
  );

  const malformed = JSON.parse(formatHomeVaultOfflineCompanionPack(pack)) as Record<string, unknown>;
  delete malformed.sections;

  const result = validateHomeVaultOfflineCompanionPack(malformed);

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error('Expected offline companion validation to fail.');
  }

  assert.equal(result.errorKind, 'malformed');
  assert.ok(result.errors.includes('Missing sections array.'));
});

test('care cards provide a child template with caregiver handoff defaults and missing-data prompts', () => {
  const [property] = backupSnapshot.properties;
  const [contact] = backupSnapshot.emergencyContacts;

  if (!property || !contact) {
    throw new Error('Test snapshot must include a property and emergency contact.');
  }

  const card = buildHomeVaultCareCard({
    property,
    template: 'child',
    subjectName: 'Avery',
    routines: [
      {
        label: 'After-school snack',
        timeLabel: '3:30 PM',
        detail: 'Offer water first, then the labeled snack bin.',
      },
    ],
    emergencyContacts: [contact],
    criticalNotes: ['Peanut allergy. Use the labeled epinephrine kit if exposure is suspected.'],
    generatedAt: sampleBackupGeneratedAt,
  });

  assert.equal(card.kind, 'care_card');
  assert.equal(card.template.key, 'child');
  assert.equal(card.shareDefaults.caregiverHandoff.mode, 'trusted_handoff');
  assert.equal(card.shareDefaults.emergencySnapshot.mode, 'emergency_packet');
  assert.equal(card.sensitivity.level, 'high');
  assert.ok(card.missingPrompts.some((prompt) => prompt.id === 'pickup_rules_missing'));
  assert.ok(formatHomeVaultCareCard(card).includes('Child care card'));
});

test('pet care cards require medication and keep the narrower helper default', () => {
  const [property] = backupSnapshot.properties;
  const [contact] = backupSnapshot.emergencyContacts;

  if (!property || !contact) {
    throw new Error('Test snapshot must include a property and emergency contact.');
  }

  const card = buildHomeVaultCareCard({
    property,
    template: 'pet',
    subjectName: 'Mochi',
    routines: [
      {
        label: 'Morning walk',
        timeLabel: '7:00 AM',
        detail: 'Use the blue harness and avoid the alley behind the house.',
      },
    ],
    emergencyContacts: [contact],
    generatedAt: sampleBackupGeneratedAt,
  });

  assert.equal(card.shareDefaults.caregiverHandoff.audienceKey, 'temporary_helper');
  assert.ok(card.missingPrompts.some((prompt) => prompt.id === 'medications_missing'));
  assert.equal(card.summary.hasHighRiskGap, true);
});

test('medical-dependent care cards include provider contact prompts and emergency snapshot defaults', () => {
  const [property] = backupSnapshot.properties;

  if (!property) {
    throw new Error('Test snapshot must include a property.');
  }

  const card = buildHomeVaultCareCard({
    property,
    template: 'medical_dependent',
    subjectName: 'Jordan',
    medications: [
      {
        label: 'Rescue inhaler',
        dose: '2 puffs',
        schedule: 'As directed during flare',
        instructions: 'Call the pediatrician if there is no improvement after 15 minutes.',
        isCritical: true,
      },
    ],
    routines: [
      {
        label: 'Bedtime monitoring',
        timeLabel: '8:30 PM',
        detail: 'Check monitor battery and keep inhaler on the bedside shelf.',
      },
    ],
    criticalNotes: ['Escalate fast if breathing changes or lips look pale.'],
    generatedAt: sampleBackupGeneratedAt,
  });

  assert.equal(card.shareDefaults.emergencySnapshot.audienceKey, 'medical_support');
  assert.ok(card.missingPrompts.some((prompt) => prompt.id === 'provider_contacts_missing'));
  assert.equal(card.sensitivity.level, 'high');
  assert.ok(formatHomeVaultCareCard(card).includes('Rescue inhaler'));
});

test('caregiver plans add audience scope, linked records, and expiry-aware rotation windows', () => {
  const [property] = backupSnapshot.properties;
  const [contact] = backupSnapshot.emergencyContacts;

  if (!property || !contact) {
    throw new Error('Test snapshot must include a property and emergency contact.');
  }

  const card = buildHomeVaultCareCard({
    property,
    template: 'child',
    subjectName: 'Avery',
    routines: [
      {
        label: 'After-school snack',
        timeLabel: '3:30 PM',
        detail: 'Offer water first, then the labeled snack bin.',
      },
    ],
    pickupRules: ['Only Jamie Lee can pick up from aftercare on Thursday.'],
    schoolDetails: ['Dismissal is at the east gate. Aftercare desk closes at 5:30 PM.'],
    providerContacts: [
      {
        label: 'Pediatrician',
        role: 'Primary care',
        phone: '555-0102',
      },
    ],
    medications: [
      {
        label: 'Rescue inhaler',
        dose: '2 puffs',
        schedule: 'As needed',
        instructions: 'Use first if wheezing starts.',
      },
    ],
    emergencyContacts: [contact],
    criticalNotes: ['Peanut allergy. Use the labeled epinephrine kit if exposure is suspected.'],
    generatedAt: '2026-07-10T00:00:00.000Z',
  });
  const plan = buildHomeVaultCaregiverPlan({
    careCard: card,
    audience: 'babysitter',
    expiresInDays: 3,
    generatedAt: '2026-07-10T00:00:00.000Z',
  });

  assert.equal(plan.kind, 'caregiver_plan');
  assert.equal(plan.audience.key, 'babysitter');
  assert.equal(plan.summary.expiresInDays, 3);
  assert.equal(plan.expiresAt, '2026-07-13T00:00:00.000Z');
  assert.equal(plan.linkedRecords.pickupContacts.length, 1);
  assert.equal(plan.linkedRecords.providerContacts.length, 1);
  assert.equal(plan.linkedRecords.medications.length, 1);
  assert.equal(plan.linkedRecords.schoolDetails.length, 1);
  assert.ok(plan.scope.allowedActions.length > 0);
  assert.ok(plan.scope.disallowedActions.length > 0);
  assert.ok(plan.reviewPrompts.length > 0);
  assert.ok(plan.travelTransitionPrompts.length > 0);
  assert.ok(formatHomeVaultCaregiverPlan(plan).includes('Not Authorized'));
});

test('child caregiver plans flag missing school details as a high-risk handoff gap', () => {
  const [property] = backupSnapshot.properties;
  const [contact] = backupSnapshot.emergencyContacts;

  if (!property || !contact) {
    throw new Error('Test snapshot must include a property and emergency contact.');
  }

  const card = buildHomeVaultCareCard({
    property,
    template: 'child',
    subjectName: 'Avery',
    routines: [
      {
        label: 'After-school snack',
        detail: 'Offer water first, then the labeled snack bin.',
      },
    ],
    pickupRules: ['Only Jamie Lee can pick up from aftercare.'],
    emergencyContacts: [contact],
    criticalNotes: ['Peanut allergy. Use the labeled epinephrine kit if exposure is suspected.'],
    generatedAt: sampleBackupGeneratedAt,
  });
  const plan = buildHomeVaultCaregiverPlan({
    careCard: card,
    audience: 'grandparent',
    generatedAt: sampleBackupGeneratedAt,
  });

  assert.ok(card.missingPrompts.some((prompt) => prompt.id === 'school_details_missing'));
  assert.ok(plan.missingPrompts.some((prompt) => prompt.id === 'school_details_missing'));
  assert.equal(plan.summary.hasHighRiskGap, true);
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
