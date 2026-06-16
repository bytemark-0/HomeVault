export const CURRENT_SCHEMA_VERSION = 1;

export interface MigrationDatabase {
  execAsync(source: string): Promise<void>;
  getFirstAsync<T>(source: string): Promise<T | null>;
  getAllAsync<T>(source: string): Promise<T[]>;
}

export async function migrate(db: MigrationDatabase): Promise<void> {
  // foreign_keys must be re-enabled each connection; it is not persisted
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const fromVersion = versionRow?.user_version ?? 0;

  if (fromVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Database schema version ${fromVersion} is newer than the supported version ${CURRENT_SCHEMA_VERSION}. Please update the app.`,
    );
  }

  if (fromVersion === CURRENT_SCHEMA_VERSION) {
    return;
  }

  // v0 → v1: full schema DDL (idempotent) + columns added during pre-versioned development
  if (fromVersion < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY NOT NULL,
        household_id TEXT NOT NULL,
        label TEXT NOT NULL,
        address_label TEXT,
        type TEXT NOT NULL,
        year_built INTEGER,
        purchase_date TEXT,
        photo_uri TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT
      );

      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY NOT NULL,
        property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        floor TEXT,
        photo_uri TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT
      );

      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY NOT NULL,
        property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        serial TEXT,
        install_date TEXT,
        purchase_date TEXT,
        warranty_expiry TEXT,
        photo_uri TEXT,
        cost_cents INTEGER,
        status TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT
      );

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY NOT NULL,
        property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        file_path TEXT,
        attachment_json TEXT,
        date TEXT,
        vendor TEXT,
        amount_cents INTEGER,
        ocr_text TEXT,
        linked_record_ids_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT
      );

      CREATE TABLE IF NOT EXISTS maintenance_tasks (
        id TEXT PRIMARY KEY NOT NULL,
        property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        scope TEXT NOT NULL,
        scope_id TEXT NOT NULL,
        title TEXT NOT NULL,
        due_date TEXT NOT NULL,
        recurrence_kind TEXT NOT NULL,
        recurrence_label TEXT NOT NULL,
        assignee_id TEXT,
        state TEXT NOT NULL,
        instructions TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT
      );

      CREATE TABLE IF NOT EXISTS task_completions (
        id TEXT PRIMARY KEY NOT NULL,
        task_id TEXT NOT NULL REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
        completed_at TEXT NOT NULL,
        completed_by_user_id TEXT,
        cost_cents INTEGER,
        notes TEXT,
        photo_uri TEXT,
        kind TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS repair_events (
        id TEXT PRIMARY KEY NOT NULL,
        property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        issue TEXT NOT NULL,
        provider TEXT,
        diagnosis TEXT,
        resolution TEXT,
        cost_cents INTEGER,
        date TEXT NOT NULL,
        document_ids_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT
      );

      CREATE TABLE IF NOT EXISTS parts (
        id TEXT PRIMARY KEY NOT NULL,
        property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        asset_id TEXT REFERENCES assets(id) ON DELETE CASCADE,
        maintenance_task_id TEXT,
        name TEXT NOT NULL,
        part_number TEXT,
        size TEXT,
        quantity INTEGER,
        link TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_rooms_property ON rooms(property_id);
      CREATE INDEX IF NOT EXISTS idx_assets_property ON assets(property_id);
      CREATE INDEX IF NOT EXISTS idx_documents_property ON documents(property_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_property_due ON maintenance_tasks(property_id, due_date);
      CREATE INDEX IF NOT EXISTS idx_task_completions_task ON task_completions(task_id);
      CREATE INDEX IF NOT EXISTS idx_repair_events_property_asset ON repair_events(property_id, asset_id, date);
      CREATE INDEX IF NOT EXISTS idx_parts_property_asset ON parts(property_id, asset_id);
    `);

    // These columns were added during pre-versioned development. ensureColumn is
    // idempotent so they are no-ops on databases already created from the current DDL.
    await ensureColumn(db, 'documents', 'attachment_json', 'TEXT');
    await ensureColumn(db, 'rooms', 'photo_uri', 'TEXT');
    await ensureColumn(db, 'properties', 'photo_uri', 'TEXT');
    await ensureColumn(db, 'assets', 'install_date', 'TEXT');
    await ensureColumn(db, 'assets', 'purchase_date', 'TEXT');
    await ensureColumn(db, 'assets', 'cost_cents', 'INTEGER');
    await ensureColumn(db, 'assets', 'warranty_expiry', 'TEXT');
    await ensureColumn(db, 'assets', 'photo_uri', 'TEXT');
    await ensureColumn(db, 'task_completions', 'photo_uri', 'TEXT');
    await ensureColumn(db, 'task_completions', 'kind', 'TEXT');

    await db.execAsync(`PRAGMA user_version = 1;`);
  }
}

async function ensureColumn(
  db: MigrationDatabase,
  tableName: string,
  columnName: string,
  columnDefinition: string,
) {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName})`);

  if (columns.some((column) => column.name === columnName)) {
    return;
  }

  await db.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
}
