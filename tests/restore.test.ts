import assert from 'node:assert/strict';
import { resolve } from 'node:path';

import { migrate, type MigrationDatabase } from '../apps/mobile/src/data/sqliteMigrations';

const initSqlJs = require(resolve(process.cwd(), 'node_modules/sql.js/dist/sql-asm.js')) as (
  config?: object,
) => Promise<{ Database: new () => SqlJsDatabase }>;

interface QueryExecResult {
  columns: string[];
  values: (string | number | null)[][];
}

interface SqlJsDatabase {
  run(sql: string, params?: (string | number | null)[]): void;
  exec(sql: string): QueryExecResult[];
}

interface RestoreDatabase extends MigrationDatabase {
  runAsync(sql: string, params: (string | number | null)[]): Promise<void>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
}

function makeRestoreAdapter(raw: SqlJsDatabase): RestoreDatabase {
  return {
    execAsync(sql: string) {
      raw.run(sql);
      return Promise.resolve();
    },
    getFirstAsync<T>(sql: string): Promise<T | null> {
      const results = raw.exec(sql);
      const result = results[0];
      if (!result || result.values.length === 0) return Promise.resolve(null);
      const row = Object.fromEntries(result.values[0]!.map((val, i) => [result.columns[i], val]));
      return Promise.resolve(row as T);
    },
    getAllAsync<T>(sql: string): Promise<T[]> {
      const results = raw.exec(sql);
      const result = results[0];
      if (!result) return Promise.resolve([]);
      const rows = result.values.map((row) =>
        Object.fromEntries(row.map((val, i) => [result.columns[i], val])),
      );
      return Promise.resolve(rows as T[]);
    },
    runAsync(sql: string, params: (string | number | null)[]) {
      raw.run(sql, params);
      return Promise.resolve();
    },
    async withTransactionAsync(fn: () => Promise<void>) {
      raw.run('BEGIN');
      try {
        await fn();
        raw.run('COMMIT');
      } catch (err) {
        try { raw.run('ROLLBACK'); } catch { /* ignore rollback errors */ }
        throw err;
      }
    },
  };
}

// Mirrors the production restore path: delete all rows, then insert snapshot rows.
// Runs inside a single transaction so any insert failure rolls back the deletes too.
async function atomicRestore(
  db: RestoreDatabase,
  snapshot: {
    propertyId: string;
    propertyLabel: string;
    assetId?: string;
    repairAssetId?: string; // deliberately wrong FK to trigger failure
  },
): Promise<void> {
  await db.withTransactionAsync(async () => {
    // Delete phase
    await db.runAsync('DELETE FROM repair_events', []);
    await db.runAsync('DELETE FROM assets', []);
    await db.runAsync('DELETE FROM rooms', []);
    await db.runAsync('DELETE FROM properties', []);

    // Insert phase
    await db.runAsync(
      'INSERT INTO properties (id, household_id, label, type, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [snapshot.propertyId, 'hh-new', snapshot.propertyLabel, 'single_family'],
    );

    if (snapshot.assetId) {
      await db.runAsync(
        'INSERT INTO assets (id, property_id, name, category, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [snapshot.assetId, snapshot.propertyId, 'Boiler', 'Appliance', 'ready'],
      );
    }

    if (snapshot.repairAssetId) {
      // This will trigger a FK violation when repairAssetId is not in assets
      await db.runAsync(
        'INSERT INTO repair_events (id, property_id, asset_id, issue, date, document_ids_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        ['re-1', snapshot.propertyId, snapshot.repairAssetId, 'Leak', '2026-01-01', '[]'],
      );
    }
  });
}

