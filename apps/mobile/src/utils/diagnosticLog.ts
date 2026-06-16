import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type DiagnosticCategory =
  | 'render_crash'
  | 'init_failure'
  | 'migration_failure'
  | 'data_load_failure'
  | 'mutation_failure'
  | 'backup_failure'
  | 'restore_failure'
  | 'export_failure'
  | 'notification_failure'
  | 'camera_failure';

const APP_VERSION = Constants.expoConfig?.version ?? 'unknown';
const SCHEMA_VERSION = '1';

export function logDiagnostic(category: DiagnosticCategory, error?: unknown): void {
  const errorName = error instanceof Error ? error.constructor.name : String(typeof error);
  // Log structured event with no user-owned content (names, addresses, notes, paths).
  // Only error class name is included — not message or stack, which could theoretically
  // contain user-visible strings in third-party throw sites.
  console.warn(
    '[HomeVault diagnostic]',
    JSON.stringify({
      category,
      errorName,
      appVersion: APP_VERSION,
      schemaVersion: SCHEMA_VERSION,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    }),
  );
}
