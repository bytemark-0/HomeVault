import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { migrate } from './sqliteMigrations';
import { sampleSnapshot } from './homeVaultSampleData';

import { getTaskStateForDate } from '../utils/taskUtils';

import type {
  Asset,
  AccessItem,
  ContinuityPlaybook,
  DocumentRecord,
  EmergencyContact,
  EntityId,
  ImportantAccount,
  MaintenanceTask,
  PartSupply,
  Property,
  RepairEvent,
  RoomArea,
  TaskCompletion,
} from '@homevault/domain';
import type {
  CompleteTaskInput,
  CreateAccessItemInput,
  CreateAssetInput,
  CreateContinuityPlaybookInput,
  CreateDocumentInput,
  CreateEmergencyContactInput,
  CreateImportantAccountInput,
  CreatePartInput,
  CreatePropertyInput,
  CreateRepairEventInput,
  CreateRoomInput,
  CreateTaskInput,
  HomeVaultDashboard,
  HomeVaultRepository,
  HomeVaultSnapshot,
  UpdateAssetInput,
  UpdateAccessItemInput,
  UpdateContinuityPlaybookInput,
  UpdateDocumentInput,
  UpdateEmergencyContactInput,
  UpdateImportantAccountInput,
  UpdatePartInput,
  UpdatePropertyInput,
  UpdateRepairEventInput,
  UpdateRoomInput,
  UpdateTaskCompletionInput,
  UpdateTaskInput,
} from '@homevault/database';

type CountRow = {
  count: number;
};

type PropertyRow = {
  id: string;
  household_id: string;
  label: string;
  address_label: string | null;
  type: Property['type'];
  year_built: number | null;
  purchase_date: string | null;
  photo_uri: string | null;
};

type RoomRow = {
  id: string;
  property_id: string;
  name: string;
  type: RoomArea['type'];
  floor: string | null;
  photo_uri: string | null;
};

type AssetRow = {
  id: string;
  property_id: string;
  room_id: string | null;
  name: string;
  category: string;
  owner_name: string | null;
  backup_helper_name: string | null;
  brand: string | null;
  model: string | null;
  serial: string | null;
  install_date: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  backup_enabled: number | null;
  screen_lock_enabled: number | null;
  find_my_device_enabled: number | null;
  network_name: string | null;
  internet_provider: string | null;
  network_admin_url: string | null;
  photo_uri: string | null;
  cost_cents: number | null;
  status: Asset['status'];
  notes: string | null;
  last_reviewed_at: string | null;
};

type DocumentRow = {
  id: string;
  property_id: string;
  title: string;
  type: DocumentRecord['type'];
  file_path: string | null;
  attachment_json: string | null;
  date: string | null;
  vendor: string | null;
  amount_cents: number | null;
  ocr_text: string | null;
  linked_record_ids_json: string;
};

type AccessItemRow = {
  id: string;
  property_id: string;
  category: AccessItem['category'];
  label: string;
  username: string | null;
  access_code: string | null;
  location: string | null;
  instructions: string | null;
  notes: string | null;
  linked_asset_id: string | null;
  linked_document_ids_json: string;
  last_verified_at: string | null;
  last_reviewed_at: string | null;
};

type EmergencyContactRow = {
  id: string;
  property_id: string;
  name: string;
  role: string;
  priority: EmergencyContact['priority'];
  responsibility_category: EmergencyContact['responsibilityCategory'] | null;
  owner_role: EmergencyContact['ownerRole'] | null;
  backup_helper_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  last_reviewed_at: string | null;
};

type ImportantAccountRow = {
  id: string;
  property_id: string;
  kind: ImportantAccount['kind'];
  provider_name: string;
  label: string;
  account_number: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  manager_role: ImportantAccount['managerRole'] | null;
  backup_helper_name: string | null;
  is_shared_household_account: number | null;
  mfa_enabled: number | null;
  recovery_codes_stored: number | null;
  managed_in_password_manager: number | null;
  recovery_notes: string | null;
  notes: string | null;
  linked_document_ids_json: string;
  last_reviewed_at: string | null;
};

type ContinuityPlaybookRow = {
  id: string;
  property_id: string;
  category: ContinuityPlaybook['category'];
  title: string;
  state: ContinuityPlaybook['state'];
  notes: string | null;
  steps_json: string;
  linked_record_ids_json: string;
};

type TaskRow = {
  id: string;
  property_id: string;
  scope: MaintenanceTask['scope'];
  scope_id: string;
  title: string;
  due_date: string;
  recurrence_kind: MaintenanceTask['recurrenceKind'];
  recurrence_label: string;
  assignee_id: string | null;
  state: MaintenanceTask['state'];
  instructions: string | null;
};

type TaskCompletionRow = {
  id: string;
  task_id: string;
  completed_at: string;
  completed_by_user_id: string | null;
  cost_cents: number | null;
  notes: string | null;
  photo_uri: string | null;
  kind: string | null;
};

type RepairEventRow = {
  id: string;
  property_id: string;
  asset_id: string;
  issue: string;
  provider: string | null;
  diagnosis: string | null;
  resolution: string | null;
  cost_cents: number | null;
  date: string;
  document_ids_json: string;
};

