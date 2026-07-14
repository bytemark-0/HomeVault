import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { migrate, CURRENT_SCHEMA_VERSION, type MigrationDatabase } from '../apps/mobile/src/data/sqliteMigrations';

const initSqlJs = require(resolve(process.cwd(), 'node_modules/sql.js/dist/sql-asm.js')) as (
  config?: object,
) => Promise<{ Database: new () => SqlJsDatabase }>;

interface QueryExecResult {
  columns: string[];
  values: (string | number | null)[][];
}

interface SqlJsDatabase {
  run(sql: string): void;
  exec(sql: string): QueryExecResult[];
}

function makeSqlJsAdapter(db: SqlJsDatabase): MigrationDatabase {
  return {
    execAsync(sql: string) {
      db.run(sql);
      return Promise.resolve();
    },
    getFirstAsync<T>(sql: string): Promise<T | null> {
      const results = db.exec(sql);
      const result = results[0];
      if (!result || result.values.length === 0) return Promise.resolve(null);
      const row = Object.fromEntries(result.values[0]!.map((val, i) => [result.columns[i], val]));
      return Promise.resolve(row as T);
    },
    getAllAsync<T>(sql: string): Promise<T[]> {
      const results = db.exec(sql);
      const result = results[0];
      if (!result) return Promise.resolve([]);
      const rows = result.values.map((row) =>
        Object.fromEntries(row.map((val, i) => [result.columns[i], val])),
      );
      return Promise.resolve(rows as T[]);
    },
  };
}

