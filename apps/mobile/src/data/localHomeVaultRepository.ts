import type { HomeVaultRepository } from '@homevault/database';

import { sampleSnapshot } from './homeVaultSampleData';
import { createSQLiteHomeVaultRepository } from './sqliteHomeVaultRepository';

let repositoryPromise: Promise<HomeVaultRepository> | null = null;

export function getHomeVaultRepository() {
  repositoryPromise ??= createSQLiteHomeVaultRepository(sampleSnapshot);

  return repositoryPromise;
}
