import { buildAnnualReviewChecklist, buildAnnualReviewTask, getAnnualReviewCompletionRoute, getAnnualReviewTaskRoute } from '../../utils/annualReview';

describe('annualReview utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-09T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const property = {
    id: 'property-1',
    householdId: 'household-1',
    label: 'Oak Street home',
    type: 'single_family' as const,
  };

  it('builds a checklist that covers the major continuity categories', () => {
    const checklist = buildAnnualReviewChecklist({
      property,
      rooms: [],
      assets: [],
      documents: [],
      accessItems: [],
      emergencyContacts: [],
      importantAccounts: [],
      continuityPlaybooks: [],
      tasks: [],
      taskCompletions: [],
      repairEvents: [],
      parts: [],
    });

    expect(checklist.map((item) => item.key)).toEqual([
      'insurance',
      'contacts',
      'access',
      'devices',
      'digital_safety',
      'ownership',
      'packet',
    ]);
    expect(checklist.every((item) => item.status === 'needs_attention')).toBe(true);
  });

  it('builds the recurring task and routes annual review tasks to the dedicated flow', () => {
    const task = buildAnnualReviewTask(property.id, '2026-01-15T10:00:00.000Z');

    expect(task.id).toBe('annual-review-property-1');
    expect(task.title).toBe('Run annual household review');
    expect(task.recurrenceLabel).toBe('Yearly');
    expect(task.instructions).toContain('Review insurance coverage');
    expect(getAnnualReviewTaskRoute(task.id)).toBe('/annual-review');
    expect(getAnnualReviewCompletionRoute(task.id)).toBe('/annual-review');
    expect(getAnnualReviewTaskRoute('task-123')).toBe('/task/task-123');
  });

  it('marks stale continuity areas as needing attention even when records exist', () => {
    const checklist = buildAnnualReviewChecklist({
      property,
      rooms: [],
      assets: [
        {
          id: 'asset-1',
          propertyId: 'property-1',
          name: 'Main router',
          category: 'Router',
          status: 'ready',
          roomName: 'Office',
          documentCount: 0,
          lastServiceLabel: 'Never',
          nextTaskLabel: 'No open tasks',
          warrantyExpiringSoon: false,
          lastReviewedAt: '2026-01-01',
        },
      ],
      documents: [],
      accessItems: [
        {
          id: 'access-1',
          propertyId: 'property-1',
          category: 'wifi',
          label: 'Main Wi-Fi',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-01-01',
        },
      ],
      emergencyContacts: [
        {
          id: 'contact-1',
          propertyId: 'property-1',
          name: 'Jamie Lee',
          role: 'Neighbor',
          priority: 'primary',
          phone: '555-0101',
          lastReviewedAt: '2026-01-01',
        },
        {
          id: 'contact-2',
          propertyId: 'property-1',
          name: 'River City Plumbing',
          role: 'Plumber',
          priority: 'service_provider',
          phone: '555-0140',
          lastReviewedAt: '2026-06-01',
        },
        {
          id: 'contact-3',
          propertyId: 'property-1',
          name: 'Dana Smith',
          role: 'Family',
          priority: 'secondary',
          phone: '555-0188',
          lastReviewedAt: '2026-06-01',
        },
      ],
      importantAccounts: [
        {
          id: 'account-1',
          propertyId: 'property-1',
          kind: 'insurance',
          providerName: 'Prairie Mutual',
          label: 'Home policy',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-01-01',
        },
      ],
      continuityPlaybooks: [],
      tasks: [],
      taskCompletions: [],
      repairEvents: [],
      parts: [],
    });

    expect(checklist.find((item) => item.key === 'access')?.status).toBe('needs_attention');
    expect(checklist.find((item) => item.key === 'contacts')?.status).toBe('needs_attention');
    expect(checklist.find((item) => item.key === 'insurance')?.status).toBe('needs_attention');
    expect(checklist.find((item) => item.key === 'devices')?.status).toBe('needs_attention');
  });

  it('marks every annual-review area ready for a fully prepared household', () => {
    const checklist = buildAnnualReviewChecklist({
      property,
      rooms: [],
      assets: [
        {
          id: 'asset-router',
          propertyId: 'property-1',
          name: 'Main router',
          category: 'Networking',
          networkName: 'OakStreet-5G',
          status: 'ready',
          roomName: 'Office',
          documentCount: 1,
          lastServiceLabel: 'Never',
          nextTaskLabel: 'No open tasks',
          warrantyExpiringSoon: false,
          backupEnabled: true,
          screenLockEnabled: true,
          findMyDeviceEnabled: true,
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'asset-phone',
          propertyId: 'property-1',
          name: 'Jamie phone',
          category: 'Phone',
          status: 'ready',
          roomName: 'Bedroom',
          documentCount: 0,
          lastServiceLabel: 'Never',
          nextTaskLabel: 'No open tasks',
          warrantyExpiringSoon: false,
          backupEnabled: true,
          screenLockEnabled: true,
          findMyDeviceEnabled: true,
          lastReviewedAt: '2026-07-01',
        },
      ],
      documents: [
        {
          id: 'document-policy',
          propertyId: 'property-1',
          title: 'Prairie Mutual home policy',
          type: 'insurance',
          typeLabel: 'Insurance',
          linkedToLabel: 'Property',
          dateLabel: 'Jul 1, 2026',
          linkedRecords: [],
          linkedRecordIds: ['property-1'],
        },
        {
          id: 'document-router',
          propertyId: 'property-1',
          title: 'Router quick start',
          type: 'manual',
          typeLabel: 'Manual',
          linkedToLabel: 'Main router',
          dateLabel: 'Jul 1, 2026',
          linkedRecords: [],
          linkedRecordIds: ['asset-router'],
        },
      ],
      accessItems: [
        {
          id: 'access-1',
          propertyId: 'property-1',
          category: 'wifi',
          label: 'Main Wi-Fi',
          accessCode: '9274',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'access-2',
          propertyId: 'property-1',
          category: 'lockbox',
          label: 'Front lockbox',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
        },
      ],
      emergencyContacts: [
        {
          id: 'contact-1',
          propertyId: 'property-1',
          name: 'Jamie Lee',
          role: 'Neighbor',
          priority: 'primary',
          phone: '555-0101',
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'contact-2',
          propertyId: 'property-1',
          name: 'Dana Smith',
          role: 'Family',
          priority: 'secondary',
          phone: '555-0188',
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'contact-3',
          propertyId: 'property-1',
          name: 'River City Plumbing',
          role: 'Plumber',
          priority: 'service_provider',
          phone: '555-0140',
          lastReviewedAt: '2026-07-01',
        },
      ],
      importantAccounts: [
        {
          id: 'account-1',
          propertyId: 'property-1',
          kind: 'insurance',
          providerName: 'Prairie Mutual',
          label: 'Home policy',
          mfaEnabled: true,
          recoveryCodesStored: true,
          managedInPasswordManager: true,
          linkedDocumentIds: ['document-policy'],
          managerRole: 'self',
          recoveryNotes: 'Claims support number is printed on the policy packet.',
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'account-2',
          propertyId: 'property-1',
          kind: 'email',
          providerName: 'Google',
          label: 'Primary email',
          mfaEnabled: true,
          recoveryCodesStored: true,
          managedInPasswordManager: true,
          linkedDocumentIds: [],
          managerRole: 'self',
          recoveryNotes: 'Backup codes are in the fire safe.',
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'account-3',
          propertyId: 'property-1',
          kind: 'carrier',
          providerName: 'Verizon',
          label: 'Carrier',
          mfaEnabled: true,
          recoveryCodesStored: true,
          managedInPasswordManager: true,
          linkedDocumentIds: [],
          managerRole: 'self',
          phone: '555-1000',
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'account-4',
          propertyId: 'property-1',
          kind: 'platform',
          providerName: 'Apple',
          label: 'Apple ID',
          mfaEnabled: true,
          recoveryCodesStored: true,
          managedInPasswordManager: true,
          linkedDocumentIds: [],
          managerRole: 'self',
          recoveryNotes: 'Family organizer manages recovery contacts.',
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'account-5',
          propertyId: 'property-1',
          kind: 'utility',
          providerName: 'City Utilities',
          label: 'Electric utility',
          mfaEnabled: true,
          recoveryCodesStored: true,
          managedInPasswordManager: true,
          linkedDocumentIds: [],
          managerRole: 'self',
          phone: '555-0144',
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'account-6',
          propertyId: 'property-1',
          kind: 'smart_home',
          providerName: 'Alarm.com',
          label: 'Alarm and locks',
          mfaEnabled: true,
          recoveryCodesStored: true,
          managedInPasswordManager: true,
          linkedDocumentIds: [],
          managerRole: 'self',
          recoveryNotes: 'Spare admin instructions live in the lockbox binder.',
          lastReviewedAt: '2026-07-01',
        },
      ],
      continuityPlaybooks: [],
      tasks: [],
      taskCompletions: [],
      repairEvents: [],
      parts: [],
    });

    expect(
      Object.fromEntries(checklist.map((item) => [item.key, item.status])),
    ).toEqual({
      insurance: 'ready',
      contacts: 'ready',
      access: 'ready',
      devices: 'ready',
      digital_safety: 'ready',
      ownership: 'ready',
      packet: 'ready',
    });
    expect(checklist.find((item) => item.key === 'packet')?.detail).toContain('5 of 5 continuity sections');
  });
});