export async function createSQLiteHomeVaultRepository(): Promise<HomeVaultRepository> {
  const db = await openDatabaseAsync('homevault.db');
  await migrate(db);

  return {
    async getProperties() {
      const rows = await db.getAllAsync<PropertyRow>(
        'SELECT * FROM properties ORDER BY label ASC',
      );

      return rows.map(toProperty);
    },
    async getRooms(propertyId) {
      const rows = await db.getAllAsync<RoomRow>(
        'SELECT * FROM rooms WHERE property_id = ? ORDER BY name ASC',
        [propertyId],
      );

      return rows.map(toRoom);
    },
    async getAssets(propertyId) {
      const rows = await db.getAllAsync<AssetRow>(
        'SELECT * FROM assets WHERE property_id = ? ORDER BY name ASC',
        [propertyId],
      );

      return rows.map(toAsset);
    },
    async getDocuments(propertyId) {
      const rows = await db.getAllAsync<DocumentRow>(
        'SELECT * FROM documents WHERE property_id = ? ORDER BY title ASC',
        [propertyId],
      );

      return rows.map(toDocument);
    },
    async getAccessItems(propertyId) {
      const rows = await db.getAllAsync<AccessItemRow>(
        'SELECT * FROM access_items WHERE property_id = ? ORDER BY category ASC, label ASC',
        [propertyId],
      );

      return rows.map(toAccessItem);
    },
    async getEmergencyContacts(propertyId) {
      const rows = await db.getAllAsync<EmergencyContactRow>(
        'SELECT * FROM emergency_contacts WHERE property_id = ? ORDER BY priority ASC, name ASC',
        [propertyId],
      );

      return rows.map(toEmergencyContact);
    },
    async getImportantAccounts(propertyId) {
      const rows = await db.getAllAsync<ImportantAccountRow>(
        'SELECT * FROM important_accounts WHERE property_id = ? ORDER BY kind ASC, provider_name ASC',
        [propertyId],
      );

      return rows.map(toImportantAccount);
    },
    async getContinuityPlaybooks(propertyId) {
      const rows = await db.getAllAsync<ContinuityPlaybookRow>(
        'SELECT * FROM continuity_playbooks WHERE property_id = ? ORDER BY category ASC, title ASC',
        [propertyId],
      );

      return rows.map(toContinuityPlaybook);
    },
    async getTasks(propertyId) {
      const rows = await db.getAllAsync<TaskRow>(
        `SELECT * FROM maintenance_tasks
         WHERE property_id = ?
         ORDER BY due_date ASC, title ASC`,
        [propertyId],
      );

      return rows.map(toTask);
    },
    async getTaskCompletions(propertyId) {
      const rows = await db.getAllAsync<TaskCompletionRow>(
        `SELECT task_completions.*
         FROM task_completions
         INNER JOIN maintenance_tasks ON maintenance_tasks.id = task_completions.task_id
         WHERE maintenance_tasks.property_id = ?
         ORDER BY task_completions.completed_at DESC`,
        [propertyId],
      );

      return rows.map(toTaskCompletion);
    },
    async getRepairEvents(propertyId) {
      const rows = await db.getAllAsync<RepairEventRow>(
        `SELECT * FROM repair_events
         WHERE property_id = ?
         ORDER BY date DESC, created_at DESC`,
        [propertyId],
      );

      return rows.map(toRepairEvent);
    },
    async getDashboard(propertyId) {
      return getDashboard(db, propertyId);
    },
    async createProperty(input) {
      return createProperty(db, input);
    },
    async updateProperty(input) {
      return updateProperty(db, input);
    },
    async createRoom(input) {
      return createRoom(db, input);
    },
    async updateRoom(input) {
      return updateRoom(db, input);
    },
    async deleteRoom(roomId) {
      return deleteRoom(db, roomId);
    },
    async createAsset(input) {
      return createAsset(db, input);
    },
    async updateAsset(input) {
      return updateAsset(db, input);
    },
    async deleteAsset(assetId) {
      return deleteAsset(db, assetId);
    },
    async createDocument(input) {
      return createDocument(db, input);
    },
    async updateDocument(input) {
      return updateDocument(db, input);
    },
    async deleteDocument(documentId) {
      return deleteDocument(db, documentId);
    },
    async createAccessItem(input) {
      return createAccessItem(db, input);
    },
    async updateAccessItem(input) {
      return updateAccessItem(db, input);
    },
    async deleteAccessItem(accessItemId) {
      return deleteAccessItem(db, accessItemId);
    },
    async createEmergencyContact(input) {
      return createEmergencyContact(db, input);
    },
    async updateEmergencyContact(input) {
      return updateEmergencyContact(db, input);
    },
    async deleteEmergencyContact(contactId) {
      return deleteEmergencyContact(db, contactId);
    },
    async createImportantAccount(input) {
      return createImportantAccount(db, input);
    },
    async updateImportantAccount(input) {
      return updateImportantAccount(db, input);
    },
    async deleteImportantAccount(accountId) {
      return deleteImportantAccount(db, accountId);
    },
    async createContinuityPlaybook(input) {
      return createContinuityPlaybook(db, input);
    },
    async updateContinuityPlaybook(input) {
      return updateContinuityPlaybook(db, input);
    },
    async deleteContinuityPlaybook(playbookId) {
      return deleteContinuityPlaybook(db, playbookId);
    },
    async createTask(input) {
      return createTask(db, input);
    },
    async updateTask(input) {
      return updateTask(db, input);
    },
    async deleteTask(taskId) {
      return deleteTask(db, taskId);
    },
    async createRepairEvent(input) {
      return createRepairEvent(db, input);
    },
    async updateRepairEvent(input) {
      return updateRepairEvent(db, input);
    },
    async deleteRepairEvent(repairEventId) {
      return deleteRepairEvent(db, repairEventId);
    },
    async completeTask(input) {
      return completeTask(db, input);
    },
    async updateTaskCompletion(input) {
      return updateTaskCompletion(db, input);
    },
    async deleteTaskCompletion(completionId) {
      return deleteTaskCompletion(db, completionId);
    },
    async getParts(propertyId) {
      return getParts(db, propertyId);
    },
    async createPart(input) {
      return createPart(db, input);
    },
    async updatePart(input) {
      return updatePart(db, input);
    },
    async deletePart(partId) {
      return deletePart(db, partId);
    },
    async resetDemoData() {
      await resetDemoData(db, sampleSnapshot);
    },
    async clearAllData() {
      await db.withTransactionAsync(async () => {
        await deleteSnapshotRows(db);
      });
    },
    async restoreSnapshot(snapshot) {
      await db.withTransactionAsync(async () => {
        await deleteSnapshotRows(db);
        await insertSnapshotRows(db, snapshot);
      });
    },
  };
}