async function main() {
  const SQL = await initSqlJs();

  await test('migrates a fresh (v0) database to v6', async () => {
    const raw = new SQL.Database();
    const db = makeSqlJsAdapter(raw);

    await migrate(db);

    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    assert.equal(row?.user_version, CURRENT_SCHEMA_VERSION);
  });

  await test('creates all expected tables', async () => {
    const raw = new SQL.Database();
    const db = makeSqlJsAdapter(raw);

    await migrate(db);

    const tables = await db.getAllAsync<{ name: string }>(
      'SELECT name FROM sqlite_master WHERE type = "table" ORDER BY name',
    );
    const tableNames = tables.map((t) => t.name);

    assert.ok(tableNames.includes('properties'), 'properties table exists');
    assert.ok(tableNames.includes('rooms'), 'rooms table exists');
    assert.ok(tableNames.includes('assets'), 'assets table exists');
    assert.ok(tableNames.includes('documents'), 'documents table exists');
    assert.ok(tableNames.includes('maintenance_tasks'), 'maintenance_tasks table exists');
    assert.ok(tableNames.includes('task_completions'), 'task_completions table exists');
    assert.ok(tableNames.includes('repair_events'), 'repair_events table exists');
    assert.ok(tableNames.includes('parts'), 'parts table exists');
    assert.ok(tableNames.includes('access_items'), 'access_items table exists');
    assert.ok(tableNames.includes('emergency_contacts'), 'emergency_contacts table exists');
    assert.ok(tableNames.includes('important_accounts'), 'important_accounts table exists');
    assert.ok(tableNames.includes('continuity_playbooks'), 'continuity_playbooks table exists');
  });

  await test('pre-migration data survives the migration', async () => {
    const raw = new SQL.Database();

    // Schema-v0 fixture: create tables without pre-versioned columns
    raw.run(`
      CREATE TABLE properties (
        id TEXT PRIMARY KEY NOT NULL,
        household_id TEXT NOT NULL,
        label TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE assets (
        id TEXT PRIMARY KEY NOT NULL,
        property_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert representative pre-migration records
    raw.run(
      "INSERT INTO properties (id, household_id, label, type) VALUES ('prop-1', 'hh-1', 'Test Home', 'single_family')",
    );
    raw.run(
      "INSERT INTO assets (id, property_id, name, category, status) VALUES ('asset-1', 'prop-1', 'Dishwasher', 'Appliance', 'ready')",
    );

    const db = makeSqlJsAdapter(raw);
    await migrate(db);

    // Schema version bumped
    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    assert.equal(version?.user_version, 6);

    // Pre-migration records preserved
    const prop = await db.getFirstAsync<{ label: string }>('SELECT label FROM properties');
    assert.equal(prop?.label, 'Test Home');

    const asset = await db.getFirstAsync<{ name: string }>('SELECT name FROM assets');
    assert.equal(asset?.name, 'Dishwasher');

    // ensureColumn columns were added to existing tables
    const propCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(properties)');
    const propColNames = propCols.map((c) => c.name);
    assert.ok(propColNames.includes('photo_uri'), 'photo_uri added to properties');

    const assetCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(assets)');
    const assetColNames = assetCols.map((c) => c.name);
    assert.ok(assetColNames.includes('photo_uri'), 'photo_uri added to assets');
    assert.ok(assetColNames.includes('install_date'), 'install_date added to assets');
    assert.ok(assetColNames.includes('cost_cents'), 'cost_cents added to assets');
    assert.ok(assetColNames.includes('warranty_expiry'), 'warranty_expiry added to assets');
    assert.ok(assetColNames.includes('owner_name'), 'owner_name added to assets');
    assert.ok(assetColNames.includes('backup_enabled'), 'backup_enabled added to assets');
    assert.ok(assetColNames.includes('screen_lock_enabled'), 'screen_lock_enabled added to assets');
    assert.ok(assetColNames.includes('find_my_device_enabled'), 'find_my_device_enabled added to assets');
    assert.ok(assetColNames.includes('network_name'), 'network_name added to assets');
    assert.ok(assetColNames.includes('internet_provider'), 'internet_provider added to assets');
    assert.ok(assetColNames.includes('network_admin_url'), 'network_admin_url added to assets');
    assert.ok(assetColNames.includes('last_reviewed_at'), 'last_reviewed_at added to assets');

    const accessCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(access_items)');
    const accessColNames = accessCols.map((c) => c.name);
    assert.ok(
      accessColNames.includes('last_reviewed_at'),
      'last_reviewed_at added to access_items',
    );

    const contactCols = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(emergency_contacts)',
    );
    const contactColNames = contactCols.map((c) => c.name);
    assert.ok(
      contactColNames.includes('last_reviewed_at'),
      'last_reviewed_at added to emergency_contacts',
    );

    const accountCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(important_accounts)');
    const accountColNames = accountCols.map((c) => c.name);
    assert.ok(accountColNames.includes('mfa_enabled'), 'mfa_enabled added to important_accounts');
    assert.ok(
      accountColNames.includes('recovery_codes_stored'),
      'recovery_codes_stored added to important_accounts',
    );
    assert.ok(
      accountColNames.includes('managed_in_password_manager'),
      'managed_in_password_manager added to important_accounts',
    );
    assert.ok(
      accountColNames.includes('last_reviewed_at'),
      'last_reviewed_at added to important_accounts',
    );
    assert.ok(
      accountColNames.includes('manager_role'),
      'manager_role added to important_accounts',
    );
    assert.ok(
      accountColNames.includes('is_shared_household_account'),
      'is_shared_household_account added to important_accounts',
    );
  });

  await test('migration is idempotent — running twice stays at v6', async () => {
    const raw = new SQL.Database();
    const db = makeSqlJsAdapter(raw);

    await migrate(db);
    await migrate(db); // second run should no-op

    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    assert.equal(version?.user_version, 6);

    // Data written between the two migrate calls is preserved
    raw.run(
      "INSERT INTO properties (id, household_id, label, address_label, type, created_at, updated_at) VALUES ('prop-1', 'hh-1', 'Idempotency Home', NULL, 'single_family', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
    );
    const prop = await db.getFirstAsync<{ label: string }>('SELECT label FROM properties');
    assert.equal(prop?.label, 'Idempotency Home');
  });

  await test('throws when schema version is newer than supported', async () => {
    const raw = new SQL.Database();
    raw.run(`PRAGMA user_version = 99`);
    const db = makeSqlJsAdapter(raw);

    await assert.rejects(
      () => migrate(db),
      (err: Error) =>
        err.message.includes('version 99') && err.message.includes(`${CURRENT_SCHEMA_VERSION}`),
    );
  });

  await test('migrates v4 review metadata and backfills access reviews from last verified dates', async () => {
    const raw = new SQL.Database();
    raw.run(`
      CREATE TABLE properties (
        id TEXT PRIMARY KEY NOT NULL,
        household_id TEXT NOT NULL,
        label TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE assets (
        id TEXT PRIMARY KEY NOT NULL,
        property_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE access_items (
        id TEXT PRIMARY KEY NOT NULL,
        property_id TEXT NOT NULL,
        category TEXT NOT NULL,
        label TEXT NOT NULL,
        linked_document_ids_json TEXT NOT NULL,
        last_verified_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE emergency_contacts (
        id TEXT PRIMARY KEY NOT NULL,
        property_id TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        priority TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE important_accounts (
        id TEXT PRIMARY KEY NOT NULL,
        property_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        provider_name TEXT NOT NULL,
        label TEXT NOT NULL,
        linked_document_ids_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      PRAGMA user_version = 4;
    `);
    raw.run(
      "INSERT INTO properties (id, household_id, label, type) VALUES ('prop-1', 'hh-1', 'Oak Street', 'single_family')",
    );
    raw.run(
      "INSERT INTO access_items (id, property_id, category, label, linked_document_ids_json, last_verified_at) VALUES ('access-1', 'prop-1', 'wifi', 'Main Wi-Fi', '[]', '2026-06-01')",
    );

    const db = makeSqlJsAdapter(raw);
    await migrate(db);

    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    assert.equal(version?.user_version, 6);
    const access = await db.getFirstAsync<{ last_reviewed_at: string }>(
      "SELECT last_reviewed_at FROM access_items WHERE id = 'access-1'",
    );
    assert.equal(access?.last_reviewed_at, '2026-06-01');
  });

  await test('mid-migration failure rolls back — user_version stays at 0', async () => {
    const raw = new SQL.Database();
    const base = makeSqlJsAdapter(raw);

    // Count getAllAsync calls. The 3rd call is during ensureColumn for properties.photo_uri,
    // which happens after all CREATE TABLE DDL has run but before PRAGMA user_version = 1.
    let getAllCount = 0;
    const faultyDb: MigrationDatabase = {
      ...base,
      getAllAsync<T>(sql: string): Promise<T[]> {
        getAllCount++;
        if (getAllCount >= 3) throw new Error('Simulated disk failure');
        return base.getAllAsync<T>(sql);
      },
    };

    await assert.rejects(() => migrate(faultyDb), /Simulated disk failure/);

    // user_version must still be 0 (migration rolled back)
    const row = raw.exec('PRAGMA user_version');
    const version = row[0]?.values[0]?.[0];
    assert.equal(version, 0, 'user_version must remain 0 after failed migration');

    // The tables created during the failed migration must have been rolled back
    const tables = raw.exec(
      'SELECT name FROM sqlite_master WHERE type = "table" ORDER BY name',
    );
    assert.equal(
      tables.length,
      0,
      'No tables should exist after a rolled-back migration',
    );
  });

  await test('migrates the latest retained v1 schema to v6 without losing data', async () => {
    const raw = new SQL.Database();
    raw.run(readFileSync(resolve(process.cwd(), 'tests/fixtures/schema-v1.sql'), 'utf8'));
    raw.run(
      "INSERT INTO properties (id, household_id, label, type, created_at, updated_at) VALUES ('prop-v1', 'hh-v1', 'Legacy Home', 'single_family', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
    );
    raw.run(
      "INSERT INTO assets (id, property_id, name, category, status, created_at, updated_at) VALUES ('asset-v1', 'prop-v1', 'Legacy Router', 'Network', 'ready', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
    );

    const db = makeSqlJsAdapter(raw);
    await migrate(db);

    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    assert.equal(version?.user_version, 6);

    const property = await db.getFirstAsync<{ label: string }>(
      "SELECT label FROM properties WHERE id = 'prop-v1'",
    );
    const asset = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM assets WHERE id = 'asset-v1'",
    );
    const continuityTables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('access_items', 'emergency_contacts', 'important_accounts', 'continuity_playbooks') ORDER BY name",
    );

    assert.equal(property?.label, 'Legacy Home');
    assert.equal(asset?.name, 'Legacy Router');
    assert.deepEqual(continuityTables.map((table) => table.name), [
      'access_items',
      'continuity_playbooks',
      'emergency_contacts',
      'important_accounts',
    ]);
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
