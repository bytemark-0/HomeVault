-- HomeVault schema v1 (current)
--
-- This is the complete current schema. New databases are created at v1 directly.
-- Databases upgrading from v0 reach v1 via the migrate() function in
-- sqliteHomeVaultRepository.ts, which uses CREATE TABLE IF NOT EXISTS and
-- ensureColumn to fill in any missing tables or columns idempotently.
--
-- PRAGMA user_version = 1 is set by the migration on completion.
--
-- To create a test database at this version:
--   sqlite3 test-v1.db < schema-v1.sql

PRAGMA foreign_keys = ON;
PRAGMA user_version = 1;

CREATE TABLE properties (
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

CREATE TABLE rooms (
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

CREATE TABLE assets (
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

CREATE TABLE documents (
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

CREATE TABLE maintenance_tasks (
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

CREATE TABLE task_completions (
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

CREATE TABLE repair_events (
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

CREATE TABLE parts (
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

CREATE INDEX idx_rooms_property ON rooms(property_id);
CREATE INDEX idx_assets_property ON assets(property_id);
CREATE INDEX idx_documents_property ON documents(property_id);
CREATE INDEX idx_tasks_property_due ON maintenance_tasks(property_id, due_date);
CREATE INDEX idx_task_completions_task ON task_completions(task_id);
CREATE INDEX idx_repair_events_property_asset ON repair_events(property_id, asset_id, date);
CREATE INDEX idx_parts_property_asset ON parts(property_id, asset_id);