async function insertSnapshotRows(db: SQLiteDatabase, snapshot: HomeVaultSnapshot): Promise<void> {
  for (const property of snapshot.properties) {
    await db.runAsync(
      `INSERT INTO properties (
        id, household_id, label, address_label, type, year_built, purchase_date, photo_uri
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        property.id,
        property.householdId,
        property.label,
        property.addressLabel ?? null,
        property.type,
        property.yearBuilt ?? null,
        property.purchaseDate ?? null,
        property.photoUri ?? null,
      ],
    );
  }

  for (const room of snapshot.rooms) {
    await db.runAsync(
      `INSERT INTO rooms (id, property_id, name, type, floor, photo_uri)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [room.id, room.propertyId, room.name, room.type, room.floor ?? null, room.photoUri ?? null],
    );
  }

  for (const asset of snapshot.assets) {
    await db.runAsync(
      `INSERT INTO assets (
        id, property_id, room_id, name, category, owner_name, backup_helper_name, brand, model, serial,
        install_date, purchase_date, warranty_expiry, backup_enabled, screen_lock_enabled,
        find_my_device_enabled, network_name, internet_provider, network_admin_url, photo_uri,
        cost_cents, status, notes, last_reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        asset.id,
        asset.propertyId,
        asset.roomId ?? null,
        asset.name,
        asset.category,
        asset.ownerName ?? null,
        asset.backupHelperName ?? null,
        asset.brand ?? null,
        asset.model ?? null,
        asset.serial ?? null,
        asset.installDate ?? null,
        asset.purchaseDate ?? null,
        asset.warrantyExpiry ?? null,
        toSqliteBoolean(asset.backupEnabled),
        toSqliteBoolean(asset.screenLockEnabled),
        toSqliteBoolean(asset.findMyDeviceEnabled),
        asset.networkName ?? null,
        asset.internetProvider ?? null,
        asset.networkAdminUrl ?? null,
        asset.photoUri ?? null,
        asset.costCents ?? null,
        asset.status,
        asset.notes ?? null,
        asset.lastReviewedAt ?? null,
      ],
    );
  }

  for (const document of snapshot.documents) {
    await db.runAsync(
      `INSERT INTO documents (
        id, property_id, title, type, file_path, attachment_json, date, vendor,
        amount_cents, ocr_text, linked_record_ids_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        document.id,
        document.propertyId,
        document.title,
        document.type,
        document.filePath ?? null,
        stringifyAttachment(document),
        document.date ?? null,
        document.vendor ?? null,
        document.amountCents ?? null,
        document.ocrText ?? null,
        JSON.stringify(document.linkedRecordIds),
      ],
    );
  }

  for (const accessItem of snapshot.accessItems) {
    await db.runAsync(
      `INSERT INTO access_items (
        id, property_id, category, label, username, access_code, location, instructions,
        notes, linked_asset_id, linked_document_ids_json, last_verified_at, last_reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        accessItem.id,
        accessItem.propertyId,
        accessItem.category,
        accessItem.label,
        accessItem.username ?? null,
        accessItem.accessCode ?? null,
        accessItem.location ?? null,
        accessItem.instructions ?? null,
        accessItem.notes ?? null,
        accessItem.linkedAssetId ?? null,
        JSON.stringify(accessItem.linkedDocumentIds),
        accessItem.lastVerifiedAt ?? null,
        accessItem.lastReviewedAt ?? null,
      ],
    );
  }

  for (const contact of snapshot.emergencyContacts) {
    await db.runAsync(
      `INSERT INTO emergency_contacts (
        id, property_id, name, role, priority, responsibility_category, owner_role,
        backup_helper_name, phone, email, address, notes, last_reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contact.id,
        contact.propertyId,
        contact.name,
        contact.role,
        contact.priority,
        contact.responsibilityCategory ?? null,
        contact.ownerRole ?? null,
        contact.backupHelperName ?? null,
        contact.phone ?? null,
        contact.email ?? null,
        contact.address ?? null,
        contact.notes ?? null,
        contact.lastReviewedAt ?? null,
      ],
    );
  }

  for (const account of snapshot.importantAccounts) {
    await db.runAsync(
      `INSERT INTO important_accounts (
        id, property_id, kind, provider_name, label, account_number, website, phone, email,
        manager_role, backup_helper_name, is_shared_household_account,
        mfa_enabled, recovery_codes_stored, managed_in_password_manager, recovery_notes, notes,
        linked_document_ids_json, last_reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        account.id,
        account.propertyId,
        account.kind,
        account.providerName,
        account.label,
        account.accountNumber ?? null,
        account.website ?? null,
        account.phone ?? null,
        account.email ?? null,
        account.managerRole ?? null,
        account.backupHelperName ?? null,
        toSqliteBoolean(account.isSharedHouseholdAccount),
        toSqliteBoolean(account.mfaEnabled),
        toSqliteBoolean(account.recoveryCodesStored),
        toSqliteBoolean(account.managedInPasswordManager),
        account.recoveryNotes ?? null,
        account.notes ?? null,
        JSON.stringify(account.linkedDocumentIds),
        account.lastReviewedAt ?? null,
      ],
    );
  }

  for (const playbook of snapshot.continuityPlaybooks) {
    await db.runAsync(
      `INSERT INTO continuity_playbooks (
        id, property_id, category, title, state, notes, steps_json, linked_record_ids_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        playbook.id,
        playbook.propertyId,
        playbook.category,
        playbook.title,
        playbook.state,
        playbook.notes ?? null,
        JSON.stringify(playbook.steps),
        JSON.stringify(playbook.linkedRecordIds),
      ],
    );
  }

  for (const task of snapshot.tasks) {
    await db.runAsync(
      `INSERT INTO maintenance_tasks (
        id, property_id, scope, scope_id, title, due_date, recurrence_kind,
        recurrence_label, assignee_id, state, instructions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id,
        task.propertyId,
        task.scope,
        task.scopeId,
        task.title,
        task.dueDate,
        task.recurrenceKind,
        task.recurrenceLabel,
        task.assigneeId ?? null,
        task.state,
        task.instructions ?? null,
      ],
    );
  }

  for (const repairEvent of snapshot.repairEvents) {
    await db.runAsync(
      `INSERT INTO repair_events (
        id, property_id, asset_id, issue, provider, diagnosis, resolution,
        cost_cents, date, document_ids_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        repairEvent.id,
        repairEvent.propertyId,
        repairEvent.assetId,
        repairEvent.issue,
        repairEvent.provider ?? null,
        repairEvent.diagnosis ?? null,
        repairEvent.resolution ?? null,
        repairEvent.costCents ?? null,
        repairEvent.date,
        JSON.stringify(repairEvent.documentIds),
      ],
    );
  }

  for (const completion of snapshot.taskCompletions) {
    await db.runAsync(
      `INSERT INTO task_completions (
        id, task_id, completed_at, completed_by_user_id, cost_cents, notes, photo_uri, kind
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        completion.id,
        completion.taskId,
        completion.completedAt,
        completion.completedByUserId ?? null,
        completion.costCents ?? null,
        completion.notes ?? null,
        completion.photoUri ?? null,
        completion.kind ?? null,
      ],
    );
  }

  for (const part of (snapshot.parts ?? [])) {
    await db.runAsync(
      `INSERT INTO parts (id, property_id, asset_id, maintenance_task_id, name, part_number, size, quantity, link)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        part.id,
        part.propertyId,
        part.assetId ?? null,
        part.maintenanceTaskId ?? null,
        part.name,
        part.partNumber ?? null,
        part.size ?? null,
        part.quantity ?? null,
        part.link ?? null,
      ],
    );
  }
}

async function seedIfNeeded(db: SQLiteDatabase, snapshot: HomeVaultSnapshot) {
  const row = await db.getFirstAsync<CountRow>('SELECT COUNT(*) AS count FROM properties');

  if ((row?.count ?? 0) > 0) {
    return;
  }

  await db.withTransactionAsync(async () => {
    await insertSnapshotRows(db, snapshot);
  });
}

async function seedDemoServiceHistoryIfNeeded(
  db: SQLiteDatabase,
  snapshot: HomeVaultSnapshot,
) {
  if (snapshot.taskCompletions.length === 0) {
    return;
  }

  const row = await db.getFirstAsync<CountRow>(
    'SELECT COUNT(*) AS count FROM task_completions',
  );

  if ((row?.count ?? 0) > 0) {
    return;
  }

  const completedTaskIds = new Set(
    snapshot.taskCompletions.map((completion) => completion.taskId),
  );
  const completedTasks = snapshot.tasks.filter((task) => completedTaskIds.has(task.id));

  await db.withTransactionAsync(async () => {
    for (const task of completedTasks) {
      await db.runAsync(
        `INSERT OR IGNORE INTO maintenance_tasks (
          id, property_id, scope, scope_id, title, due_date, recurrence_kind,
          recurrence_label, assignee_id, state, instructions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.id,
          task.propertyId,
          task.scope,
          task.scopeId,
          task.title,
          task.dueDate,
          task.recurrenceKind,
          task.recurrenceLabel,
          task.assigneeId ?? null,
          task.state,
          task.instructions ?? null,
        ],
      );
    }

    for (const completion of snapshot.taskCompletions) {
      await db.runAsync(
        `INSERT OR IGNORE INTO task_completions (
          id, task_id, completed_at, completed_by_user_id, cost_cents, notes, photo_uri, kind
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          completion.id,
          completion.taskId,
          completion.completedAt,
          completion.completedByUserId ?? null,
          completion.costCents ?? null,
          completion.notes ?? null,
          completion.photoUri ?? null,
          completion.kind ?? null,
        ],
      );
    }
  });
}

