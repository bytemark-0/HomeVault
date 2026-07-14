import {
  buildContinuityDrillScenario,
  buildContinuityPlaybookGuides,
  supportsContinuityDrill,
} from '../../utils/continuityPlaybooks';

describe('continuityPlaybooks', () => {
  const property = {
    id: 'property-1',
    householdId: 'household-1',
    label: 'Oak Street home',
    type: 'single_family' as const,
  };

  it('builds the guided incident playbooks and links real records when they exist', () => {
    const guides = buildContinuityPlaybookGuides({
      property,
      assets: [
        {
          id: 'asset-phone',
          propertyId: property.id,
          name: 'Jamie phone',
          category: 'Phone',
          backupEnabled: true,
          screenLockEnabled: true,
          findMyDeviceEnabled: true,
          status: 'ready',
          roomName: 'Primary bedroom',
          documentCount: 1,
          lastServiceLabel: 'Never',
          nextTaskLabel: 'No open tasks',
          warrantyExpiringSoon: false,
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'asset-router',
          propertyId: property.id,
          name: 'Main Wi-Fi router',
          category: 'Networking',
          networkName: 'OakStreet-5G',
          status: 'ready',
          roomName: 'Office',
          documentCount: 1,
          lastServiceLabel: 'Never',
          nextTaskLabel: 'No open tasks',
          warrantyExpiringSoon: false,
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'asset-furnace',
          propertyId: property.id,
          name: 'Jamie laptop',
          category: 'Laptop',
          backupEnabled: true,
          screenLockEnabled: true,
          findMyDeviceEnabled: true,
          status: 'ready',
          roomName: 'Office',
          documentCount: 0,
          lastServiceLabel: 'Never',
          nextTaskLabel: 'No open tasks',
          warrantyExpiringSoon: false,
          lastReviewedAt: '2026-07-01',
        },
      ],
      documents: [
        {
          id: 'document-router',
          propertyId: property.id,
          title: 'Router quick start',
          type: 'manual',
          typeLabel: 'Manual',
          linkedToLabel: 'Main Wi-Fi router',
          dateLabel: 'Jul 1, 2026',
          linkedRecords: [],
          linkedRecordIds: ['asset-router'],
        },
        {
          id: 'document-policy',
          propertyId: property.id,
          title: 'Prairie Mutual home policy',
          type: 'insurance',
          typeLabel: 'Insurance',
          linkedToLabel: 'Property',
          dateLabel: 'Jul 1, 2026',
          linkedRecords: [],
          linkedRecordIds: [property.id],
        },
        {
          id: 'document-phone-recovery',
          propertyId: property.id,
          title: 'Carrier recovery checklist',
          type: 'emergency',
          typeLabel: 'Emergency',
          linkedToLabel: 'Jamie phone',
          dateLabel: 'Jul 1, 2026',
          linkedRecords: [],
          linkedRecordIds: ['asset-phone'],
        },
      ],
      accessItems: [
        {
          id: 'access-router',
          propertyId: property.id,
          category: 'router',
          label: 'Router admin',
          username: 'admin',
          linkedAssetId: 'asset-router',
          linkedDocumentIds: ['document-router'],
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'access-lockbox',
          propertyId: property.id,
          category: 'lockbox',
          label: 'Front porch lockbox',
          location: 'Porch light',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'access-shutoff',
          propertyId: property.id,
          category: 'utility_shutoff',
          label: 'Main water shutoff',
          location: 'Garage south wall',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
        },
      ],
      emergencyContacts: [
        {
          id: 'contact-1',
          propertyId: property.id,
          name: 'Jamie Lee',
          role: 'Neighbor with spare key',
          priority: 'primary',
          phone: '555-0101',
          lastReviewedAt: '2026-07-01',
        },
      ],
      importantAccounts: [
        {
          id: 'account-insurance',
          propertyId: property.id,
          kind: 'insurance',
          providerName: 'Prairie Mutual',
          label: 'Home policy',
          linkedDocumentIds: ['document-policy'],
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'account-internet',
          propertyId: property.id,
          kind: 'internet',
          providerName: 'FiberFast',
          label: 'FiberFast account',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'account-utility',
          propertyId: property.id,
          kind: 'utility',
          providerName: 'City Utilities',
          label: 'City Utilities account',
          phone: '555-0170',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'account-carrier',
          propertyId: property.id,
          kind: 'carrier',
          providerName: 'Blue Wireless',
          label: 'Primary mobile carrier',
          phone: '555-0180',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'account-email',
          propertyId: property.id,
          kind: 'email',
          providerName: 'Gmail',
          label: 'Family recovery email',
          email: 'family@example.test',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'account-bank',
          propertyId: property.id,
          kind: 'banking',
          providerName: 'River Bank',
          label: 'Primary bank login',
          phone: '555-0190',
          recoveryNotes: 'Recovery codes are in the safe.',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
        },
      ],
      continuityPlaybooks: [
        {
          id: 'playbook-custom',
          propertyId: property.id,
          category: 'storm',
          title: 'Storm outage restart',
          state: 'in_progress',
          notes: 'Check the furnace and router after power returns.',
          linkedRecordIds: ['asset-furnace'],
          steps: [
            { id: 'step-1', label: 'Check the furnace', isRequired: true, isComplete: false },
          ],
        },
      ],
    });

    expect(guides.filter((guide) => guide.source === 'guided')).toHaveLength(13);
    expect(guides.find((guide) => guide.id === 'guide-home-lockout')?.state).toBe('ready');
    expect(
      guides.find((guide) => guide.id === 'guide-internet-outage')?.readyRecords.map((record) => record.label),
    ).toEqual(expect.arrayContaining(['Router admin', 'Main Wi-Fi router', 'FiberFast account']));
    expect(
      guides.find((guide) => guide.id === 'guide-insurance-incident')?.readyRecords.map((record) => record.label),
    ).toEqual(expect.arrayContaining(['Home policy', 'Prairie Mutual home policy', 'Emergency packet']));
    expect(
      guides.find((guide) => guide.id === 'guide-account-recovery')?.readyRecords.map((record) => record.label),
    ).toEqual(expect.arrayContaining(['Primary bank login', 'Jamie phone']));
    expect(
      guides.find((guide) => guide.id === 'guide-urgent-scam-call')?.readyRecords.map((record) => record.label),
    ).toEqual(expect.arrayContaining(['City Utilities account', 'Jamie Lee', 'Family recovery email']));
    expect(
      guides.find((guide) => guide.id === 'guide-fake-utility-shutoff')?.readyRecords.map((record) => record.label),
    ).toEqual(expect.arrayContaining(['City Utilities account']));
    expect(
      guides.find((guide) => guide.id === 'guide-carrier-fraud')?.readyRecords.map((record) => record.label),
    ).toEqual(expect.arrayContaining(['Primary mobile carrier', 'Jamie phone', 'Family recovery email']));
    expect(
      guides.find((guide) => guide.id === 'guide-bank-account-panic')?.readyRecords.map((record) => record.label),
    ).toEqual(expect.arrayContaining(['Primary bank login', 'Jamie phone']));
    expect(
      guides.find((guide) => guide.id === 'guide-house-sitter-handoff')?.readyRecords.map((record) => record.label),
    ).toEqual(expect.arrayContaining(['Front porch lockbox', 'Jamie Lee', 'Trusted handoff export']));
    expect(
      guides.find((guide) => guide.id === 'guide-travel-handoff')?.readyRecords.map((record) => record.label),
    ).toEqual(expect.arrayContaining(['Main water shutoff', 'Jamie Lee', 'Trusted handoff export']));
    expect(
      guides.find((guide) => guide.id === 'guide-storm-prep')?.readyRecords.map((record) => record.label),
    ).toEqual(expect.arrayContaining(['Home policy', 'Main water shutoff', 'Emergency packet export']));
    expect(
      guides.find((guide) => guide.id === 'guide-evacuation-ready')?.readyRecords.map((record) => record.label),
    ).toEqual(expect.arrayContaining(['Jamie Lee', 'Main water shutoff', 'Prairie Mutual home policy']));
    expect(guides.find((guide) => guide.id === 'playbook-custom')?.readyRecords[0]?.label).toBe('Jamie laptop');
    expect(
      guides
        .find((guide) => guide.id === 'guide-home-lockout')
        ?.readyRecords.find((record) => record.key === 'lockout_contact')?.target,
    ).toEqual({ kind: 'contact', id: 'contact-1' });
  });

  it('marks playbooks incomplete when the supporting records are missing', () => {
    const guides = buildContinuityPlaybookGuides({
      property,
      assets: [],
      documents: [],
      accessItems: [],
      emergencyContacts: [],
      importantAccounts: [],
      continuityPlaybooks: [],
    });

    const outageGuide = guides.find((guide) => guide.id === 'guide-internet-outage');
    const lockoutGuide = guides.find((guide) => guide.id === 'guide-home-lockout');
    const scamGuide = guides.find((guide) => guide.id === 'guide-urgent-scam-call');
    const utilityGuide = guides.find((guide) => guide.id === 'guide-fake-utility-shutoff');
    const travelGuide = guides.find((guide) => guide.id === 'guide-travel-handoff');
    const stormGuide = guides.find((guide) => guide.id === 'guide-storm-prep');

    expect(outageGuide?.state).toBe('not_started');
    expect(outageGuide?.missingRecords.map((record) => record.label)).toEqual(
      expect.arrayContaining(['Router or Wi-Fi access note', 'Router or modem device']),
    );
    expect(lockoutGuide?.missingRecords[0]?.target).toEqual({
      kind: 'new_access',
      category: 'lockbox',
    });
    expect(scamGuide?.missingRecords.map((record) => record.label)).toEqual(
      expect.arrayContaining(['Verified callback account']),
    );
    expect(utilityGuide?.missingRecords.map((record) => record.label)).toEqual(
      expect.arrayContaining(['Utility provider account', 'Utility shutoff note']),
    );
    expect(travelGuide?.missingRecords.map((record) => record.label)).toEqual(
      expect.arrayContaining(['Entry or lockbox note', 'Utility shutoff note', 'Local fallback contact']),
    );
    expect(stormGuide?.missingRecords.map((record) => record.label)).toEqual(
      expect.arrayContaining(['Insurance account', 'Utility shutoff note', 'Emergency contact']),
    );
  });

  it('builds drill scenarios for the first guided drill set and protects sensitive record details', () => {
    const guides = buildContinuityPlaybookGuides({
      property,
      assets: [
        {
          id: 'asset-router',
          propertyId: property.id,
          name: 'Main Wi-Fi router',
          category: 'Networking',
          status: 'ready',
          roomName: 'Office',
          documentCount: 0,
          lastServiceLabel: 'Never',
          nextTaskLabel: 'No open tasks',
          warrantyExpiringSoon: false,
          lastReviewedAt: '2026-07-01',
        },
      ],
      documents: [],
      accessItems: [
        {
          id: 'access-lockbox',
          propertyId: property.id,
          category: 'lockbox',
          label: 'Front porch lockbox',
          location: 'Porch light',
          linkedDocumentIds: [],
          lastReviewedAt: '2025-01-01',
        },
        {
          id: 'access-router',
          propertyId: property.id,
          category: 'router',
          label: 'Router admin',
          username: 'admin',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
        },
      ],
      emergencyContacts: [
        {
          id: 'contact-1',
          propertyId: property.id,
          name: 'Jamie Lee',
          role: 'Neighbor with spare key',
          priority: 'primary',
          phone: '555-0101',
          lastReviewedAt: '2026-07-01',
        },
      ],
      importantAccounts: [],
      continuityPlaybooks: [],
    });

    const lockoutGuide = guides.find((guide) => guide.id === 'guide-home-lockout');
    const internetGuide = guides.find((guide) => guide.id === 'guide-internet-outage');
    const insuranceGuide = guides.find((guide) => guide.id === 'guide-insurance-incident');

    expect(lockoutGuide && supportsContinuityDrill(lockoutGuide)).toBe(true);
    expect(internetGuide && supportsContinuityDrill(internetGuide)).toBe(true);
    expect(insuranceGuide && supportsContinuityDrill(insuranceGuide)).toBe(false);

    const lockoutScenario = lockoutGuide ? buildContinuityDrillScenario(lockoutGuide) : null;

    expect(lockoutScenario?.steps[0]?.resources[0]).toEqual(
      expect.objectContaining({
        actionLabel: 'Open linked record',
        detail: 'Protected details stay inside the linked record until you intentionally open it.',
        freshness: expect.objectContaining({
          status: 'stale',
          label: 'Needs review',
        }),
        sensitivity: 'protected',
      }),
    );
    expect(lockoutScenario?.steps[1]?.resources[0]?.target).toEqual({ kind: 'contact', id: 'contact-1' });
  });
});
