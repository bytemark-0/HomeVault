import assert from 'node:assert/strict';

import { createMemoryHomeVaultRepository, type HomeVaultSnapshot } from '../packages/database/src';

const baseProperty = {
  id: 'prop-1',
  householdId: 'hh-1',
  label: 'Test home',
  type: 'single_family' as const,
};

const baseRoom = {
  id: 'room-1',
  propertyId: 'prop-1',
  name: 'Kitchen',
  type: 'room' as const,
};

const baseAsset = {
  id: 'asset-1',
  propertyId: 'prop-1',
  roomId: 'room-1',
  name: 'Dishwasher',
  category: 'Appliance',
  status: 'ready' as const,
};

const baseTask = {
  id: 'task-1',
  propertyId: 'prop-1',
  scope: 'asset' as const,
  scopeId: 'asset-1',
  title: 'Replace filter',
  dueDate: '2026-07-01',
  recurrenceKind: 'one_time' as const,
  recurrenceLabel: 'One time',
  state: 'upcoming' as const,
};

const baseRepairEvent = {
  id: 'repair-1',
  propertyId: 'prop-1',
  assetId: 'asset-1',
  issue: 'Leak under door',
  date: '2026-06-01',
  documentIds: [] as string[],
};

const baseDocument = {
  id: 'doc-1',
  propertyId: 'prop-1',
  title: 'Dishwasher manual',
  type: 'manual' as const,
  linkedRecordIds: ['asset-1'],
};

const baseAccessItem = {
  id: 'access-1',
  propertyId: 'prop-1',
  category: 'wifi' as const,
  label: 'Main Wi-Fi',
  accessCode: '9274',
  linkedDocumentIds: ['doc-1'],
};

const baseEmergencyContact = {
  id: 'contact-1',
  propertyId: 'prop-1',
  name: 'Jamie Lee',
  role: 'Neighbor',
  priority: 'primary' as const,
  phone: '555-0101',
};

const baseImportantAccount = {
  id: 'account-1',
  propertyId: 'prop-1',
  kind: 'insurance' as const,
  providerName: 'Prairie Mutual',
  label: 'Home policy',
  accountNumber: 'POL-1234',
  linkedDocumentIds: ['doc-1'],
};

const basePlaybook = {
  id: 'playbook-1',
  propertyId: 'prop-1',
  category: 'emergency' as const,
  title: 'Water leak',
  state: 'ready' as const,
  steps: [
    {
      id: 'step-1',
      label: 'Shut off the main valve',
      isRequired: true,
      isComplete: false,
    },
  ],
  linkedRecordIds: ['doc-1'],
};

function makeSnapshot(overrides?: Partial<HomeVaultSnapshot>): HomeVaultSnapshot {
  return {
    properties: [baseProperty],
    rooms: [baseRoom],
    assets: [baseAsset],
    documents: [baseDocument],
    accessItems: [baseAccessItem],
    emergencyContacts: [baseEmergencyContact],
    importantAccounts: [baseImportantAccount],
    continuityPlaybooks: [basePlaybook],
    tasks: [baseTask],
    taskCompletions: [],
    repairEvents: [baseRepairEvent],
    parts: [],
    ...overrides,
  };
}