async function deleteSnapshotRows(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM task_completions');
  await db.runAsync('DELETE FROM repair_events');
  await db.runAsync('DELETE FROM maintenance_tasks');
  await db.runAsync('DELETE FROM continuity_playbooks');
  await db.runAsync('DELETE FROM important_accounts');
  await db.runAsync('DELETE FROM emergency_contacts');
  await db.runAsync('DELETE FROM access_items');
  await db.runAsync('DELETE FROM parts');
  await db.runAsync('DELETE FROM documents');
  await db.runAsync('DELETE FROM assets');
  await db.runAsync('DELETE FROM rooms');
  await db.runAsync('DELETE FROM properties');
}

async function resetDemoData(db: SQLiteDatabase, snapshot: HomeVaultSnapshot) {
  await db.withTransactionAsync(async () => {
    await deleteSnapshotRows(db);
  });

  await seedIfNeeded(db, snapshot);
  await seedDemoServiceHistoryIfNeeded(db, snapshot);
}

async function getDashboard(
  db: SQLiteDatabase,
  propertyId: EntityId,
): Promise<HomeVaultDashboard> {
  const propertyRow = await db.getFirstAsync<PropertyRow>(
    'SELECT * FROM properties WHERE id = ?',
    [propertyId],
  );

  if (!propertyRow) {
    throw new Error(`Property ${propertyId} was not found in SQLite.`);
  }

  const [roomCount, assetCount, documentCount, activeTaskCount, dueTaskRows, recentAssetRows] =
    await Promise.all([
      countByProperty(db, 'rooms', propertyId),
      countByProperty(db, 'assets', propertyId),
      countByProperty(db, 'documents', propertyId),
      countActiveTasks(db, propertyId),
      db.getAllAsync<TaskRow>(
        `SELECT * FROM maintenance_tasks
         WHERE property_id = ? AND state IN ('overdue', 'due_today')
         ORDER BY due_date ASC, title ASC`,
        [propertyId],
      ),
      db.getAllAsync<AssetRow>(
        `SELECT * FROM assets
         WHERE property_id = ?
         ORDER BY updated_at DESC, name ASC
         LIMIT 2`,
        [propertyId],
      ),
    ]);

  return {
    property: toProperty(propertyRow),
    assetCount,
    roomCount,
    documentCount,
    activeTaskCount,
    dueTasks: dueTaskRows.map(toTask),
    recentAssets: recentAssetRows.map(toAsset),
  };
}

async function createAsset(db: SQLiteDatabase, input: CreateAssetInput): Promise<Asset> {
  const asset: Asset = {
    ...input,
    id: input.id ?? createEntityId('asset'),
  };

  await db.runAsync(
    `INSERT INTO assets (
      id, property_id, room_id, name, category, owner_name, backup_helper_name, brand, model, serial,
      install_date, purchase_date, warranty_expiry, backup_enabled, screen_lock_enabled,
      find_my_device_enabled, network_name, internet_provider, network_admin_url, photo_uri,
      cost_cents, status, notes, last_reviewed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      asset.id,
      asset.propertyId,
      asset.roomId ?? null,
      asset.name,
      asset.category,
      asset.ownerName ?? null,
      asset.backupHelperName ?? null,
      asset.brand ?? null,
      asset.model ?? null,
      asset.serial ?? null,
      asset.installDate ?? null,
      asset.purchaseDate ?? null,
      asset.warrantyExpiry ?? null,
      toSqliteBoolean(asset.backupEnabled),
      toSqliteBoolean(asset.screenLockEnabled),
      toSqliteBoolean(asset.findMyDeviceEnabled),
      asset.networkName ?? null,
      asset.internetProvider ?? null,
      asset.networkAdminUrl ?? null,
      asset.photoUri ?? null,
      asset.costCents ?? null,
      asset.status,
      asset.notes ?? null,
      asset.lastReviewedAt ?? null,
    ],
  );

  return asset;
}

async function createProperty(
  db: SQLiteDatabase,
  input: CreatePropertyInput,
): Promise<Property> {
  const property: Property = {
    ...input,
    id: input.id ?? createEntityId('property'),
    householdId: createEntityId('household'),
  };
  await db.runAsync(
    `INSERT INTO properties (id, household_id, label, address_label, type, year_built, purchase_date, photo_uri)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      property.id,
      property.householdId,
      property.label,
      property.addressLabel ?? null,
      property.type,
      property.yearBuilt ?? null,
      property.purchaseDate ?? null,
      property.photoUri ?? null,
    ],
  );
  return property;
}

async function updateProperty(
  db: SQLiteDatabase,
  input: UpdatePropertyInput,
): Promise<Property> {
  await db.runAsync(
    `UPDATE properties
     SET household_id = ?,
         label = ?,
         address_label = ?,
         type = ?,
         year_built = ?,
         purchase_date = ?,
         photo_uri = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      input.householdId,
      input.label,
      input.addressLabel ?? null,
      input.type,
      input.yearBuilt ?? null,
      input.purchaseDate ?? null,
      input.photoUri ?? null,
      input.id,
    ],
  );

  return input;
}

async function createRoom(db: SQLiteDatabase, input: CreateRoomInput): Promise<RoomArea> {
  const room: RoomArea = {
    ...input,
    id: input.id ?? createEntityId('room'),
  };

  await db.runAsync(
    `INSERT INTO rooms (id, property_id, name, type, floor, photo_uri)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [room.id, room.propertyId, room.name, room.type, room.floor ?? null, room.photoUri ?? null],
  );

  return room;
}

async function updateRoom(db: SQLiteDatabase, input: UpdateRoomInput): Promise<RoomArea> {
  await db.runAsync(
    `UPDATE rooms
     SET name = ?,
         type = ?,
         floor = ?,
         photo_uri = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND property_id = ?`,
    [input.name, input.type, input.floor ?? null, input.photoUri ?? null, input.id, input.propertyId],
  );

  return input;
}

async function deleteRoom(db: SQLiteDatabase, roomId: EntityId): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `DELETE FROM task_completions
       WHERE task_id IN (
         SELECT id FROM maintenance_tasks
         WHERE (scope = 'asset' AND scope_id IN (SELECT id FROM assets WHERE room_id = ?))
            OR (scope = 'room' AND scope_id = ?)
       )`,
      [roomId, roomId],
    );
    await db.runAsync(
      `DELETE FROM maintenance_tasks
       WHERE (scope = 'asset' AND scope_id IN (SELECT id FROM assets WHERE room_id = ?))
          OR (scope = 'room' AND scope_id = ?)`,
      [roomId, roomId],
    );
    await db.runAsync('DELETE FROM assets WHERE room_id = ?', [roomId]);
    await db.runAsync('DELETE FROM rooms WHERE id = ?', [roomId]);
  });
}

