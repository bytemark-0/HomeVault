import type { HomeVaultSnapshot } from '../../packages/database/src';
import { buildHomeVaultExportPackage } from '../../packages/export/src';

export const sampleBackupGeneratedAt = '2026-06-13T12:00:00.000Z';

export const currentSnapshot = createSnapshot('current', 'Current home');
export const backupSnapshot = createSnapshot('backup', 'Backup home');

export function buildPackage(snapshot: HomeVaultSnapshot, generatedAt = sampleBackupGeneratedAt) {
  const [property] = snapshot.properties;

  if (!property) {
    throw new Error('Test snapshot must include a property.');
  }

  return buildHomeVaultExportPackage({
    property,
    assets: snapshot.assets,
    documents: snapshot.documents,
    accessItems: snapshot.accessItems,
    emergencyContacts: snapshot.emergencyContacts,
    importantAccounts: snapshot.importantAccounts,
    continuityPlaybooks: snapshot.continuityPlaybooks,
    parts: snapshot.parts ?? [],
    repairEvents: snapshot.repairEvents,
    rooms: snapshot.rooms,
    taskCompletions: snapshot.taskCompletions,
    tasks: snapshot.tasks,
    generatedAt,
  });
}

function createSnapshot(id: string, label: string): HomeVaultSnapshot {
  const propertyId = `property-${id}`;
  const assetId = `asset-${id}`;
  const roomId = `room-${id}`;
  const documentId = `document-${id}`;
  const taskId = `task-${id}`;

  return {
    properties: [
      {
        id: propertyId,
        householdId: `household-${id}`,
        label,
        type: 'single_family',
        yearBuilt: 2001,
      },
    ],
    rooms: [
      {
        id: roomId,
        propertyId,
        name: 'Kitchen',
        type: 'room',
      },
    ],
    assets: [
      {
        id: assetId,
        propertyId,
        roomId,
        name: 'Dishwasher',
        category: 'Appliance',
        brand: 'Bosch',
        serial: `SN-${id}`,
        status: 'ready',
      },
    ],
    documents: [
      {
        id: documentId,
        propertyId,
        title: 'Dishwasher receipt',
        type: 'receipt',
        filePath: `/receipts/${id}.pdf`,
        linkedRecordIds: [assetId],
      },
      {
        id: `document-shutoff-${id}`,
        propertyId,
        title: 'Water shutoff map',
        type: 'photo',
        filePath: `/maps/${id}-water-shutoff.jpg`,
        linkedRecordIds: [assetId],
      },
    ],
    accessItems: [
      {
        id: `access-${id}`,
        propertyId,
        category: 'wifi',
        label: 'Main Wi-Fi',
        accessCode: '9274',
        location: 'Utility shelf',
        instructions: 'Use the top button after entering the code.',
        linkedDocumentIds: [documentId],
      },
      {
        id: `access-shutoff-${id}`,
        propertyId,
        category: 'utility_shutoff',
        label: 'Main water shutoff',
        location: 'Garage south wall',
        instructions: 'Turn clockwise until water stops, then open the utility sink faucet to verify.',
        linkedAssetId: assetId,
        linkedDocumentIds: [`document-shutoff-${id}`],
      },
      {
        id: `access-entry-${id}`,
        propertyId,
        category: 'entry_note',
        label: 'Side gate entry note',
        location: 'Left gate by the driveway',
        instructions: 'Open the gate before unlatching the mudroom door.',
        linkedDocumentIds: [],
      },
    ],
    emergencyContacts: [
      {
        id: `contact-${id}`,
        propertyId,
        name: 'Jamie Lee',
        role: 'Neighbor',
        priority: 'primary',
        phone: '555-0101',
      },
    ],
    importantAccounts: [
      {
        id: `account-${id}`,
        propertyId,
        kind: 'insurance',
        providerName: 'Prairie Mutual',
        label: 'Home policy',
        accountNumber: `POL-${id}`,
        mfaEnabled: true,
        recoveryCodesStored: true,
        managedInPasswordManager: true,
        recoveryNotes: 'Claim documents are in the fire safe.',
        linkedDocumentIds: [documentId],
      },
    ],
    continuityPlaybooks: [
      {
        id: `playbook-${id}`,
        propertyId,
        category: 'emergency',
        title: 'Water leak response',
        state: 'ready',
        steps: [
          {
            id: `playbook-step-${id}`,
            label: 'Shut off the main water valve',
            isRequired: true,
            isComplete: false,
          },
        ],
        linkedRecordIds: [documentId],
      },
    ],
    tasks: [
      {
        id: taskId,
        propertyId,
        scope: 'asset',
        scopeId: assetId,
        title: 'Clean dishwasher filter',
        dueDate: '2026-06-01',
        recurrenceKind: 'interval',
        recurrenceLabel: 'Monthly',
        state: 'completed',
      },
    ],
    taskCompletions: [
      {
        id: `completion-${id}`,
        taskId,
        completedAt: '2026-06-02T13:00:00.000Z',
        costCents: 0,
      },
    ],
    repairEvents: [
      {
        id: `repair-${id}`,
        propertyId,
        assetId,
        issue: 'Leaking supply line',
        resolution: 'Replaced hose',
        costCents: 4200,
        date: '2026-05-15',
        documentIds: [documentId],
      },
    ],
    parts: [],
  };
}
