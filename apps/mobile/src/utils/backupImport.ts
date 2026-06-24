import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import JSZip from 'jszip';

import type { HomeVaultSnapshot } from '@homevault/database';
import {
  parseHomeVaultExportPackage,
  type HomeVaultExportPackage,
  type HomeVaultExportPackageValidation,
} from '@homevault/export';

type BackupArchiveData =
  | { kind: 'arrayBuffer'; value: ArrayBuffer }
  | { kind: 'base64'; value: string };

type PickedBackupAsset = {
  file?: {
    arrayBuffer?: () => Promise<ArrayBuffer>;
    text?: () => Promise<string>;
  } | null;
  name: string;
  uri: string;
};

export type ValidatedBackup =
  | {
      sourceKind: 'json';
      package: HomeVaultExportPackage;
      preview: Extract<HomeVaultExportPackageValidation, { ok: true }>['preview'];
      summary: string;
    }
  | {
      sourceKind: 'zip';
      archiveData: BackupArchiveData;
      archiveName: string;
      assetPhotoCount: number;
      documentFileCount: number;
      package: HomeVaultExportPackage;
      preview: Extract<HomeVaultExportPackageValidation, { ok: true }>['preview'];
      propertyPhotoCount: number;
      roomPhotoCount: number;
      summary: string;
      warnings: string[];
    };

const DOCUMENT_DIR = `${FileSystem.documentDirectory ?? ''}homevault-documents/`;
const PHOTO_DIR = `${FileSystem.documentDirectory ?? ''}homevault-assets/`;

export async function inspectBackupAsset(
  asset: PickedBackupAsset,
): Promise<HomeVaultExportPackageValidation | { ok: true; backup: ValidatedBackup }> {
  if (looksLikeZip(asset.name)) {
    return inspectZipBackup(asset);
  }

  const source = await readJsonBackupText(asset);

  if (!source) {
    return {
      ok: false,
      errorKind: 'not_homevault',
      errors: ['Backup validation requires a readable file from your device.'],
    };
  }

  const parsed = parseHomeVaultExportPackage(source);

  if (!parsed.ok) {
    return parsed;
  }

  return {
    ok: true,
    backup: {
      sourceKind: 'json',
      package: parsed.package,
      preview: parsed.preview,
      summary: parsed.summary,
    },
  };
}

export async function buildRestoreSnapshot(
  backup: ValidatedBackup,
): Promise<HomeVaultSnapshot> {
  if (backup.sourceKind === 'json') {
    return exportPackageToSnapshot(backup.package);
  }

  const zip = await loadZipArchive(backup.archiveData);

  if (Platform.OS !== 'web') {
    await resetDirectory(DOCUMENT_DIR);
    await resetDirectory(PHOTO_DIR);
  }

  const propertyPhotoEntry = findPhotoEntry(zip, 'property', backup.package.records.property.id);
  const restoredPropertyPhotoUri = propertyPhotoEntry
    ? await writeZipEntryToStorage(
        propertyPhotoEntry,
        PHOTO_DIR,
        buildStoredName(
          backup.package.records.property.id,
          backup.package.records.property.label,
          propertyPhotoEntry.name,
        ),
      )
    : null;

  const documents = await Promise.all(
    backup.package.records.documents.map(async (document) => {
      const entry = findDocumentEntry(zip, document.id);
      if (!entry) {
        return { ...document };
      }

      const restoredUri = await writeZipEntryToStorage(
        entry,
        DOCUMENT_DIR,
        buildStoredName(document.id, document.attachment?.fileName ?? document.title, entry.name),
      );

      if (!restoredUri) {
        return { ...document };
      }

        return {
          ...document,
          filePath: restoredUri,
          attachment: document.attachment
            ? {
                ...document.attachment,
                storedUri: restoredUri,
                storageKind: 'app_copy' as const,
              }
            : undefined,
        };
    }),
  );

  const assets = await Promise.all(
    backup.package.records.assets.map(async (asset) => {
      const entry = findPhotoEntry(zip, 'assets', asset.id);
      if (!entry) {
        return { ...asset };
      }

      const restoredUri = await writeZipEntryToStorage(
        entry,
        PHOTO_DIR,
        buildStoredName(asset.id, asset.name, entry.name),
      );

      return {
        ...asset,
        photoUri: restoredUri ?? asset.photoUri,
      };
    }),
  );

  const rooms = await Promise.all(
    backup.package.records.rooms.map(async (room) => {
      const entry = findPhotoEntry(zip, 'rooms', room.id);
      if (!entry) {
        return { ...room };
      }

      const restoredUri = await writeZipEntryToStorage(
        entry,
        PHOTO_DIR,
        buildStoredName(room.id, room.name, entry.name),
      );

      return {
        ...room,
        photoUri: restoredUri ?? room.photoUri,
      };
    }),
  );

  return {
    properties: [
      {
        ...backup.package.records.property,
        photoUri: restoredPropertyPhotoUri ?? backup.package.records.property.photoUri,
      },
    ],
    rooms,
    assets,
    documents,
    tasks: backup.package.records.tasks.map((task) => ({ ...task })),
    taskCompletions: backup.package.records.taskCompletions.map((completion) => ({ ...completion })),
    repairEvents: backup.package.records.repairEvents.map((repairEvent) => ({
      ...repairEvent,
      documentIds: [...repairEvent.documentIds],
    })),
    parts: backup.package.records.parts.map((part) => ({ ...part })),
  };
}