async function updateAsset(db: SQLiteDatabase, input: UpdateAssetInput): Promise<Asset> {
  await db.runAsync(
    `UPDATE assets
     SET room_id = ?,
         name = ?,
         category = ?,
         owner_name = ?,
         backup_helper_name = ?,
         brand = ?,
         model = ?,
         serial = ?,
         install_date = ?,
         purchase_date = ?,
         warranty_expiry = ?,
         backup_enabled = ?,
         screen_lock_enabled = ?,
         find_my_device_enabled = ?,
         network_name = ?,
         internet_provider = ?,
         network_admin_url = ?,
         photo_uri = ?,
         cost_cents = ?,
         status = ?,
         notes = ?,
         last_reviewed_at = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND property_id = ?`,
    [
      input.roomId ?? null,
      input.name,
      input.category,
      input.ownerName ?? null,
      input.backupHelperName ?? null,
      input.brand ?? null,
      input.model ?? null,
      input.serial ?? null,
      input.installDate ?? null,
      input.purchaseDate ?? null,
      input.warrantyExpiry ?? null,
      toSqliteBoolean(input.backupEnabled),
      toSqliteBoolean(input.screenLockEnabled),
      toSqliteBoolean(input.findMyDeviceEnabled),
      input.networkName ?? null,
      input.internetProvider ?? null,
      input.networkAdminUrl ?? null,
      input.photoUri ?? null,
      input.costCents ?? null,
      input.status,
      input.notes ?? null,
      input.lastReviewedAt ?? null,
      input.id,
      input.propertyId,
    ],
  );

  return input;
}

async function deleteAsset(db: SQLiteDatabase, assetId: EntityId): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `DELETE FROM task_completions
       WHERE task_id IN (
         SELECT id FROM maintenance_tasks WHERE scope = 'asset' AND scope_id = ?
       )`,
      [assetId],
    );
    await db.runAsync(
      `DELETE FROM maintenance_tasks WHERE scope = 'asset' AND scope_id = ?`,
      [assetId],
    );
    await db.runAsync('DELETE FROM assets WHERE id = ?', [assetId]);
  });
}

async function createDocument(
  db: SQLiteDatabase,
  input: CreateDocumentInput,
): Promise<DocumentRecord> {
  const document: DocumentRecord = {
    ...input,
    id: input.id ?? createEntityId('document'),
    linkedRecordIds: [...input.linkedRecordIds],
  };

  await db.runAsync(
    `INSERT INTO documents (
      id, property_id, title, type, file_path, attachment_json, date, vendor,
      amount_cents, ocr_text, linked_record_ids_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      document.id,
      document.propertyId,
      document.title,
      document.type,
      document.filePath ?? null,
      stringifyAttachment(document),
      document.date ?? null,
      document.vendor ?? null,
      document.amountCents ?? null,
      document.ocrText ?? null,
      JSON.stringify(document.linkedRecordIds),
    ],
  );

  return document;
}

async function updateDocument(
  db: SQLiteDatabase,
  input: UpdateDocumentInput,
): Promise<DocumentRecord> {
  await db.runAsync(
    `UPDATE documents
     SET title = ?,
         type = ?,
         file_path = ?,
         attachment_json = ?,
         date = ?,
         vendor = ?,
         amount_cents = ?,
         ocr_text = ?,
         linked_record_ids_json = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND property_id = ?`,
    [
      input.title,
      input.type,
      input.filePath ?? null,
      stringifyAttachment(input),
      input.date ?? null,
      input.vendor ?? null,
      input.amountCents ?? null,
      input.ocrText ?? null,
      JSON.stringify(input.linkedRecordIds),
      input.id,
      input.propertyId,
    ],
  );

  return { ...input, linkedRecordIds: [...input.linkedRecordIds] };
}

async function deleteDocument(db: SQLiteDatabase, documentId: EntityId): Promise<void> {
  await db.runAsync('DELETE FROM documents WHERE id = ?', [documentId]);
}

async function createAccessItem(
  db: SQLiteDatabase,
  input: CreateAccessItemInput,
): Promise<AccessItem> {
  const accessItem: AccessItem = {
    ...input,
    id: input.id ?? createEntityId('access'),
    linkedDocumentIds: [...input.linkedDocumentIds],
  };

  await db.runAsync(
    `INSERT INTO access_items (
      id, property_id, category, label, username, access_code, location, instructions,
      notes, linked_asset_id, linked_document_ids_json, last_verified_at, last_reviewed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      accessItem.id,
      accessItem.propertyId,
      accessItem.category,
      accessItem.label,
      accessItem.username ?? null,
      accessItem.accessCode ?? null,
      accessItem.location ?? null,
      accessItem.instructions ?? null,
      accessItem.notes ?? null,
      accessItem.linkedAssetId ?? null,
      JSON.stringify(accessItem.linkedDocumentIds),
      accessItem.lastVerifiedAt ?? null,
      accessItem.lastReviewedAt ?? null,
    ],
  );

  return accessItem;
}

async function updateAccessItem(
  db: SQLiteDatabase,
  input: UpdateAccessItemInput,
): Promise<AccessItem> {
  await db.runAsync(
    `UPDATE access_items
     SET category = ?,
         label = ?,
         username = ?,
         access_code = ?,
         location = ?,
         instructions = ?,
         notes = ?,
         linked_asset_id = ?,
         linked_document_ids_json = ?,
         last_verified_at = ?,
         last_reviewed_at = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND property_id = ?`,
    [
      input.category,
      input.label,
      input.username ?? null,
      input.accessCode ?? null,
      input.location ?? null,
      input.instructions ?? null,
      input.notes ?? null,
      input.linkedAssetId ?? null,
      JSON.stringify(input.linkedDocumentIds),
      input.lastVerifiedAt ?? null,
      input.lastReviewedAt ?? null,
      input.id,
      input.propertyId,
    ],
  );

  return { ...input, linkedDocumentIds: [...input.linkedDocumentIds] };
}

async function deleteAccessItem(db: SQLiteDatabase, accessItemId: EntityId): Promise<void> {
  await db.runAsync('DELETE FROM access_items WHERE id = ?', [accessItemId]);
}