async function main() {
  const SQL = await initSqlJs();

  await test('successful restore replaces existing records atomically', async () => {
    const raw = new SQL.Database();
    const db = makeRestoreAdapter(raw);

    await migrate(db);
    raw.run('PRAGMA foreign_keys = ON');

    // Seed original data
    raw.run(
      "INSERT INTO properties (id, household_id, label, type, created_at, updated_at) VALUES ('prop-orig', 'hh-1', 'Original Home', 'single_family', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
    );

    // Restore with a new snapshot
    await atomicRestore(db, {
      propertyId: 'prop-new',
      propertyLabel: 'Restored Home',
      assetId: 'asset-new',
    });

    const prop = await db.getFirstAsync<{ label: string }>('SELECT label FROM properties');
    assert.equal(prop?.label, 'Restored Home', 'property replaced by restore');

    const assets = await db.getAllAsync<{ id: string }>('SELECT id FROM assets');
    assert.equal(assets.length, 1);
    assert.equal(assets[0]?.id, 'asset-new');
  });

  await test('restore with FK violation rolls back — original vault is preserved', async () => {
    const raw = new SQL.Database();
    const db = makeRestoreAdapter(raw);

    await migrate(db);
    raw.run('PRAGMA foreign_keys = ON');

    // Seed original data
    raw.run(
      "INSERT INTO properties (id, household_id, label, type, created_at, updated_at) VALUES ('prop-orig', 'hh-1', 'Original Home', 'single_family', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
    );
    raw.run(
      "INSERT INTO assets (id, property_id, name, category, status, created_at, updated_at) VALUES ('asset-orig', 'prop-orig', 'Washing Machine', 'Appliance', 'ready', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
    );

    // Attempt to restore with a repair_event whose asset_id points to a non-existent asset
    await assert.rejects(
      () =>
        atomicRestore(db, {
          propertyId: 'prop-new',
          propertyLabel: 'Restored Home',
          assetId: 'asset-new',
          repairAssetId: 'GHOST_ASSET', // not in assets table → FK violation
        }),
      /FOREIGN KEY constraint failed/,
    );

    // Original property and asset must be intact
    const prop = await db.getFirstAsync<{ label: string }>('SELECT label FROM properties');
    assert.equal(prop?.label, 'Original Home', 'original property preserved after failed restore');

    const assets = await db.getAllAsync<{ id: string }>('SELECT id FROM assets');
    assert.equal(assets.length, 1, 'original asset count preserved');
    assert.equal(assets[0]?.id, 'asset-orig', 'original asset id preserved');
  });

  await test('restore with part referencing non-existent asset rolls back', async () => {
    const raw = new SQL.Database();
    const db = makeRestoreAdapter(raw);

    await migrate(db);
    raw.run('PRAGMA foreign_keys = ON');

    // Seed original vault
    raw.run(
      "INSERT INTO properties (id, household_id, label, type, created_at, updated_at) VALUES ('prop-orig', 'hh-1', 'Vault Home', 'single_family', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
    );

    // Attempt restore: snapshot has a part pointing to 'GHOST_ASSET' (not in snapshot assets)
    await assert.rejects(
      async () => {
        await db.withTransactionAsync(async () => {
          await db.runAsync('DELETE FROM parts', []);
          await db.runAsync('DELETE FROM repair_events', []);
          await db.runAsync('DELETE FROM assets', []);
          await db.runAsync('DELETE FROM rooms', []);
          await db.runAsync('DELETE FROM properties', []);
          await db.runAsync(
            'INSERT INTO properties (id, household_id, label, type, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            ['prop-new', 'hh-new', 'New Home', 'single_family'],
          );
          // Part references an asset that wasn't inserted → FK failure
          await db.runAsync(
            'INSERT INTO parts (id, property_id, asset_id, name) VALUES (?, ?, ?, ?)',
            ['part-1', 'prop-new', 'GHOST_ASSET', 'Replacement filter'],
          );
        });
      },
      /FOREIGN KEY constraint failed/,
    );

    // Original vault untouched
    const prop = await db.getFirstAsync<{ label: string }>('SELECT label FROM properties');
    assert.equal(prop?.label, 'Vault Home', 'original vault preserved after part FK failure');
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
