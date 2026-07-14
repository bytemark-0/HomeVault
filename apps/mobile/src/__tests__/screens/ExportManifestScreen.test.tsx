import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import {
  buildHomeVaultOfflineCompanionPack,
  buildHomeVaultItemShareBundle,
  formatHomeVaultOfflineCompanionPack,
  formatHomeVaultItemShareBundle,
} from '@homevault/export';

import { ExportManifestScreen } from '../../screens/ExportManifestScreen';

const mockConfirmLocalStepUp = jest.fn();
const mockFileWrite = jest.fn();
const mockIsAvailableAsync = jest.fn();
const mockShareAsync = jest.fn();

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  File: class MockFile {
    uri = 'file:///tmp/mock-export.txt';

    write(...args: unknown[]) {
      return mockFileWrite(...args);
    }
  },
  Paths: { cache: '/tmp' },
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: (...args: unknown[]) => mockIsAvailableAsync(...args),
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));

jest.mock('../../utils/exportZip', () => ({
  shareZipExport: jest.fn(),
}));

jest.mock('../../utils/localStepUpAuth', () => ({
  confirmLocalStepUp: (...args: unknown[]) => mockConfirmLocalStepUp(...args),
}));

jest.mock('../../utils/emergencyPacketExport', () => ({
  createEmergencyPacketFileName: jest.fn(() => 'homevault-emergency-packet.txt'),
  formatEmergencyPacketText: jest.fn(() => 'Emergency packet text'),
  printEmergencyPacket: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/offlineCompanionPackExport', () => ({
  createOfflineCompanionPackFileName: jest
    .fn()
    .mockImplementation((pack: { target: { key: string } }) =>
      pack.target.key === 'primary_user'
        ? 'homevault-offline-companion-primary.json'
        : 'homevault-offline-companion-helper.json',
    ),
}));

jest.mock('../../utils/trustedShareExport', () => ({
  createTrustedShareFileName: jest.fn(() => 'homevault-trusted-share.txt'),
  formatTrustedShareText: jest.fn(() => 'Trusted share text'),
}));

const DocumentPicker = require('expo-document-picker');
const { printEmergencyPacket } = require('../../utils/emergencyPacketExport');