async function createEmergencyContact(
  db: SQLiteDatabase,
  input: CreateEmergencyContactInput,
): Promise<EmergencyContact> {
  const contact: EmergencyContact = {
    ...input,
    id: input.id ?? createEntityId('contact'),
  };

  await db.runAsync(
    `INSERT INTO emergency_contacts (
      id, property_id, name, role, priority, responsibility_category, owner_role,
      backup_helper_name, phone, email, address, notes, last_reviewed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      contact.id,
      contact.propertyId,
      contact.name,
      contact.role,
      contact.priority,
      contact.responsibilityCategory ?? null,
      contact.ownerRole ?? null,
      contact.backupHelperName ?? null,
      contact.phone ?? null,
      contact.email ?? null,
      contact.address ?? null,
      contact.notes ?? null,
      contact.lastReviewedAt ?? null,
    ],
  );

  return contact;
}

async function updateEmergencyContact(
  db: SQLiteDatabase,
  input: UpdateEmergencyContactInput,
): Promise<EmergencyContact> {
  await db.runAsync(
    `UPDATE emergency_contacts
     SET name = ?,
         role = ?,
         priority = ?,
         responsibility_category = ?,
         owner_role = ?,
         backup_helper_name = ?,
         phone = ?,
         email = ?,
         address = ?,
         notes = ?,
         last_reviewed_at = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND property_id = ?`,
    [
      input.name,
      input.role,
      input.priority,
      input.responsibilityCategory ?? null,
      input.ownerRole ?? null,
      input.backupHelperName ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.address ?? null,
      input.notes ?? null,
      input.lastReviewedAt ?? null,
      input.id,
      input.propertyId,
    ],
  );

  return { ...input };
}

async function deleteEmergencyContact(db: SQLiteDatabase, contactId: EntityId): Promise<void> {
  await db.runAsync('DELETE FROM emergency_contacts WHERE id = ?', [contactId]);
}

async function createImportantAccount(
  db: SQLiteDatabase,
  input: CreateImportantAccountInput,
): Promise<ImportantAccount> {
  const account: ImportantAccount = {
    ...input,
    id: input.id ?? createEntityId('account'),
    linkedDocumentIds: [...input.linkedDocumentIds],
  };

  await db.runAsync(
    `INSERT INTO important_accounts (
      id, property_id, kind, provider_name, label, account_number, website, phone, email,
      manager_role, backup_helper_name, is_shared_household_account,
      mfa_enabled, recovery_codes_stored, managed_in_password_manager, recovery_notes, notes,
      linked_document_ids_json, last_reviewed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      account.id,
      account.propertyId,
      account.kind,
      account.providerName,
      account.label,
      account.accountNumber ?? null,
      account.website ?? null,
      account.phone ?? null,
      account.email ?? null,
      account.managerRole ?? null,
      account.backupHelperName ?? null,
      toSqliteBoolean(account.isSharedHouseholdAccount),
      toSqliteBoolean(account.mfaEnabled),
      toSqliteBoolean(account.recoveryCodesStored),
      toSqliteBoolean(account.managedInPasswordManager),
      account.recoveryNotes ?? null,
      account.notes ?? null,
      JSON.stringify(account.linkedDocumentIds),
      account.lastReviewedAt ?? null,
    ],
  );

  return account;
}

async function updateImportantAccount(
  db: SQLiteDatabase,
  input: UpdateImportantAccountInput,
): Promise<ImportantAccount> {
  await db.runAsync(
    `UPDATE important_accounts
     SET kind = ?,
         provider_name = ?,
         label = ?,
         account_number = ?,
         website = ?,
         phone = ?,
         email = ?,
         manager_role = ?,
         backup_helper_name = ?,
         is_shared_household_account = ?,
         mfa_enabled = ?,
         recovery_codes_stored = ?,
         managed_in_password_manager = ?,
         recovery_notes = ?,
         notes = ?,
         linked_document_ids_json = ?,
         last_reviewed_at = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND property_id = ?`,
    [
      input.kind,
      input.providerName,
      input.label,
      input.accountNumber ?? null,
      input.website ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.managerRole ?? null,
      input.backupHelperName ?? null,
      toSqliteBoolean(input.isSharedHouseholdAccount),
      toSqliteBoolean(input.mfaEnabled),
      toSqliteBoolean(input.recoveryCodesStored),
      toSqliteBoolean(input.managedInPasswordManager),
      input.recoveryNotes ?? null,
      input.notes ?? null,
      JSON.stringify(input.linkedDocumentIds),
      input.lastReviewedAt ?? null,
      input.id,
      input.propertyId,
    ],
  );

  return { ...input, linkedDocumentIds: [...input.linkedDocumentIds] };
}

async function deleteImportantAccount(db: SQLiteDatabase, accountId: EntityId): Promise<void> {
  await db.runAsync('DELETE FROM important_accounts WHERE id = ?', [accountId]);
}

async function createContinuityPlaybook(
  db: SQLiteDatabase,
  input: CreateContinuityPlaybookInput,
): Promise<ContinuityPlaybook> {
  const playbook: ContinuityPlaybook = {
    ...input,
    id: input.id ?? createEntityId('playbook'),
    steps: input.steps.map((step) => ({ ...step })),
    linkedRecordIds: [...input.linkedRecordIds],
  };

  await db.runAsync(
    `INSERT INTO continuity_playbooks (
      id, property_id, category, title, state, notes, steps_json, linked_record_ids_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      playbook.id,
      playbook.propertyId,
      playbook.category,
      playbook.title,
      playbook.state,
      playbook.notes ?? null,
      JSON.stringify(playbook.steps),
      JSON.stringify(playbook.linkedRecordIds),
    ],
  );

  return playbook;
}

async function updateContinuityPlaybook(
  db: SQLiteDatabase,
  input: UpdateContinuityPlaybookInput,
): Promise<ContinuityPlaybook> {
  await db.runAsync(
    `UPDATE continuity_playbooks
     SET category = ?,
         title = ?,
         state = ?,
         notes = ?,
         steps_json = ?,
         linked_record_ids_json = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND property_id = ?`,
    [
      input.category,
      input.title,
      input.state,
      input.notes ?? null,
      JSON.stringify(input.steps),
      JSON.stringify(input.linkedRecordIds),
      input.id,
      input.propertyId,
    ],
  );

  return {
    ...input,
    steps: input.steps.map((step) => ({ ...step })),
    linkedRecordIds: [...input.linkedRecordIds],
  };
}

async function deleteContinuityPlaybook(db: SQLiteDatabase, playbookId: EntityId): Promise<void> {
  await db.runAsync('DELETE FROM continuity_playbooks WHERE id = ?', [playbookId]);
}

async function createTask(db: SQLiteDatabase, input: CreateTaskInput): Promise<MaintenanceTask> {
  const task: MaintenanceTask = {
    ...input,
    id: input.id ?? createEntityId('task'),
  };

  await db.runAsync(
    `INSERT INTO maintenance_tasks (
      id, property_id, scope, scope_id, title, due_date, recurrence_kind,
      recurrence_label, assignee_id, state, instructions
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      task.id,
      task.propertyId,
      task.scope,
      task.scopeId,
      task.title,
      task.dueDate,
      task.recurrenceKind,
      task.recurrenceLabel,
      task.assigneeId ?? null,
      task.state,
      task.instructions ?? null,
    ],
  );

  return task;
}

async function updateTask(db: SQLiteDatabase, input: UpdateTaskInput): Promise<MaintenanceTask> {
  await db.runAsync(
    `UPDATE maintenance_tasks
     SET scope = ?,
         scope_id = ?,
         title = ?,
         due_date = ?,
         recurrence_kind = ?,
         recurrence_label = ?,
         assignee_id = ?,
         state = ?,
         instructions = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND property_id = ?`,
    [
      input.scope,
      input.scopeId,
      input.title,
      input.dueDate,
      input.recurrenceKind,
      input.recurrenceLabel,
      input.assigneeId ?? null,
      input.state,
      input.instructions ?? null,
      input.id,
      input.propertyId,
    ],
  );

  return input;
}

async function deleteTask(db: SQLiteDatabase, taskId: EntityId): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM task_completions WHERE task_id = ?', [taskId]);
    await db.runAsync('DELETE FROM maintenance_tasks WHERE id = ?', [taskId]);
  });
}

