import assert from 'node:assert/strict';
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

  await test('migrates a fresh (v0) database to v1', async () => {
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
    assert.equal(version?.user_version, 1);

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
  });

  await test('migration is idempotent — running twice stays at v1', async () => {
    const raw = new SQL.Database();
    const db = makeSqlJsAdapter(raw);

    await migrate(db);
    await migrate(db); // second run should no-op

    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    assert.equal(version?.user_version, 1);

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
