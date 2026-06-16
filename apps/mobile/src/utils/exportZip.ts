import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';

import type { HomeVaultExportPackage } from '@homevault/export';
import type { AssetListItem, DocumentListItem, RoomListItem } from '../data/homeVaultSampleData';

type ZipExportInput = {
  exportPackage: HomeVaultExportPackage;
  exportFileName: string;
  assets: AssetListItem[];
  documents: DocumentListItem[];
  rooms: RoomListItem[];
};

export async function shareZipExport(input: ZipExportInput): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device.');
  }

  const zipFile = await buildZip(input);

  await Sharing.shareAsync(zipFile.uri, {
    mimeType: 'application/zip',
    dialogTitle: 'Save HomeVault backup',
    UTI: 'public.zip-archive',
  });

  try {
    zipFile.delete();
  } catch {
    // Non-critical cleanup
  }
}

async function buildZip(input: ZipExportInput): Promise<File> {
  const { exportPackage, exportFileName, assets, documents, rooms } = input;
  const zip = new JSZip();

  // JSON backup
  const jsonName = exportFileName.endsWith('.json') ? exportFileName : `${exportFileName}.json`;
  zip.file(jsonName, JSON.stringify(exportPackage, null, 2));

  // README
  zip.file('README.txt', buildReadme(exportPackage));

  // Document attachments
  const docsFolder = zip.folder('documents');
  if (docsFolder) {
    for (const doc of documents) {
      const uri = resolveDocumentUri(doc);
      if (!uri) continue;
      try {
        const fileRef = new File(uri);
        const base64 = await fileRef.base64();
        const ext = guessExtension(uri, doc.typeLabel);
        const safeName = slugify(doc.title);
        docsFolder.file(`${doc.id}-${safeName}.${ext}`, base64, { base64: true });
      } catch {
        // File unreadable or moved — skip silently
      }
    }
  }

  // Asset photos
  const assetPhotosFolder = zip.folder('photos/assets');
  if (assetPhotosFolder) {
    for (const asset of assets) {
      if (!asset.photoUri || !isLocalUri(asset.photoUri)) continue;
      try {
        const fileRef = new File(asset.photoUri);
        const base64 = await fileRef.base64();
        const ext = guessExtension(asset.photoUri, 'photo');
        const safeName = slugify(asset.name);
        assetPhotosFolder.file(`${asset.id}-${safeName}.${ext}`, base64, { base64: true });
      } catch {
        // skip
      }
    }
  }

  // Room photos
  const roomPhotosFolder = zip.folder('photos/rooms');
  if (roomPhotosFolder) {
    for (const room of rooms) {
      if (!room.photoUri || !isLocalUri(room.photoUri)) continue;
      try {
        const fileRef = new File(room.photoUri);
        const base64 = await fileRef.base64();
        const ext = guessExtension(room.photoUri, 'photo');
        const safeName = slugify(room.name);
        roomPhotosFolder.file(`${room.id}-${safeName}.${ext}`, base64, { base64: true });
      } catch {
        // skip
      }
    }
  }

  const zipBytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  const zipName = exportFileName.replace(/\.json$/, '') + '.zip';
  const zipFile = new File(Paths.cache, zipName);
  zipFile.write(zipBytes);

  return zipFile;
}

function resolveDocumentUri(doc: DocumentListItem): string | null {
  if (doc.attachment?.storageKind === 'app_copy' && doc.attachment.storedUri) {
    return doc.attachment.storedUri;
  }
  if (doc.filePath && isLocalUri(doc.filePath)) {
    return doc.filePath;
  }
  return null;
}

function isLocalUri(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('/');
}

function guessExtension(uri: string, typeLabel: string): string {
  const uriExt = uri.split('.').pop()?.toLowerCase().split('?')[0];
  if (uriExt && /^[a-z0-9]{1,5}$/.test(uriExt)) return uriExt;
  const lowerType = typeLabel.toLowerCase();
  if (lowerType.includes('pdf')) return 'pdf';
  if (lowerType.includes('photo') || lowerType.includes('image')) return 'jpg';
  return 'file';
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function buildReadme(pkg: HomeVaultExportPackage): string {
  const { property, recordCounts, generatedAt } = pkg.manifest;
  const date = new Date(generatedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return [
    'HomeVault Backup Archive',
    '========================',
    '',
    `Property : ${property.label}`,
    `Generated: ${date}`,
    '',
    'Contents',
    '--------',
    '  backup.json            — Full backup (records + manifest)',
    '  documents/             — App-owned document attachment files',
    '  photos/assets/         — Asset photos',
    '  photos/rooms/          — Room photos',
    '',
    'Record counts',
    '-------------',
    `  Rooms & areas    : ${recordCounts.rooms}`,
    `  Assets           : ${recordCounts.assets}`,
    `  Documents        : ${recordCounts.documents}`,
    `  Maintenance tasks: ${recordCounts.tasks}`,
    `  Service history  : ${recordCounts.taskCompletions}`,
    `  Repair events    : ${recordCounts.repairEvents}`,
    '',
    'Restore',
    '-------',
    'To restore from the JSON backup, open HomeVault → Household →',
    'Export manifest → Validate backup, then choose the .json file',
    'from this archive.',
    '',
    'File attachments in documents/ and photos/ are included for',
    'archival. Copy them back to your device before restoring if',
    'you need them accessible in the app.',
  ].join('\n');
}