async function createRepairEvent(
  db: SQLiteDatabase,
  input: CreateRepairEventInput,
): Promise<RepairEvent> {
  const repairEvent: RepairEvent = {
    ...input,
    id: input.id ?? createEntityId('repair'),
    documentIds: [...input.documentIds],
  };

  await db.runAsync(
    `INSERT INTO repair_events (
      id, property_id, asset_id, issue, provider, diagnosis, resolution,
      cost_cents, date, document_ids_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      repairEvent.id,
      repairEvent.propertyId,
      repairEvent.assetId,
      repairEvent.issue,
      repairEvent.provider ?? null,
      repairEvent.diagnosis ?? null,
      repairEvent.resolution ?? null,
      repairEvent.costCents ?? null,
      repairEvent.date,
      JSON.stringify(repairEvent.documentIds),
    ],
  );

  return repairEvent;
}

async function updateRepairEvent(
  db: SQLiteDatabase,
  input: UpdateRepairEventInput,
): Promise<RepairEvent> {
  await db.runAsync(
    `UPDATE repair_events SET
      issue = ?, provider = ?, diagnosis = ?, resolution = ?,
      cost_cents = ?, date = ?, document_ids_json = ?
    WHERE id = ?`,
    [
      input.issue,
      input.provider ?? null,
      input.diagnosis ?? null,
      input.resolution ?? null,
      input.costCents ?? null,
      input.date,
      JSON.stringify(input.documentIds),
      input.id,
    ],
  );

  return { ...input, documentIds: [...input.documentIds] };
}

async function deleteRepairEvent(
  db: SQLiteDatabase,
  repairEventId: EntityId,
): Promise<void> {
  await db.runAsync('DELETE FROM repair_events WHERE id = ?', [repairEventId]);
}

async function completeTask(
  db: SQLiteDatabase,
  input: CompleteTaskInput,
): Promise<TaskCompletion> {
  const task = await db.getFirstAsync<TaskRow>(
    'SELECT * FROM maintenance_tasks WHERE id = ?',
    [input.taskId],
  );

  if (!task) {
    throw new Error(`Task ${input.taskId} was not found in SQLite.`);
  }

  const completion: TaskCompletion = {
    id: createEntityId('completion'),
    taskId: input.taskId,
    completedAt: input.completedAt ?? new Date().toISOString(),
    costCents: input.costCents,
    notes: input.notes,
    photoUri: input.photoUri,
    kind: input.kind,
  };

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO task_completions (
        id, task_id, completed_at, completed_by_user_id, cost_cents, notes, photo_uri, kind
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        completion.id,
        completion.taskId,
        completion.completedAt,
        completion.completedByUserId ?? null,
        completion.costCents ?? null,
        completion.notes ?? null,
        completion.photoUri ?? null,
        completion.kind ?? null,
      ],
    );

    if (input.kind !== 'skipped') {
      await db.runAsync(
        `UPDATE maintenance_tasks
         SET state = 'completed',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [input.taskId],
      );
    }
  });

  return completion;
}

async function updateTaskCompletion(
  db: SQLiteDatabase,
  input: UpdateTaskCompletionInput,
): Promise<TaskCompletion> {
  await db.runAsync(
    `UPDATE task_completions
     SET completed_at = ?,
         cost_cents = ?,
         notes = ?,
         photo_uri = ?
     WHERE id = ?`,
    [
      input.completedAt,
      input.costCents ?? null,
      input.notes ?? null,
      input.photoUri ?? null,
      input.id,
    ],
  );

  return { ...input };
}

async function deleteTaskCompletion(db: SQLiteDatabase, completionId: EntityId): Promise<void> {
  await db.runAsync(`DELETE FROM task_completions WHERE id = ?`, [completionId]);
}

type PartRow = {
  id: string;
  property_id: string;
  asset_id: string | null;
  maintenance_task_id: string | null;
  name: string;
  part_number: string | null;
  size: string | null;
  quantity: number | null;
  link: string | null;
};

function toPart(row: PartRow): PartSupply {
  return {
    id: row.id,
    propertyId: row.property_id,
    assetId: row.asset_id ?? undefined,
    maintenanceTaskId: row.maintenance_task_id ?? undefined,
    name: row.name,
    partNumber: row.part_number ?? undefined,
    size: row.size ?? undefined,
    quantity: row.quantity ?? undefined,
    link: row.link ?? undefined,
  };
}

async function getParts(db: SQLiteDatabase, propertyId: EntityId): Promise<PartSupply[]> {
  const rows = await db.getAllAsync<PartRow>(
    `SELECT * FROM parts WHERE property_id = ? ORDER BY name`,
    [propertyId],
  );
  return rows.map(toPart);
}

