import {
  buildHomeVaultExportPackage,
  formatHomeVaultExportPackage,
  type HomeVaultExportPackage,
} from '@homevault/export';
import type { HomeVaultSnapshot } from '@homevault/database';

const sampleBackupGeneratedAt = '2026-06-13T12:00:00.000Z';

const sampleBackupSnapshot: HomeVaultSnapshot = {
  properties: [
    {
      id: 'property-backup',
      householdId: 'household-backup',
      label: 'Backup home',
      type: 'single_family',
      yearBuilt: 2001,
    },
  ],
  rooms: [
    {
      id: 'room-backup',
      propertyId: 'property-backup',
      name: 'Kitchen',
      type: 'room',
    },
  ],
  assets: [
    {
      id: 'asset-backup',
      propertyId: 'property-backup',
      roomId: 'room-backup',
      name: 'Dishwasher',
      category: 'Appliance',
      brand: 'Bosch',
      serial: 'SN-backup',
      status: 'ready',
    },
  ],
  documents: [
    {
      id: 'document-backup',
      propertyId: 'property-backup',
      title: 'Dishwasher receipt',
      type: 'receipt',
      filePath: '/receipts/backup.pdf',
      linkedRecordIds: ['asset-backup'],
    },
    {
      id: 'document-shutoff-backup',
      propertyId: 'property-backup',
      title: 'Water shutoff map',
      type: 'photo',
      filePath: '/maps/backup-water-shutoff.jpg',
      linkedRecordIds: ['asset-backup'],
    },
  ],
  accessItems: [
    {
      id: 'access-backup',
      propertyId: 'property-backup',
      category: 'wifi',
      label: 'Main Wi-Fi',
      accessCode: '9274',
      location: 'Utility shelf',
      instructions: 'Use the top button after entering the code.',
      linkedDocumentIds: ['document-backup'],
    },
    {
      id: 'access-shutoff-backup',
      propertyId: 'property-backup',
      category: 'utility_shutoff',
      label: 'Main water shutoff',
      location: 'Garage south wall',
      instructions: 'Turn clockwise until water stops, then open the utility sink faucet to verify.',
      linkedAssetId: 'asset-backup',
      linkedDocumentIds: ['document-shutoff-backup'],
    },
    {
      id: 'access-entry-backup',
      propertyId: 'property-backup',
      category: 'entry_note',
      label: 'Side gate entry note',
      location: 'Left gate by the driveway',
      instructions: 'Open the gate before unlatching the mudroom door.',
      linkedDocumentIds: [],
    },
  ],
  emergencyContacts: [
    {
      id: 'contact-backup',
      propertyId: 'property-backup',
      name: 'Jamie Lee',
      role: 'Neighbor',
      priority: 'primary',
      phone: '555-0101',
    },
  ],
  importantAccounts: [
    {
      id: 'account-backup',
      propertyId: 'property-backup',
      kind: 'insurance',
      providerName: 'Prairie Mutual',
      label: 'Home policy',
      accountNumber: 'POL-backup',
      mfaEnabled: true,
      recoveryCodesStored: true,
      managedInPasswordManager: true,
      recoveryNotes: 'Claim documents are in the fire safe.',
      linkedDocumentIds: ['document-backup'],
    },
  ],
  continuityPlaybooks: [
    {
      id: 'playbook-backup',
      propertyId: 'property-backup',
      category: 'emergency',
      title: 'Water leak response',
      state: 'ready',
      steps: [
        {
          id: 'playbook-step-backup',
          label: 'Shut off the main water valve',
          isRequired: true,
          isComplete: false,
        },
      ],
      linkedRecordIds: ['document-backup'],
    },
  ],
  tasks: [
    {
      id: 'task-backup',
      propertyId: 'property-backup',
      scope: 'asset',
      scopeId: 'asset-backup',
      title: 'Clean dishwasher filter',
      dueDate: '2026-06-01',
      recurrenceKind: 'interval',
      recurrenceLabel: 'Monthly',
      state: 'completed',
    },
  ],
  taskCompletions: [
    {
      id: 'completion-backup',
      taskId: 'task-backup',
      completedAt: '2026-06-02T13:00:00.000Z',
      costCents: 0,
    },
  ],
  repairEvents: [
    {
      id: 'repair-backup',
      propertyId: 'property-backup',
      assetId: 'asset-backup',
      issue: 'Leaking supply line',
      resolution: 'Replaced hose',
      costCents: 4200,
      date: '2026-05-15',
      documentIds: ['document-backup'],
    },
  ],
  parts: [],
};

const [property] = sampleBackupSnapshot.properties;

if (!property) {
  throw new Error('Sample backup snapshot must include a property.');
}

export const sampleBackupPackage: HomeVaultExportPackage = JSON.parse(
  formatHomeVaultExportPackage(
    buildHomeVaultExportPackage({
      property,
      assets: sampleBackupSnapshot.assets,
      documents: sampleBackupSnapshot.documents,
      accessItems: sampleBackupSnapshot.accessItems,
      emergencyContacts: sampleBackupSnapshot.emergencyContacts,
      importantAccounts: sampleBackupSnapshot.importantAccounts,
      continuityPlaybooks: sampleBackupSnapshot.continuityPlaybooks,
      parts: sampleBackupSnapshot.parts,
      repairEvents: sampleBackupSnapshot.repairEvents,
      rooms: sampleBackupSnapshot.rooms,
      taskCompletions: sampleBackupSnapshot.taskCompletions,
      tasks: sampleBackupSnapshot.tasks,
      generatedAt: sampleBackupGeneratedAt,
    }),
  ),
) as HomeVaultExportPackage;
