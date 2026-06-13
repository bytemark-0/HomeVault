import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { formatHomeVaultExportPackage } from '../packages/export/src';
import {
  backupSnapshot,
  buildPackage,
  sampleBackupGeneratedAt,
} from '../tests/support/exportFixtures';

const outputPath = resolve(process.cwd(), 'docs/homevault-sample-backup.json');
const backupPackage = buildPackage(backupSnapshot, sampleBackupGeneratedAt);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${formatHomeVaultExportPackage(backupPackage)}\n`, 'utf8');
console.log(`Generated ${outputPath}`);
