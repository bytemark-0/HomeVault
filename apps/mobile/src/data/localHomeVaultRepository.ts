import type { HomeVaultRepository } from '@homevault/database';

import { createSQLiteHomeVaultRepository } from './sqliteHomeVaultRepository';

let repositoryPromise: Promise<HomeVaultRepository> | null = null;

export function getHomeVaultRepository() {
  repositoryPromise ??= createSQLiteHomeVaultRepository();

  return repositoryPromise;
}

export function setHomeVaultRepository(repo: HomeVaultRepository): void {
  repositoryPromise = Promise.resolve(repo);
}