async function inspectZipBackup(
  asset: PickedBackupAsset,
): Promise<HomeVaultExportPackageValidation | { ok: true; backup: ValidatedBackup }> {
  const archiveData = await readZipBackupData(asset);

  if (!archiveData) {
    return {
      ok: false,
      errorKind: 'not_homevault',
      errors: ['Backup validation requires a readable zip archive from your device.'],
    };
  }

  const zip = await loadZipArchive(archiveData);
  const jsonEntry = Object.values(zip.files).find(
    (entry) => !entry.dir && entry.name.toLowerCase().endsWith('.json'),
  );

  if (!jsonEntry) {
    return {
      ok: false,
      errorKind: 'not_homevault',
      errors: ['This zip archive does not contain a HomeVault JSON backup package.'],
    };
  }

  const parsed = parseHomeVaultExportPackage(await jsonEntry.async('text'));

  if (!parsed.ok) {
    return parsed;
  }

  const documentFileCount = countEntriesInFolder(zip, 'documents/');
  const propertyPhotoCount = countEntriesInFolder(zip, 'photos/property/');
  const assetPhotoCount = countEntriesInFolder(zip, 'photos/assets/');
  const roomPhotoCount = countEntriesInFolder(zip, 'photos/rooms/');
  const warnings = buildArchiveWarnings(zip, parsed.package);

  return {
    ok: true,
    backup: {
      sourceKind: 'zip',
      archiveData,
      archiveName: asset.name,
      assetPhotoCount,
      documentFileCount,
      package: parsed.package,
      preview: parsed.preview,
      propertyPhotoCount,
      roomPhotoCount,
      summary: parsed.summary,
      warnings,
    },
  };
}

async function readJsonBackupText(asset: PickedBackupAsset): Promise<string | null> {
  if (typeof asset.file?.text === 'function') {
    return asset.file.text();
  }

  if (!asset.uri) {
    return null;
  }

  return FileSystem.readAsStringAsync(asset.uri);
}

async function readZipBackupData(asset: PickedBackupAsset): Promise<BackupArchiveData | null> {
  if (typeof asset.file?.arrayBuffer === 'function') {
    return {
      kind: 'arrayBuffer',
      value: await asset.file.arrayBuffer(),
    };
  }

  if (!asset.uri) {
    return null;
  }

  return {
    kind: 'base64',
    value: await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    }),
  };
}

async function loadZipArchive(archiveData: BackupArchiveData) {
  return archiveData.kind === 'arrayBuffer'
    ? JSZip.loadAsync(archiveData.value)
    : JSZip.loadAsync(archiveData.value, { base64: true });
}

function countEntriesInFolder(zip: JSZip, folder: string) {
  return Object.values(zip.files).filter((entry) => !entry.dir && entry.name.startsWith(folder))
    .length;
}