async function main() {
  await test('creates and reads back an asset', async () => {
    const repo = createMemoryHomeVaultRepository(makeSnapshot({ assets: [] }));

    const created = await repo.createAsset({
      propertyId: 'prop-1',
      roomId: 'room-1',
      name: 'New appliance',
      category: 'Appliance',
      status: 'ready',
    });

    const assets = await repo.getAssets('prop-1');

    assert.equal(assets.length, 1);
    assert.equal(assets[0]?.id, created.id);
    assert.equal(assets[0]?.name, 'New appliance');
  });

  await test('updates an asset', async () => {
    const repo = createMemoryHomeVaultRepository(makeSnapshot());

    await repo.updateAsset({ ...baseAsset, name: 'Renamed appliance' });

    const assets = await repo.getAssets('prop-1');

    assert.equal(assets.length, 1);
    assert.equal(assets[0]?.name, 'Renamed appliance');
  });

  await test('creates and reads back a room', async () => {
    const repo = createMemoryHomeVaultRepository(makeSnapshot({ rooms: [] }));

    const created = await repo.createRoom({
      propertyId: 'prop-1',
      name: 'Garage',
      type: 'area',
    });

    const rooms = await repo.getRooms('prop-1');

    assert.equal(rooms.length, 1);
    assert.equal(rooms[0]?.id, created.id);
    assert.equal(rooms[0]?.name, 'Garage');
  });

  await test('creates and deletes a document', async () => {
    const repo = createMemoryHomeVaultRepository(makeSnapshot({ documents: [] }));

    const created = await repo.createDocument({
      propertyId: 'prop-1',
      title: 'Receipt',
      type: 'receipt',
      linkedRecordIds: ['asset-1'],
    });

    const after = await repo.getDocuments('prop-1');
    assert.equal(after.length, 1);
    assert.equal(after[0]?.id, created.id);

    await repo.deleteDocument(created.id);

    const afterDelete = await repo.getDocuments('prop-1');
    assert.equal(afterDelete.length, 0);
  });

  await test('deleting a non-existent document throws', async () => {
    const repo = createMemoryHomeVaultRepository(makeSnapshot());

    await assert.rejects(
      () => repo.deleteDocument('doc-does-not-exist'),
      /not found/i,
    );
  });

  await test('creates and reads back continuity records', async () => {
    const repo = createMemoryHomeVaultRepository(
      makeSnapshot({
        accessItems: [],
        emergencyContacts: [],
        importantAccounts: [],
        continuityPlaybooks: [],
      }),
    );

    const accessItem = await repo.createAccessItem({
      propertyId: 'prop-1',
      category: 'garage',
      label: 'Garage keypad',
      accessCode: '1942',
      linkedDocumentIds: [],
      lastReviewedAt: '2026-07-01',
    });
    const contact = await repo.createEmergencyContact({
      propertyId: 'prop-1',
      name: 'River City Plumbing',
      role: 'Emergency plumber',
      priority: 'service_provider',
      phone: '555-0140',
      lastReviewedAt: '2026-06-15',
    });
    const account = await repo.createImportantAccount({
      propertyId: 'prop-1',
      kind: 'platform',
      providerName: 'Apple ID',
      label: 'Family Apple account',
      email: 'family-apple@example.test',
      managerRole: 'shared_household',
      isSharedHouseholdAccount: true,
      recoveryNotes: 'Claim photos are in the shared drive.',
      linkedDocumentIds: [],
      lastReviewedAt: '2026-06-20',
    });
    const playbook = await repo.createContinuityPlaybook({
      propertyId: 'prop-1',
      category: 'storm',
      title: 'Storm restart',
      state: 'in_progress',
      steps: [{ id: 'step-storm', label: 'Check the breaker panel', isRequired: true, isComplete: false }],
      linkedRecordIds: [],
    });

    assert.equal((await repo.getAccessItems('prop-1'))[0]?.id, accessItem.id);
    assert.equal((await repo.getAccessItems('prop-1'))[0]?.lastReviewedAt, '2026-07-01');
    assert.equal((await repo.getEmergencyContacts('prop-1'))[0]?.id, contact.id);
    assert.equal((await repo.getEmergencyContacts('prop-1'))[0]?.lastReviewedAt, '2026-06-15');
    assert.equal((await repo.getImportantAccounts('prop-1'))[0]?.id, account.id);
    assert.equal((await repo.getImportantAccounts('prop-1'))[0]?.lastReviewedAt, '2026-06-20');
    assert.equal((await repo.getImportantAccounts('prop-1'))[0]?.managerRole, 'shared_household');
    assert.equal((await repo.getImportantAccounts('prop-1'))[0]?.isSharedHouseholdAccount, true);
    assert.equal((await repo.getContinuityPlaybooks('prop-1'))[0]?.id, playbook.id);
  });

  await test('creates a task and completes it', async () => {
    const repo = createMemoryHomeVaultRepository(makeSnapshot());

    const completion = await repo.completeTask({
      taskId: 'task-1',
      completedAt: '2026-06-14T10:00:00Z',
    });

    assert.equal(completion.taskId, 'task-1');

    const completions = await repo.getTaskCompletions('prop-1');
    assert.equal(completions.length, 1);
    assert.equal(completions[0]?.id, completion.id);

    const tasks = await repo.getTasks('prop-1');
    const task = tasks.find((t) => t.id === 'task-1');
    assert.equal(task?.state, 'completed');
  });

  await test('completing a non-existent task throws', async () => {
    const repo = createMemoryHomeVaultRepository(makeSnapshot());

    await assert.rejects(
      () => repo.completeTask({ taskId: 'task-does-not-exist', completedAt: '2026-06-14' }),
      /not found/i,
    );
  });

  await test('creates and deletes a repair event', async () => {
    const repo = createMemoryHomeVaultRepository(makeSnapshot({ repairEvents: [] }));

    const created = await repo.createRepairEvent({
      propertyId: 'prop-1',
      assetId: 'asset-1',
      issue: 'Cracked seal',
      date: '2026-06-15',
      documentIds: [],
    });

    const events = await repo.getRepairEvents('prop-1');
    assert.equal(events.length, 1);
    assert.equal(events[0]?.id, created.id);

    await repo.deleteRepairEvent(created.id);

    const afterDelete = await repo.getRepairEvents('prop-1');
    assert.equal(afterDelete.length, 0);
  });

  await test('deleting a non-existent repair event throws', async () => {
    const repo = createMemoryHomeVaultRepository(makeSnapshot());

    await assert.rejects(
      () => repo.deleteRepairEvent('repair-does-not-exist'),
      /not found/i,
    );
  });

  await test('creates and deletes a task', async () => {
    const repo = createMemoryHomeVaultRepository(makeSnapshot());

    const tasks = await repo.getTasks('prop-1');
    assert.equal(tasks.length, 1);

    await repo.deleteTask('task-1');

    const afterDelete = await repo.getTasks('prop-1');
    assert.equal(afterDelete.length, 0);
  });

  await test('restoreSnapshot replaces parts', async () => {
    const partSnapshot = makeSnapshot({
      parts: [{ id: 'part-1', propertyId: 'prop-1', assetId: 'asset-1', name: 'Filter' }],
    });
    const repo = createMemoryHomeVaultRepository(partSnapshot);

    const replacement: HomeVaultSnapshot = makeSnapshot({
      parts: [
        { id: 'part-2', propertyId: 'prop-1', assetId: 'asset-1', name: 'Belt' },
        { id: 'part-3', propertyId: 'prop-1', assetId: 'asset-1', name: 'Gasket' },
      ],
    });

    await repo.restoreSnapshot!(replacement);

    const parts = await repo.getParts('prop-1');
    assert.equal(parts.length, 2);
    assert.equal(parts[0]?.name, 'Belt');
  });

  await test('deleting an asset cascades to its parts', async () => {
    const partSnapshot = makeSnapshot({
      parts: [
        { id: 'part-1', propertyId: 'prop-1', assetId: 'asset-1', name: 'Filter' },
        { id: 'part-2', propertyId: 'prop-1', name: 'Generic supply' },
      ],
    });
    const repo = createMemoryHomeVaultRepository(partSnapshot);

    await repo.deleteAsset('asset-1');

    const parts = await repo.getParts('prop-1');
    assert.equal(parts.length, 1, 'asset-linked part removed; unlinked part survives');
    assert.equal(parts[0]?.id, 'part-2');
  });

  await test('deleting a room cascades to asset parts', async () => {
    const partSnapshot = makeSnapshot({
      parts: [{ id: 'part-1', propertyId: 'prop-1', assetId: 'asset-1', name: 'Filter' }],
    });
    const repo = createMemoryHomeVaultRepository(partSnapshot);

    await repo.deleteRoom('room-1');

    const parts = await repo.getParts('prop-1');
    assert.equal(parts.length, 0, 'room → asset → part cascade removes the part');
  });

  await test('restoreSnapshot replaces all records', async () => {
    const repo = createMemoryHomeVaultRepository(makeSnapshot());

    const replacement: HomeVaultSnapshot = {
      properties: [{ ...baseProperty, label: 'Replaced home' }],
      rooms: [],
      assets: [],
      documents: [],
      accessItems: [],
      emergencyContacts: [],
      importantAccounts: [],
      continuityPlaybooks: [],
      tasks: [],
      taskCompletions: [],
      repairEvents: [],
      parts: [],
    };

    await repo.restoreSnapshot!(replacement);

    const assets = await repo.getAssets('prop-1');
    assert.equal(assets.length, 0);

    const rooms = await repo.getRooms('prop-1');
    assert.equal(rooms.length, 0);
  });

  await test('restoreSnapshot is isolated — mutations do not bleed into snapshot', async () => {
    const original: HomeVaultSnapshot = makeSnapshot();
    const repo = createMemoryHomeVaultRepository(original);

    await repo.restoreSnapshot!(makeSnapshot());

    await repo.createAsset({
      propertyId: 'prop-1',
      name: 'Extra asset',
      category: 'Appliance',
      status: 'ready',
    });

    const assets = await repo.getAssets('prop-1');
    assert.equal(assets.length, 2);

    const originalCount = original.assets.length;
    assert.equal(originalCount, 1);
  });

  await test('dashboard reflects current asset and task counts', async () => {
    const overdueTask = { ...baseTask, id: 'task-overdue', state: 'overdue' as const };
    const repo = createMemoryHomeVaultRepository(makeSnapshot({ tasks: [baseTask, overdueTask] }));

    const dashboard = await repo.getDashboard('prop-1');

    assert.equal(dashboard.assetCount, 1);
    assert.equal(dashboard.roomCount, 1);
    assert.equal(dashboard.documentCount, 1);
    assert.equal(dashboard.activeTaskCount, 1);
    assert.equal(dashboard.dueTasks.length, 1);
    assert.equal(dashboard.dueTasks[0]?.id, 'task-overdue');
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function test(name: string, run: () => Promise<void>) {
  try {
    await run();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}
