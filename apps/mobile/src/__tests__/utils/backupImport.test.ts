import JSZip from 'jszip';

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///documents/',
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: { Base64: 'base64' },
}));

import { buildRestoreSnapshot, inspectBackupAsset } from '../../utils/backupImport';

describe('backupImport', () => {
  async function buildArchiveBuffer() {
    const backupPackage = {
      manifest: {
        app: 'HomeVault',
        version: 1,
        property: { id: 'property-1', label: 'Test Home', type: 'single_family' },
        generatedAt: '2026-06-23T12:00:00.000Z',
        recordCounts: {
          rooms: 1,
          assets: 1,
          documents: 1,
          tasks: 0,
          taskCompletions: 0,
          repairEvents: 0,
          parts: 0,
        },
        coverage: {
          activeTaskCount: 0,
          attachedDocumentCount: 1,
          linkedDocumentCount: 1,
          documentedAssetCount: 1,
          repairEventsWithCostCount: 0,
        },
        checklist: [],
      },
      attachments: [
        {
          documentId: 'document-1',
          title: 'Manual',
          filePath: 'file:///documents/homevault-documents/manual.pdf',
          linkedRecordIds: ['asset-1'],
          storageKind: 'app_copy',
          type: 'manual',
        },
      ],
      records: {
        property: {
          id: 'property-1',
          householdId: 'household-1',
          label: 'Test Home',
          type: 'single_family',
          photoUri: 'file:///documents/homevault-assets/property-1.jpg',
        },
        rooms: [
          {
            id: 'room-1',
            propertyId: 'property-1',
            name: 'Basement',
            type: 'room',
            photoUri: 'file:///documents/homevault-assets/room-1.jpg',
          },
        ],
        assets: [
          {
            id: 'asset-1',
            propertyId: 'property-1',
            roomId: 'room-1',
            name: 'Water heater',
            category: 'Appliance',
            status: 'ready',
            photoUri: 'file:///documents/homevault-assets/asset-1.jpg',
          },
        ],
        documents: [
          {
            id: 'document-1',
            propertyId: 'property-1',
            title: 'Manual',
            type: 'manual',
            linkedRecordIds: ['asset-1'],
            filePath: 'file:///documents/homevault-documents/manual.pdf',
            attachment: {
              storageKind: 'app_copy',
              storedUri: 'file:///documents/homevault-documents/manual.pdf',
              attachedAt: '2026-06-23T12:00:00.000Z',
              fileName: 'manual.pdf',
              mimeType: 'application/pdf',
            },
          },
        ],
        tasks: [],
        taskCompletions: [],
        repairEvents: [],
        parts: [],
      },
    };

    const zip = new JSZip();
    zip.file('homevault-test-home-2026-06-23.json', JSON.stringify(backupPackage));
    zip.file('photos/property/property-1-test-home.jpg', 'property-photo');
    zip.file('documents/document-1-manual.pdf', 'manual-bytes');
    zip.file('photos/assets/asset-1-water-heater.jpg', 'asset-photo');
    zip.file('photos/rooms/room-1-basement.jpg', 'room-photo');

    return zip.generateAsync({ type: 'arraybuffer' });
  }

  it('inspects zip backups and reports bundled file counts', async () => {
    const archiveBuffer = await buildArchiveBuffer();

    const result = await inspectBackupAsset({
      file: {
        arrayBuffer: async () => archiveBuffer,
      },
      name: 'backup.zip',
      uri: 'file:///tmp/backup.zip',
    });

    expect(result.ok).toBe(true);
    if (!result.ok || !('backup' in result) || result.backup.sourceKind !== 'zip') {
      throw new Error('Expected a validated zip backup.');
    }

    expect(result.backup.documentFileCount).toBe(1);
    expect(result.backup.propertyPhotoCount).toBe(1);
    expect(result.backup.assetPhotoCount).toBe(1);
    expect(result.backup.roomPhotoCount).toBe(1);
    expect(result.backup.warnings).toEqual([]);
  });

  it('rebuilds app-owned document files and photos from a zip restore', async () => {
    const archiveBuffer = await buildArchiveBuffer();
    const inspected = await inspectBackupAsset({
      file: {
        arrayBuffer: async () => archiveBuffer,
      },
      name: 'backup.zip',
      uri: 'file:///tmp/backup.zip',
    });

    if (!inspected.ok || !('backup' in inspected) || inspected.backup.sourceKind !== 'zip') {
      throw new Error('Expected a validated zip backup.');
    }

    const snapshot = await buildRestoreSnapshot(inspected.backup);

    expect(snapshot.properties[0]?.photoUri).toContain('homevault-assets/property-1-test-home');
    expect(snapshot.documents[0]?.filePath).toContain('homevault-documents/document-1-manual');
    expect(snapshot.documents[0]?.attachment?.storedUri).toContain(
      'homevault-documents/document-1-manual',
    );
    expect(snapshot.assets[0]?.photoUri).toContain('homevault-assets/asset-1-water-heater');
    expect(snapshot.rooms[0]?.photoUri).toContain('homevault-assets/room-1-basement');
  });
});