function buildArchiveWarnings(zip: JSZip, exportPackage: HomeVaultExportPackage) {
  const warnings: string[] = [];

  const missingDocumentFiles = exportPackage.records.documents.filter((document) =>
    shouldExpectDocumentFile(document.filePath, document.attachment?.storageKind) &&
    !findDocumentEntry(zip, document.id),
  );

  if (missingDocumentFiles.length > 0) {
    warnings.push(
      `${missingDocumentFiles.length} document attachment${missingDocumentFiles.length === 1 ? '' : 's'} listed in the backup package ${missingDocumentFiles.length === 1 ? 'is' : 'are'} missing from the zip archive.`,
    );
  }

  const missingAssetPhotos = exportPackage.records.assets.filter(
    (asset) => isLocalUri(asset.photoUri) && !findPhotoEntry(zip, 'assets', asset.id),
  );

  if (missingAssetPhotos.length > 0) {
    warnings.push(
      `${missingAssetPhotos.length} asset photo${missingAssetPhotos.length === 1 ? '' : 's'} could not be found in the archive.`,
    );
  }

  const missingRoomPhotos = exportPackage.records.rooms.filter(
    (room) => isLocalUri(room.photoUri) && !findPhotoEntry(zip, 'rooms', room.id),
  );

  if (missingRoomPhotos.length > 0) {
    warnings.push(
      `${missingRoomPhotos.length} room photo${missingRoomPhotos.length === 1 ? '' : 's'} could not be found in the archive.`,
    );
  }

  if (
    isLocalUri(exportPackage.records.property.photoUri) &&
    !findPhotoEntry(zip, 'property', exportPackage.records.property.id)
  ) {
    warnings.push('The property photo listed in the backup package is missing from the zip archive.');
  }

  return warnings;
}

function findDocumentEntry(zip: JSZip, documentId: string) {
  return Object.values(zip.files).find(
    (entry) => !entry.dir && entry.name.startsWith(`documents/${documentId}-`),
  );
}

function findPhotoEntry(
  zip: JSZip,
  scope: 'property' | 'assets' | 'rooms',
  recordId: string,
) {
  return Object.values(zip.files).find(
    (entry) => !entry.dir && entry.name.startsWith(`photos/${scope}/${recordId}-`),
  );
}

async function writeZipEntryToStorage(
  entry: JSZip.JSZipObject,
  directory: string,
  fileName: string,
): Promise<string | null> {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return null;
  }

  try {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    const destination = `${directory}${fileName}`;
    await FileSystem.writeAsStringAsync(destination, await entry.async('base64'), {
      encoding: FileSystem.EncodingType.Base64,
    });
    return destination;
  } catch {
    return null;
  }
}

async function resetDirectory(directory: string) {
  try {
    const info = await FileSystem.getInfoAsync(directory);
    if (info.exists) {
      await FileSystem.deleteAsync(directory);
    }
  } catch {
    // Non-fatal cleanup.
  }

  try {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  } catch {
    // Non-fatal if directory already exists.
  }
}

function buildStoredName(recordId: string, label: string, entryName: string) {
  const extension = entryName.split('.').pop()?.toLowerCase() ?? 'file';
  const safeLabel = label
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return `${recordId}-${safeLabel || 'file'}.${extension}`;
}

function looksLikeZip(name: string) {
  return name.toLowerCase().endsWith('.zip');
}

function isLocalUri(value?: string | null) {
  return Boolean(value && (value.startsWith('file://') || value.startsWith('/')));
}

function shouldExpectDocumentFile(
  filePath?: string,
  storageKind?: HomeVaultExportPackage['attachments'][number]['storageKind'],
) {
  if (storageKind === 'app_copy') {
    return true;
  }

  return isLocalUri(filePath);
}

function exportPackageToSnapshot(exportPackage: HomeVaultExportPackage): HomeVaultSnapshot {
  return {
    properties: [{ ...exportPackage.records.property }],
    rooms: exportPackage.records.rooms.map((room) => ({ ...room })),
    assets: exportPackage.records.assets.map((asset) => ({ ...asset })),
    documents: exportPackage.records.documents.map((document) => ({
      ...document,
      linkedRecordIds: [...document.linkedRecordIds],
    })),
    tasks: exportPackage.records.tasks.map((task) => ({ ...task })),
    taskCompletions: exportPackage.records.taskCompletions.map((completion) => ({ ...completion })),
    repairEvents: exportPackage.records.repairEvents.map((repairEvent) => ({
      ...repairEvent,
      documentIds: [...repairEvent.documentIds],
    })),
    parts: exportPackage.records.parts.map((part) => ({ ...part })),
  };
}
