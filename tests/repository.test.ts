import assert from 'node:assert/strict';

import { createMemoryHomeVaultRepository } from '../packages/database/src';
import type { HomeVaultSnapshot } from '../packages/database/src';

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

function makeSnapshot(overrides?: Partial<HomeVaultSnapshot>): HomeVaultSnapshot {
  return {
    properties: [baseProperty],
    rooms: [baseRoom],
    assets: [baseAsset],
    documents: [baseDocument],
    tasks: [baseTask],
    taskCompletions: [],
    repairEvents: [baseRepairEvent],
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

  await test('restoreSnapshot replaces all records', async () => {
    const repo = createMemoryHomeVaultRepository(makeSnapshot());

    const replacement: HomeVaultSnapshot = {
      properties: [{ ...baseProperty, label: 'Replaced home' }],
      rooms: [],
      assets: [],
      documents: [],
      tasks: [],
      taskCompletions: [],
      repairEvents: [],
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