describe('ExportManifestScreen', () => {
  const property = {
    id: 'property-1',
    householdId: 'household-1',
    label: 'Oak Street home',
    type: 'single_family' as const,
  };

  const baseProps = {
    property,
    assets: [],
    documents: [],
    accessItems: [],
    emergencyContacts: [],
    importantAccounts: [],
    continuityPlaybooks: [],
    parts: [],
    repairEvents: [],
    rooms: [],
    taskCompletions: [],
    tasks: [],
    onBackupCreated: jest.fn(),
    onBack: jest.fn(),
    onFixPress: jest.fn(),
    onRestoreBackup: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirmLocalStepUp.mockResolvedValue(true);
    mockIsAvailableAsync.mockResolvedValue(true);
    mockShareAsync.mockResolvedValue(undefined);
  });

  it('shows a clear not-homevault warning for invalid backup files', async () => {
    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          name: 'notes.json',
          uri: 'file:///tmp/notes.json',
          file: {
            text: async () => JSON.stringify({ note: 'not a backup package' }),
          },
        },
      ],
    });

    const { getAllByText, getByText } = await render(<ExportManifestScreen {...baseProps} />);

    await act(async () => {
      fireEvent.press(getByText('Choose backup'));
    });

    await waitFor(() =>
      expect(
        getByText(
          'This file does not appear to be a HomeVault backup. Choose a file exported from the HomeVault app.',
        ),
      ).toBeTruthy(),
    );
    expect(getByText('Needs attention before continuing.')).toBeTruthy();
  });

  it('warns that restore will replace local records before restoring', async () => {
    const { getByText } = await render(
      <ExportManifestScreen {...baseProps} />,
    );

    await act(async () => {
      fireEvent.press(getByText('Load sample'));
    });

    await waitFor(() =>
      expect(getByText('Backup package is ready to restore.')).toBeTruthy(),
    );
    await waitFor(() =>
      expect(getByText('Restore will overwrite this preview')).toBeTruthy(),
    );
    expect(
      getByText(
        'Current rooms, assets, documents, tasks, service history, and repairs will be replaced with the validated backup package.',
      ),
    ).toBeTruthy();
    expect(getByText('Type RESTORE to enable restore.')).toBeTruthy();
  });

  it('previews received shared bundles as read-only with provenance details', async () => {
    const bundle = buildHomeVaultItemShareBundle({
      property: {
        id: property.id,
        label: property.label,
        type: property.type,
      },
      senderLabel: 'Jamie Lee',
      audience: {
        key: 'emergency_helper',
        label: 'Emergency helper',
      },
      items: [
        {
          recordType: 'document',
          recordId: 'document-1',
          label: 'Water shutoff map',
          linkedRecordIds: ['asset-1'],
          includedFieldIds: ['date'],
          omittedFieldIds: ['ocrText'],
        },
      ],
      encryption: {
        scheme: 'aes-256-gcm',
        keyDerivation: 'pbkdf2-sha256',
        iterations: 150000,
        saltBase64: 'salt',
        ivBase64: 'iv',
        ciphertextBase64: 'ciphertext',
      },
    });
    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          name: 'shared-bundle.json',
          uri: 'file:///tmp/shared-bundle.json',
          file: {
            text: async () => formatHomeVaultItemShareBundle(bundle),
          },
        },
      ],
    });

    const { getByText, queryByText } = await render(<ExportManifestScreen {...baseProps} />);

    await act(async () => {
      fireEvent.press(getByText('Choose shared bundle'));
    });

    await waitFor(() =>
      expect(getByText('Shared bundle is ready to review.')).toBeTruthy(),
    );
    expect(getByText('Read-only bundle')).toBeTruthy();
    expect(getByText('Jamie Lee')).toBeTruthy();
    expect(getByText('Emergency helper')).toBeTruthy();
    expect(getByText('Water shutoff map')).toBeTruthy();
    expect(queryByText('ciphertext')).toBeNull();
    expect(queryByText('salt')).toBeNull();
    expect(queryByText('iv')).toBeNull();
    expect(queryByText('date')).toBeNull();
    expect(queryByText('ocrText')).toBeNull();
  });

  it('flags expired shared bundles and nudges rotation for risky record types', async () => {
    const bundle = buildHomeVaultItemShareBundle({
      property: {
        id: property.id,
        label: property.label,
        type: property.type,
      },
      senderLabel: 'Jamie Lee',
      audience: {
        key: 'house_sitter',
        label: 'House sitter',
      },
      generatedAt: '2000-01-01T00:00:00.000Z',
      expiresAt: '2000-01-02T00:00:00.000Z',
      items: [
        {
          recordType: 'access_item',
          recordId: 'access-1',
          label: 'Garage keypad',
          linkedRecordIds: [],
          includedFieldIds: ['location'],
          omittedFieldIds: ['notes'],
        },
      ],
      encryption: {
        scheme: 'aes-256-gcm',
        keyDerivation: 'pbkdf2-sha256',
        iterations: 150000,
        saltBase64: 'salt',
        ivBase64: 'iv',
        ciphertextBase64: 'ciphertext',
      },
    });
    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          name: 'expired-shared-bundle.json',
          uri: 'file:///tmp/expired-shared-bundle.json',
          file: {
            text: async () => formatHomeVaultItemShareBundle(bundle),
          },
        },
      ],
    });

    const { getAllByText, getByText } = await render(<ExportManifestScreen {...baseProps} />);

    await act(async () => {
      fireEvent.press(getByText('Choose shared bundle'));
    });

    await waitFor(() =>
      expect(getByText('Expiry warning')).toBeTruthy(),
    );
    expect(
      getByText('This shared bundle has expired. Ask the sender for a fresh handoff before you rely on it.'),
    ).toBeTruthy();
    expect(
      getByText(
        'Rotate any shared codes or recovery details before reusing them after this temporary access window.',
      ),
    ).toBeTruthy();
  });

  it('shows a sensitive-data warning when continuity records are present', async () => {
    const { getByText } = await render(
      <ExportManifestScreen
        {...baseProps}
        accessItems={[
          {
            id: 'access-1',
            propertyId: property.id,
            category: 'wifi',
            label: 'Main Wi-Fi',
            accessCode: '9274',
            linkedDocumentIds: [],
          },
        ]}
        emergencyContacts={[
          {
            id: 'contact-1',
            propertyId: property.id,
            name: 'Jamie Lee',
            role: 'Neighbor',
            priority: 'primary',
            phone: '555-0101',
          },
        ]}
        importantAccounts={[
          {
            id: 'account-1',
            propertyId: property.id,
            kind: 'insurance',
            providerName: 'Prairie Mutual',
            label: 'Home policy',
            accountNumber: 'POL-1234',
            linkedDocumentIds: [],
          },
        ]}
      />,
    );

    expect(getByText('Sensitive information included')).toBeTruthy();
    expect(
      getByText(
        'Sensitive household details included: 1 access item, 1 emergency contact, 1 important account. Anyone with this backup can read those details.',
      ),
    ).toBeTruthy();
    expect(
      getByText(
        'If you export or print an emergency packet, any included access codes, locations, and recovery notes will appear in full.',
      ),
    ).toBeTruthy();
    expect(getByText('Sensitive-actions PIN fallback')).toBeTruthy();
    expect(
      getByText(
        'High-risk reveals and exports request biometric or device-auth verification when this device supports it. If that verification is unavailable in this preview, HomeVault falls back to a local confirmation prompt on this device.',
      ),
    ).toBeTruthy();
  });

  it('previews physical continuity details in the emergency packet section', async () => {
    const { getByText } = await render(
      <ExportManifestScreen
        {...baseProps}
        assets={[
          {
            id: 'asset-1',
            propertyId: property.id,
            name: 'Main water valve',
            category: 'Plumbing',
            status: 'ready',
            roomName: 'Garage',
            documentCount: 1,
            lastServiceLabel: 'Never',
            nextTaskLabel: 'No open tasks',
            warrantyExpiringSoon: false,
          },
        ]}
        documents={[
          {
            id: 'document-1',
            propertyId: property.id,
            title: 'Water shutoff map',
            type: 'photo',
            typeLabel: 'Photo',
            linkedToLabel: 'Main water valve',
            dateLabel: 'Jul 1, 2026',
            linkedRecords: [{ id: 'asset-1', label: 'Main water valve', kind: 'asset' }],
            linkedRecordIds: ['asset-1'],
          },
        ]}
        accessItems={[
          {
            id: 'access-1',
            propertyId: property.id,
            category: 'utility_shutoff',
            label: 'Main water shutoff',
            location: 'Garage south wall',
            instructions: 'Turn clockwise until water stops.',
            linkedAssetId: 'asset-1',
            linkedDocumentIds: ['document-1'],
          },
        ]}
      />,
    );

    expect(getByText('Emergency packet preview')).toBeTruthy();
    expect(getByText('Main water shutoff')).toBeTruthy();
    expect(getByText('Equipment: Main water valve')).toBeTruthy();
    expect(getByText('Documents: Water shutoff map')).toBeTruthy();
  });

  it('shows packet validation guidance when no emergency-ready records exist', async () => {
    const { getAllByText, getByText } = await render(<ExportManifestScreen {...baseProps} />);

    expect(
      getByText(
        'Add at least one access record, emergency contact, insurance account, key device, or recovery note before exporting a packet.',
      ),
    ).toBeTruthy();
    expect(
      getByText('Add at least one emergency-ready record before exporting a packet.'),
    ).toBeTruthy();
    expect(
      getByText(
        'The selected sections do not have saved records yet. Pick a different section or add records first.',
      ),
    ).toBeTruthy();
  });

  it('explains that trusted sharing is a static v1 handoff', async () => {
    const { getAllByText, getByText } = await render(<ExportManifestScreen {...baseProps} />);

    expect(getByText('Trusted-share handoff')).toBeTruthy();
    expect(getAllByText('Offline companion pack').length).toBeGreaterThan(0);
    expect(getByText('Static and read-only by design')).toBeTruthy();
    expect(getByText('Helper device')).toBeTruthy();
    expect(
      getByText(
        'Reuses the emergency-contact handoff scope so a helper can act during an incident without receiving unrelated records.',
      ),
    ).toBeTruthy();
    expect(getByText('Static handoff, not live access')).toBeTruthy();
    expect(getByText('Medium sensitivity')).toBeTruthy();
    expect(getAllByText('High sensitivity').length).toBeGreaterThan(0);
    expect(
      getByText(
        'Trusted share v1 is a document-based handoff from this device. It is not live collaborative access and it will not stay up to date after you send it.',
      ),
    ).toBeTruthy();
    expect(
      getByText(
        'Emergency packets can reveal codes, contacts, and recovery notes in full so someone can act under stress.',
      ),
    ).toBeTruthy();
    expect(getByText('Export choices')).toBeTruthy();
    expect(getByText('Trusted share')).toBeTruthy();
  });

  it('shares a primary offline companion pack after local step-up confirmation on native', async () => {
    const { getByText } = await render(
      <ExportManifestScreen
        {...baseProps}
        accessItems={[
          {
            id: 'access-1',
            propertyId: property.id,
            category: 'wifi',
            label: 'Main Wi-Fi',
            accessCode: '9274',
            linkedDocumentIds: [],
          },
        ]}
        emergencyContacts={[
          {
            id: 'contact-1',
            propertyId: property.id,
            name: 'Jamie Lee',
            role: 'Neighbor',
            priority: 'primary',
            phone: '555-0101',
          },
        ]}
      />,
    );

    await act(async () => {
      fireEvent.press(getByText('Share primary copy'));
    });

    await waitFor(() =>
      expect(mockConfirmLocalStepUp).toHaveBeenCalledWith(
        expect.objectContaining({
          alertTitle: 'Share sensitive offline companion pack?',
          confirmLabel: 'Share',
          authPromptMessage: 'Authenticate to share offline companion for Primary user device',
        }),
      ),
    );
    await waitFor(() => expect(mockShareAsync).toHaveBeenCalled());
    expect(mockFileWrite).toHaveBeenCalledWith(
      expect.stringContaining('"kind": "offline_companion_pack"'),
    );
    expect(getByText('Primary-user offline companion shared successfully.')).toBeTruthy();
  });

  it('downloads the helper offline companion pack on web without unrelated records messaging', async () => {
    const platformDescriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');
    const originalBlob = global.Blob;
    const originalURL = global.URL;
    const originalDocument = global.document;
    const createObjectURL = jest.fn(() => 'blob:offline-helper');
    const revokeObjectURL = jest.fn();
    const appendChild = jest.fn();
    const remove = jest.fn();
    const click = jest.fn();

    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
    (global as typeof globalThis & { Blob?: typeof Blob }).Blob =
      originalBlob ?? class MockBlob {};
    (global as typeof globalThis & { URL?: unknown }).URL = {
      createObjectURL,
      revokeObjectURL,
    };
    (global as typeof globalThis & { document?: Document }).document = {
      body: { appendChild },
      createElement: () =>
        ({
          click,
          download: '',
          href: '',
          remove,
          style: {},
        }) as HTMLAnchorElement,
    } as unknown as Document;

    try {
      const { getByText } = await render(
        <ExportManifestScreen
          {...baseProps}
          accessItems={[
            {
              id: 'access-1',
              propertyId: property.id,
              category: 'wifi',
              label: 'Main Wi-Fi',
              accessCode: '9274',
              linkedDocumentIds: [],
            },
          ]}
          emergencyContacts={[
            {
              id: 'contact-1',
              propertyId: property.id,
              name: 'Jamie Lee',
              role: 'Neighbor',
              priority: 'primary',
              phone: '555-0101',
            },
          ]}
        />,
      );

      await act(async () => {
        fireEvent.press(getByText('Download helper copy'));
      });

      expect(createObjectURL).toHaveBeenCalled();
      expect(getByText('homevault-offline-companion-helper.json was downloaded.')).toBeTruthy();
      expect(
        getByText(
          'Reuses the emergency-contact handoff scope so a helper can act during an incident without receiving unrelated records.',
        ),
      ).toBeTruthy();
    } finally {
      if (platformDescriptor) {
        Object.defineProperty(Platform, 'OS', platformDescriptor);
      }
      if (originalBlob) {
        (global as typeof globalThis & { Blob?: typeof Blob }).Blob = originalBlob;
      }
      if (originalURL) {
        (global as typeof globalThis & { URL?: typeof URL }).URL = originalURL;
      }
      if (originalDocument) {
        (global as typeof globalThis & { document?: Document }).document = originalDocument;
      }
    }
  });

  it('previews received offline companion packs with omission and provenance details', async () => {
    const pack = buildHomeVaultOfflineCompanionPack(
      {
        property,
        assets: [],
        documents: [],
        accessItems: [
          {
            id: 'access-1',
            propertyId: property.id,
            category: 'wifi',
            label: 'Main Wi-Fi',
            accessCode: '9274',
            linkedDocumentIds: [],
          },
        ],
        emergencyContacts: [
          {
            id: 'contact-1',
            propertyId: property.id,
            name: 'Jamie Lee',
            role: 'Neighbor',
            priority: 'primary',
            phone: '555-0101',
          },
        ],
        importantAccounts: [],
        continuityPlaybooks: [],
        parts: [],
        repairEvents: [],
        rooms: [],
        taskCompletions: [],
        tasks: [],
      },
      { target: 'helper_device', generatedAt: '2026-07-10T12:00:00.000Z' },
    );

    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          name: 'offline-helper-pack.json',
          uri: 'file:///tmp/offline-helper-pack.json',
          file: {
            text: async () => formatHomeVaultOfflineCompanionPack(pack),
          },
        },
      ],
    });

    const { getAllByText, getByText } = await render(
      <ExportManifestScreen {...baseProps} />,
    );

    await act(async () => {
      fireEvent.press(getByText('Choose offline pack'));
    });

    await waitFor(() =>
      expect(getByText('Offline companion pack is ready to review.')).toBeTruthy(),
    );
    expect(getByText('Offline companion preview')).toBeTruthy();
    expect(getByText('Read-only rescue pack for Helper device. Review what is included, what is left out, and how recently it was generated before relying on it during an incident.')).toBeTruthy();
    expect(getAllByText('Oak Street home').length).toBeGreaterThan(0);
    expect(getByText('Read-only offline pack')).toBeTruthy();
    expect(getByText('Omitted')).toBeTruthy();
    expect(getByText(/trusted-share v1/)).toBeTruthy();
  });

  it('flags outdated or incomplete offline companion packs before use', async () => {
    const pack = buildHomeVaultOfflineCompanionPack(
      {
        property,
        assets: [],
        documents: [],
        accessItems: [
          {
            id: 'access-1',
            propertyId: property.id,
            category: 'wifi',
            label: 'Main Wi-Fi',
            accessCode: '9274',
            linkedDocumentIds: [],
          },
        ],
        emergencyContacts: [],
        importantAccounts: [],
        continuityPlaybooks: [],
        parts: [],
        repairEvents: [],
        rooms: [],
        taskCompletions: [],
        tasks: [],
      },
      { target: 'primary_user', generatedAt: '2000-01-01T00:00:00.000Z' },
    );

    DocumentPicker.getDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          name: 'old-offline-pack.json',
          uri: 'file:///tmp/old-offline-pack.json',
          file: {
            text: async () => formatHomeVaultOfflineCompanionPack(pack),
          },
        },
      ],
    });

    const malformedPack = JSON.parse(
      formatHomeVaultOfflineCompanionPack(pack),
    ) as Record<string, unknown>;
    delete malformedPack.sections;

    DocumentPicker.getDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          name: 'broken-offline-pack.json',
          uri: 'file:///tmp/broken-offline-pack.json',
          file: {
            text: async () => JSON.stringify(malformedPack),
          },
        },
      ],
    });

    const { getByText } = await render(<ExportManifestScreen {...baseProps} />);

    await act(async () => {
      fireEvent.press(getByText('Choose offline pack'));
    });

    await waitFor(() => expect(getByText('Receiver warnings')).toBeTruthy());
    expect(
      getByText(
        'This offline companion pack looks old. Confirm the sender has refreshed it after recent contact, code, or recovery-note changes.',
      ),
    ).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('Choose offline pack'));
    });

    await waitFor(() =>
      expect(
        getByText(
          'The offline companion pack is missing required rescue metadata or section summaries.',
        ),
      ).toBeTruthy(),
    );
    expect(getByText('Needs attention before using this rescue pack.')).toBeTruthy();
  });

  it('shows a trusted-handoff focus notice when opened from Emergency', async () => {
    const { getByText } = await render(
      <ExportManifestScreen {...baseProps} initialFocusSection="trusted-share" />,
    );

    expect(getByText('Trusted handoff shortcut')).toBeTruthy();
    expect(
      getByText(
        'You opened the selective handoff tools from Emergency. Review the audience and included sections before you share it.',
      ),
    ).toBeTruthy();
  });

  it('shows an emergency-packet focus notice when opened from a playbook', async () => {
    const { getByText } = await render(
      <ExportManifestScreen {...baseProps} initialFocusSection="packet" />,
    );

    expect(getByText('Emergency packet shortcut')).toBeTruthy();
    expect(
      getByText(
        'You opened the emergency packet tools from a recovery playbook. Use this packet when someone needs the core household details quickly.',
      ),
    ).toBeTruthy();
  });

  it('lets the user exclude a trusted-share section from the handoff', async () => {
    const { getByText } = await render(
      <ExportManifestScreen
        {...baseProps}
        importantAccounts={[
          {
            id: 'account-1',
            propertyId: property.id,
            kind: 'insurance',
            providerName: 'Prairie Mutual',
            label: 'Home policy',
            accountNumber: 'POL-1234',
            linkedDocumentIds: [],
          },
        ]}
      />,
    );

    expect(getByText('1 item ready')).toBeTruthy();
    expect(getByText('Preset for Spouse or partner')).toBeTruthy();
    expect(
      getByText('Recommended: Access info, Emergency contacts, Insurance, Key devices, Recovery notes'),
    ).toBeTruthy();

    await act(async () => {
      fireEvent.press(
        getByText('Claims contacts, policy references, and supporting paperwork.'),
      );
    });

    expect(
      getByText('Left out to avoid sharing unrelated household details.'),
    ).toBeTruthy();
    expect(getByText('Custom section changes are active for this handoff.')).toBeTruthy();
    expect(getByText('Use recommended sections again')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('Use recommended sections again'));
    });

    expect(getByText('Recommended preset is loaded.')).toBeTruthy();
  });

  it('loads the travel handoff preset with temporary-helper review guidance', async () => {
    const { getAllByText, getByText } = await render(<ExportManifestScreen {...baseProps} />);

    await act(async () => {
      fireEvent.press(
        getByText('Prepare a lighter temporary handoff before extended travel or planned absence.'),
      );
    });

    expect(getByText('Preset for Travel handoff')).toBeTruthy();
    expect(getAllByText('Use case: Temporary helper handoff').length).toBeGreaterThan(0);
    expect(getByText('Review before sharing')).toBeTruthy();
    expect(getByText('Insurance, Recovery notes')).toBeTruthy();
    expect(
      getByText('- Review entry notes, shutoff locations, and Wi-Fi details before you leave.'),
    ).toBeTruthy();
  });

  it('asks for confirmation before sharing sensitive backups', async () => {
    const { getByText } = await render(
      <ExportManifestScreen
        {...baseProps}
        accessItems={[
          {
            id: 'access-1',
            propertyId: property.id,
            category: 'wifi',
            label: 'Main Wi-Fi',
            accessCode: '9274',
            linkedDocumentIds: [],
          },
        ]}
      />,
    );

    await act(async () => {
      fireEvent.press(getByText('Share backup'));
    });

    expect(mockConfirmLocalStepUp).toHaveBeenCalledWith(
      expect.objectContaining({
        alertTitle: 'Share sensitive backup?',
        confirmLabel: 'Share',
        authPromptMessage: 'Authenticate to share backup JSON package',
      }),
    );
  });

  it('asks for confirmation before sharing a sensitive trusted handoff', async () => {
    const { getByText } = await render(
      <ExportManifestScreen
        {...baseProps}
        accessItems={[
          {
            id: 'access-1',
            propertyId: property.id,
            category: 'wifi',
            label: 'Main Wi-Fi',
            accessCode: '9274',
            linkedDocumentIds: [],
          },
        ]}
      />,
    );

    await act(async () => {
      fireEvent.press(getByText('Share handoff'));
    });

    expect(mockConfirmLocalStepUp).toHaveBeenCalledWith(
      expect.objectContaining({
        alertTitle: 'Share sensitive trusted handoff?',
        confirmLabel: 'Share',
        authPromptMessage: 'Authenticate to share trusted handoff for Spouse or partner',
      }),
    );
  });

  it('shares a sensitive trusted handoff after local step-up confirmation on native', async () => {
    const { getByText } = await render(
      <ExportManifestScreen
        {...baseProps}
        accessItems={[
          {
            id: 'access-1',
            propertyId: property.id,
            category: 'wifi',
            label: 'Main Wi-Fi',
            accessCode: '9274',
            linkedDocumentIds: [],
          },
        ]}
      />,
    );

    await act(async () => {
      fireEvent.press(getByText('Share handoff'));
    });

    await waitFor(() =>
      expect(mockConfirmLocalStepUp).toHaveBeenCalledWith(
        expect.objectContaining({
          alertTitle: 'Share sensitive trusted handoff?',
          confirmLabel: 'Share',
          authPromptMessage: 'Authenticate to share trusted handoff for Spouse or partner',
        }),
      ),
    );
    await waitFor(() => expect(mockShareAsync).toHaveBeenCalled());
    expect(mockFileWrite).toHaveBeenCalledWith('Trusted share text');
    expect(getByText('Trusted-share handoff shared successfully.')).toBeTruthy();
  });

  it('does not share a trusted handoff when local step-up verification is cancelled', async () => {
    mockConfirmLocalStepUp.mockResolvedValue(false);

    const { getByText } = await render(
      <ExportManifestScreen
        {...baseProps}
        accessItems={[
          {
            id: 'access-1',
            propertyId: property.id,
            category: 'wifi',
            label: 'Main Wi-Fi',
            accessCode: '9274',
            linkedDocumentIds: [],
          },
        ]}
      />,
    );

    await act(async () => {
      fireEvent.press(getByText('Share handoff'));
    });

    await waitFor(() => expect(mockConfirmLocalStepUp).toHaveBeenCalled());
    expect(mockShareAsync).not.toHaveBeenCalled();
    expect(getByText('Share a selective trusted-share handoff without the full backup package.')).toBeTruthy();
  });

  it('downloads the trusted handoff on web when selected sections have content', async () => {
    const platformDescriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');
    const originalBlob = global.Blob;
    const originalURL = global.URL;
    const originalDocument = global.document;
    const createObjectURL = jest.fn(() => 'blob:trusted-share');
    const revokeObjectURL = jest.fn();
    const appendChild = jest.fn();
    const remove = jest.fn();
    const click = jest.fn();

    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
    (global as typeof globalThis & { Blob?: typeof Blob }).Blob =
      originalBlob ?? class MockBlob {};
    (global as typeof globalThis & { URL?: unknown }).URL = {
      createObjectURL,
      revokeObjectURL,
    };
    (global as typeof globalThis & { document?: Document }).document = {
      body: { appendChild },
      createElement: () =>
        ({
          click,
          download: '',
          href: '',
          remove,
          style: {},
        }) as HTMLAnchorElement,
    } as unknown as Document;

    try {
      const { getByText } = await render(
        <ExportManifestScreen
          {...baseProps}
          accessItems={[
            {
              id: 'access-1',
              propertyId: property.id,
              category: 'wifi',
              label: 'Main Wi-Fi',
              accessCode: '9274',
              linkedDocumentIds: [],
            },
          ]}
        />,
      );

      await act(async () => {
        fireEvent.press(getByText('Download handoff'));
      });

      expect(createObjectURL).toHaveBeenCalled();
      expect(getByText('homevault-trusted-share.txt was downloaded.')).toBeTruthy();
    } finally {
      if (platformDescriptor) {
        Object.defineProperty(Platform, 'OS', platformDescriptor);
      }
      if (originalBlob) {
        (global as typeof globalThis & { Blob?: typeof Blob }).Blob = originalBlob;
      }
      if (originalURL) {
        (global as typeof globalThis & { URL?: typeof URL }).URL = originalURL;
      }
      if (originalDocument) {
        (global as typeof globalThis & { document?: Document }).document = originalDocument;
      }
    }
  });

  it('downloads the emergency packet on web when emergency-ready records exist', async () => {
    const platformDescriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');
    const originalBlob = global.Blob;
    const originalURL = global.URL;
    const originalDocument = global.document;
    const createObjectURL = jest.fn(() => 'blob:packet');
    const revokeObjectURL = jest.fn();
    const appendChild = jest.fn();
    const remove = jest.fn();
    const click = jest.fn();

    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
    (global as typeof globalThis & { Blob?: typeof Blob }).Blob =
      originalBlob ?? class MockBlob {};
    (global as typeof globalThis & { URL?: unknown }).URL = {
      createObjectURL,
      revokeObjectURL,
    };
    (global as typeof globalThis & { document?: Document }).document = {
      body: { appendChild },
      createElement: () =>
        ({
          click,
          download: '',
          href: '',
          remove,
          style: {},
        }) as HTMLAnchorElement,
    } as unknown as Document;

    try {
      const { getByText } = await render(
        <ExportManifestScreen
          {...baseProps}
          accessItems={[
            {
              id: 'access-1',
              propertyId: property.id,
              category: 'wifi',
              label: 'Main Wi-Fi',
              accessCode: '9274',
              linkedDocumentIds: [],
            },
          ]}
        />,
      );

      await act(async () => {
        fireEvent.press(getByText('Download packet'));
      });

      expect(createObjectURL).toHaveBeenCalled();
      expect(getByText('homevault-emergency-packet.txt was downloaded.')).toBeTruthy();
    } finally {
      if (platformDescriptor) {
        Object.defineProperty(Platform, 'OS', platformDescriptor);
      }
      if (originalBlob) {
        (global as typeof globalThis & { Blob?: typeof Blob }).Blob = originalBlob;
      }
      if (originalURL) {
        (global as typeof globalThis & { URL?: typeof URL }).URL = originalURL;
      }
      if (originalDocument) {
        (global as typeof globalThis & { document?: Document }).document = originalDocument;
      }
    }
  });

  it('shares a sensitive emergency packet after local step-up confirmation on native', async () => {
    const { getByText } = await render(
      <ExportManifestScreen
        {...baseProps}
        accessItems={[
          {
            id: 'access-1',
            propertyId: property.id,
            category: 'wifi',
            label: 'Main Wi-Fi',
            accessCode: '9274',
            linkedDocumentIds: [],
          },
        ]}
      />,
    );

    await act(async () => {
      fireEvent.press(getByText('Share packet'));
    });

    await waitFor(() =>
      expect(mockConfirmLocalStepUp).toHaveBeenCalledWith(
        expect.objectContaining({
          alertTitle: 'Share sensitive emergency packet?',
          confirmLabel: 'Share',
          authPromptMessage: 'Authenticate to share emergency packet',
        }),
      ),
    );
    await waitFor(() => expect(mockShareAsync).toHaveBeenCalled());
    expect(mockFileWrite).toHaveBeenCalledWith('Emergency packet text');
    expect(getByText('Emergency packet shared successfully.')).toBeTruthy();
  });

  it('shows a fully prepared household as ready for both trusted handoff and packet export', async () => {
    const { getAllByText, getByText, queryByText } = await render(
      <ExportManifestScreen
        {...baseProps}
        assets={[
          {
            id: 'asset-router',
            propertyId: property.id,
            name: 'Main router',
            category: 'Networking',
            status: 'ready',
            roomName: 'Office',
            networkName: 'OakStreet-5G',
            internetProvider: 'FiberFast',
            documentCount: 1,
            lastServiceLabel: 'Never',
            nextTaskLabel: 'No open tasks',
            warrantyExpiringSoon: false,
          },
        ]}
        documents={[
          {
            id: 'document-policy',
            propertyId: property.id,
            title: 'Prairie Mutual home policy',
            type: 'insurance',
            typeLabel: 'Insurance',
            linkedToLabel: 'Property',
            dateLabel: 'Jul 1, 2026',
            linkedRecords: [{ id: property.id, label: 'Oak Street home', kind: 'property' }],
            linkedRecordIds: [property.id],
          },
          {
            id: 'document-router',
            propertyId: property.id,
            title: 'Router quick start',
            type: 'manual',
            typeLabel: 'Manual',
            linkedToLabel: 'Main router',
            dateLabel: 'Jul 1, 2026',
            linkedRecords: [{ id: 'asset-router', label: 'Main router', kind: 'asset' }],
            linkedRecordIds: ['asset-router'],
          },
        ]}
        accessItems={[
          {
            id: 'access-1',
            propertyId: property.id,
            category: 'wifi',
            label: 'Main Wi-Fi',
            accessCode: '9274',
            linkedAssetId: 'asset-router',
            linkedDocumentIds: ['document-router'],
          },
        ]}
        emergencyContacts={[
          {
            id: 'contact-1',
            propertyId: property.id,
            name: 'Jamie Lee',
            role: 'Neighbor with spare key',
            priority: 'primary',
            phone: '555-0101',
          },
        ]}
        importantAccounts={[
          {
            id: 'account-1',
            propertyId: property.id,
            kind: 'insurance',
            providerName: 'Prairie Mutual',
            label: 'Home policy',
            phone: '555-0119',
            linkedDocumentIds: ['document-policy'],
          },
          {
            id: 'account-2',
            propertyId: property.id,
            kind: 'email',
            providerName: 'Google',
            label: 'Primary email',
            recoveryNotes: 'Backup codes are stored in the fire safe.',
            linkedDocumentIds: [],
          },
        ]}
      />,
    );

    expect(getByText('Trusted-share handoff')).toBeTruthy();
    expect(getAllByText('1 item ready').length).toBeGreaterThanOrEqual(5);
    expect(getByText(/5 sections included.*0 omitted/)).toBeTruthy();
    expect(getByText('Emergency packet preview')).toBeTruthy();
    expect(getByText('Main router')).toBeTruthy();
    expect(getByText('Share handoff')).toBeTruthy();
    expect(getByText('Share packet')).toBeTruthy();
    expect(
      queryByText('Add at least one emergency-ready record before exporting a packet.'),
    ).toBeNull();
    expect(
      queryByText(
        'The selected sections do not have saved records yet. Pick a different section or add records first.',
      ),
    ).toBeNull();
  });

  it('prints the emergency packet when core records exist, even if optional sections are missing', async () => {
    const { getByText } = await render(
      <ExportManifestScreen
        {...baseProps}
        accessItems={[
          {
            id: 'access-1',
            propertyId: property.id,
            category: 'wifi',
            label: 'Main Wi-Fi',
            accessCode: '9274',
            linkedDocumentIds: [],
          },
        ]}
      />,
    );

    await act(async () => {
      fireEvent.press(getByText('Print packet'));
    });

    await waitFor(() =>
      expect(mockConfirmLocalStepUp).toHaveBeenCalledWith(
        expect.objectContaining({
          alertTitle: 'Print sensitive emergency packet?',
          confirmLabel: 'Print',
          authPromptMessage: 'Authenticate to print emergency packet',
        }),
      ),
    );
    await waitFor(() => expect(printEmergencyPacket).toHaveBeenCalled());
  });

  it('does not print the emergency packet when local step-up verification is cancelled', async () => {
    mockConfirmLocalStepUp.mockResolvedValue(false);

    const { getByText } = await render(
      <ExportManifestScreen
        {...baseProps}
        accessItems={[
          {
            id: 'access-1',
            propertyId: property.id,
            category: 'wifi',
            label: 'Main Wi-Fi',
            accessCode: '9274',
            linkedDocumentIds: [],
          },
        ]}
      />,
    );

    await act(async () => {
      fireEvent.press(getByText('Print packet'));
    });

    await waitFor(() => expect(mockConfirmLocalStepUp).toHaveBeenCalled());
    expect(printEmergencyPacket).not.toHaveBeenCalled();
  });
});