async function createPart(db: SQLiteDatabase, input: CreatePartInput): Promise<PartSupply> {
  const id = input.id ?? createEntityId('part');
  await db.runAsync(
    `INSERT INTO parts (id, property_id, asset_id, maintenance_task_id, name, part_number, size, quantity, link)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.propertyId,
      input.assetId ?? null,
      input.maintenanceTaskId ?? null,
      input.name,
      input.partNumber ?? null,
      input.size ?? null,
      input.quantity ?? null,
      input.link ?? null,
    ],
  );
  return { ...input, id };
}

async function updatePart(db: SQLiteDatabase, input: UpdatePartInput): Promise<PartSupply> {
  await db.runAsync(
    `UPDATE parts SET asset_id = ?, maintenance_task_id = ?, name = ?, part_number = ?, size = ?, quantity = ?, link = ?
     WHERE id = ?`,
    [
      input.assetId ?? null,
      input.maintenanceTaskId ?? null,
      input.name,
      input.partNumber ?? null,
      input.size ?? null,
      input.quantity ?? null,
      input.link ?? null,
      input.id,
    ],
  );
  return { ...input };
}

async function deletePart(db: SQLiteDatabase, partId: EntityId): Promise<void> {
  await db.runAsync(`DELETE FROM parts WHERE id = ?`, [partId]);
}

function createEntityId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function countByProperty(
  db: SQLiteDatabase,
  tableName: 'rooms' | 'assets' | 'documents',
  propertyId: EntityId,
) {
  const row = await db.getFirstAsync<CountRow>(
    `SELECT COUNT(*) AS count FROM ${tableName} WHERE property_id = ?`,
    [propertyId],
  );

  return row?.count ?? 0;
}

async function countActiveTasks(db: SQLiteDatabase, propertyId: EntityId) {
  const row = await db.getFirstAsync<CountRow>(
    `SELECT COUNT(*) AS count
     FROM maintenance_tasks
     WHERE property_id = ? AND state IN ('overdue', 'due_today')`,
    [propertyId],
  );

  return row?.count ?? 0;
}

function toProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    householdId: row.household_id,
    label: row.label,
    addressLabel: row.address_label ?? undefined,
    type: row.type,
    yearBuilt: row.year_built ?? undefined,
    purchaseDate: row.purchase_date ?? undefined,
    photoUri: row.photo_uri ?? undefined,
  };
}

function toRoom(row: RoomRow): RoomArea {
  return {
    id: row.id,
    propertyId: row.property_id,
    name: row.name,
    type: row.type,
    floor: row.floor ?? undefined,
    photoUri: row.photo_uri ?? undefined,
  };
}

function toAsset(row: AssetRow): Asset {
  return {
    id: row.id,
    propertyId: row.property_id,
    roomId: row.room_id ?? undefined,
    name: row.name,
    category: row.category,
    ownerName: row.owner_name ?? undefined,
    backupHelperName: row.backup_helper_name ?? undefined,
    brand: row.brand ?? undefined,
    model: row.model ?? undefined,
    serial: row.serial ?? undefined,
    installDate: row.install_date ?? undefined,
    purchaseDate: row.purchase_date ?? undefined,
    warrantyExpiry: row.warranty_expiry ?? undefined,
    backupEnabled: fromSqliteBoolean(row.backup_enabled),
    screenLockEnabled: fromSqliteBoolean(row.screen_lock_enabled),
    findMyDeviceEnabled: fromSqliteBoolean(row.find_my_device_enabled),
    networkName: row.network_name ?? undefined,
    internetProvider: row.internet_provider ?? undefined,
    networkAdminUrl: row.network_admin_url ?? undefined,
    photoUri: row.photo_uri ?? undefined,
    costCents: row.cost_cents ?? undefined,
    status: row.status,
    notes: row.notes ?? undefined,
    lastReviewedAt: row.last_reviewed_at ?? undefined,
  };
}

function toSqliteBoolean(value: boolean | undefined): number | null {
  if (value == null) {
    return null;
  }

  return value ? 1 : 0;
}

function fromSqliteBoolean(value: number | null): boolean | undefined {
  if (value == null) {
    return undefined;
  }

  return value === 1;
}

function toDocument(row: DocumentRow): DocumentRecord {
  return {
    id: row.id,
    propertyId: row.property_id,
    title: row.title,
    type: row.type,
    filePath: row.file_path ?? undefined,
    attachment: parseAttachment(row.attachment_json),
    date: row.date ?? undefined,
    vendor: row.vendor ?? undefined,
    amountCents: row.amount_cents ?? undefined,
    ocrText: row.ocr_text ?? undefined,
    linkedRecordIds: parseLinkedRecordIds(row.linked_record_ids_json),
  };
}

function toAccessItem(row: AccessItemRow): AccessItem {
  return {
    id: row.id,
    propertyId: row.property_id,
    category: row.category,
    label: row.label,
    username: row.username ?? undefined,
    accessCode: row.access_code ?? undefined,
    location: row.location ?? undefined,
    instructions: row.instructions ?? undefined,
    notes: row.notes ?? undefined,
    linkedAssetId: row.linked_asset_id ?? undefined,
    linkedDocumentIds: parseLinkedRecordIds(row.linked_document_ids_json),
    lastVerifiedAt: row.last_verified_at ?? undefined,
    lastReviewedAt: row.last_reviewed_at ?? undefined,
  };
}

function toEmergencyContact(row: EmergencyContactRow): EmergencyContact {
  return {
    id: row.id,
    propertyId: row.property_id,
    name: row.name,
    role: row.role,
    priority: row.priority,
    responsibilityCategory: row.responsibility_category ?? undefined,
    ownerRole: row.owner_role ?? undefined,
    backupHelperName: row.backup_helper_name ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
    notes: row.notes ?? undefined,
    lastReviewedAt: row.last_reviewed_at ?? undefined,
  };
}

function toImportantAccount(row: ImportantAccountRow): ImportantAccount {
  return {
    id: row.id,
    propertyId: row.property_id,
    kind: row.kind,
    providerName: row.provider_name,
    label: row.label,
    accountNumber: row.account_number ?? undefined,
    website: row.website ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    managerRole: row.manager_role ?? undefined,
    backupHelperName: row.backup_helper_name ?? undefined,
    isSharedHouseholdAccount: fromSqliteBoolean(row.is_shared_household_account),
    mfaEnabled: fromSqliteBoolean(row.mfa_enabled),
    recoveryCodesStored: fromSqliteBoolean(row.recovery_codes_stored),
    managedInPasswordManager: fromSqliteBoolean(row.managed_in_password_manager),
    recoveryNotes: row.recovery_notes ?? undefined,
    notes: row.notes ?? undefined,
    linkedDocumentIds: parseLinkedRecordIds(row.linked_document_ids_json),
    lastReviewedAt: row.last_reviewed_at ?? undefined,
  };
}

function toContinuityPlaybook(row: ContinuityPlaybookRow): ContinuityPlaybook {
  return {
    id: row.id,
    propertyId: row.property_id,
    category: row.category,
    title: row.title,
    state: row.state,
    notes: row.notes ?? undefined,
    steps: parsePlaybookSteps(row.steps_json),
    linkedRecordIds: parseLinkedRecordIds(row.linked_record_ids_json),
  };
}


function stringifyAttachment(document: DocumentRecord) {
  return document.attachment ? JSON.stringify(document.attachment) : null;
}

function parseAttachment(value: string | null): DocumentRecord['attachment'] {
  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(value) as DocumentRecord['attachment'];
  } catch {
    return undefined;
  }
}

function parsePlaybookSteps(rawJson: string): ContinuityPlaybook['steps'] {
  const parsed = JSON.parse(rawJson) as unknown;

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter((value): value is Record<string, unknown> => typeof value === 'object' && value !== null)
    .map((step, index) => ({
      id:
        typeof step.id === 'string' && step.id.length > 0
          ? step.id
          : `playbook-step-${index + 1}`,
      label: typeof step.label === 'string' ? step.label : 'Untitled step',
      notes: typeof step.notes === 'string' ? step.notes : undefined,
      isRequired: step.isRequired !== false,
      isComplete: step.isComplete === true,
    }));
}

function toTask(row: TaskRow): MaintenanceTask {
  let state = row.state as MaintenanceTask['state'];

  if (state === 'snoozed' && row.due_date) {
    const today = new Date().toISOString().slice(0, 10);
    if (row.due_date <= today) {
      state = getTaskStateForDate(row.due_date);
    }
  }

  return {
    id: row.id,
    propertyId: row.property_id,
    scope: row.scope,
    scopeId: row.scope_id,
    title: row.title,
    dueDate: row.due_date,
    recurrenceKind: row.recurrence_kind,
    recurrenceLabel: row.recurrence_label,
    assigneeId: row.assignee_id ?? undefined,
    state,
    instructions: row.instructions ?? undefined,
  };
}

function toTaskCompletion(row: TaskCompletionRow): TaskCompletion {
  return {
    id: row.id,
    taskId: row.task_id,
    completedAt: row.completed_at,
    completedByUserId: row.completed_by_user_id ?? undefined,
    costCents: row.cost_cents ?? undefined,
    notes: row.notes ?? undefined,
    photoUri: row.photo_uri ?? undefined,
    kind: (row.kind as TaskCompletion['kind']) ?? undefined,
  };
}

function toRepairEvent(row: RepairEventRow): RepairEvent {
  return {
    id: row.id,
    propertyId: row.property_id,
    assetId: row.asset_id,
    issue: row.issue,
    provider: row.provider ?? undefined,
    diagnosis: row.diagnosis ?? undefined,
    resolution: row.resolution ?? undefined,
    costCents: row.cost_cents ?? undefined,
    date: row.date,
    documentIds: parseLinkedRecordIds(row.document_ids_json),
  };
}

function parseLinkedRecordIds(rawJson: string): EntityId[] {
  const parsed = JSON.parse(rawJson) as unknown;

  return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
}
