import { calculateDashboardReadinessSummary } from '../../utils/dashboardReadiness';

describe('dashboardReadiness', () => {
  const property = {
    id: 'property-1',
    householdId: 'household-1',
    label: 'Oak Street home',
    type: 'single_family' as const,
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  it('changes primarily from continuity setup, not just maintenance state', () => {
    const sparse = calculateDashboardReadinessSummary({
      property,
      assets: [],
      documents: [],
      accessItems: [],
      emergencyContacts: [],
      importantAccounts: [],
      continuityPlaybooks: [],
      tasks: [
        {
          id: 'task-1',
          propertyId: property.id,
          scope: 'property',
          scopeId: property.id,
          title: 'Test detector',
          dueDate: '2026-07-10',
          recurrenceKind: 'interval',
          recurrenceLabel: 'Monthly',
          state: 'upcoming',
        },
      ],
    });
    const prepared = calculateDashboardReadinessSummary({
      property,
      assets: [
        {
          id: 'asset-router',
          propertyId: property.id,
          name: 'Main Wi-Fi router',
          category: 'Networking',
          networkName: 'OakStreet-5G',
          status: 'ready',
          lastReviewedAt: '2026-07-01',
          roomName: 'Office',
          documentCount: 1,
          lastServiceLabel: 'Never',
          nextTaskLabel: 'No open tasks',
          warrantyExpiringSoon: false,
        },
      ],
      documents: [
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
      ],
      accessItems: [
        {
          id: 'access-wifi',
          propertyId: property.id,
          category: 'wifi',
          label: 'Main Wi-Fi',
          accessCode: '9274',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'access-lockbox',
          propertyId: property.id,
          category: 'lockbox',
          label: 'Front lockbox',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
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
          lastReviewedAt: '2026-07-01',
        },
      ],
      importantAccounts: [
        {
          id: 'account-1',
          propertyId: property.id,
          kind: 'insurance',
          providerName: 'Prairie Mutual',
          label: 'Home policy',
          recoveryNotes: 'Claim photos live in the shared drive.',
          mfaEnabled: true,
          linkedDocumentIds: ['document-policy'],
          lastReviewedAt: '2026-07-01',
        },
      ],
      continuityPlaybooks: [],
      tasks: [
        {
          id: 'task-1',
          propertyId: property.id,
          scope: 'property',
          scopeId: property.id,
          title: 'Test detector',
          dueDate: '2026-07-10',
          recurrenceKind: 'interval',
          recurrenceLabel: 'Monthly',
          state: 'upcoming',
        },
      ],
    });

    expect(prepared.score).toBeGreaterThan(sparse.score + 40);
    expect(prepared.label).toBe('Strong coverage');
    expect(sparse.nextOpportunity?.label).toBe('Save Wi-Fi details');
  });

  it('surfaces the highest-value next step deterministically', () => {
    const summary = calculateDashboardReadinessSummary({
      property,
      assets: [],
      documents: [],
      accessItems: [],
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
      tasks: [],
    });

    expect(summary.opportunities.map((item) => item.label)).toEqual([
      'Save Wi-Fi details',
      'Add an insurance account',
      'Add a router or critical device',
    ]);
  });

  it('reaches strong coverage when core continuity records are in place', () => {
    const summary = calculateDashboardReadinessSummary({
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
          lastReviewedAt: '2026-07-01',
          roomName: 'Bedroom',
          documentCount: 0,
          lastServiceLabel: 'Never',
          nextTaskLabel: 'No open tasks',
          warrantyExpiringSoon: false,
        },
        {
          id: 'asset-router',
          propertyId: property.id,
          name: 'Main Wi-Fi router',
          category: 'Networking',
          networkName: 'OakStreet-5G',
          status: 'ready',
          lastReviewedAt: '2026-07-01',
          roomName: 'Office',
          documentCount: 1,
          lastServiceLabel: 'Never',
          nextTaskLabel: 'No open tasks',
          warrantyExpiringSoon: false,
        },
      ],
      documents: [
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
      ],
      accessItems: [
        {
          id: 'access-wifi',
          propertyId: property.id,
          category: 'wifi',
          label: 'Main Wi-Fi',
          accessCode: '9274',
          linkedDocumentIds: ['document-router'],
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'access-lockbox',
          propertyId: property.id,
          category: 'lockbox',
          label: 'Front lockbox',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
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
          lastReviewedAt: '2026-07-01',
        },
      ],
      importantAccounts: [
        {
          id: 'account-1',
          propertyId: property.id,
          kind: 'insurance',
          providerName: 'Prairie Mutual',
          label: 'Home policy',
          recoveryNotes: 'Claim photos live in the shared drive.',
          mfaEnabled: true,
          recoveryCodesStored: true,
          managedInPasswordManager: true,
          linkedDocumentIds: ['document-policy'],
          lastReviewedAt: '2026-07-01',
        },
      ],
      continuityPlaybooks: [],
      tasks: [],
    });

    expect(summary.score).toBeGreaterThanOrEqual(80);
    expect(summary.nextOpportunity).toBeNull();
    expect(summary.playbooksReadyCount).toBeGreaterThanOrEqual(3);
  });

  it('adds a digital safety opportunity once core records exist but protection checks are incomplete', () => {
    const summary = calculateDashboardReadinessSummary({
      property,
      assets: [
        {
          id: 'asset-phone',
          propertyId: property.id,
          name: 'Jamie phone',
          category: 'Phone',
          backupEnabled: false,
          screenLockEnabled: true,
          findMyDeviceEnabled: false,
          status: 'ready',
          lastReviewedAt: '2026-07-01',
          roomName: 'Bedroom',
          documentCount: 0,
          lastServiceLabel: 'Never',
          nextTaskLabel: 'No open tasks',
          warrantyExpiringSoon: false,
        },
        {
          id: 'asset-router',
          propertyId: property.id,
          name: 'Main Wi-Fi router',
          category: 'Networking',
          networkName: 'OakStreet-5G',
          status: 'ready',
          lastReviewedAt: '2026-07-01',
          roomName: 'Office',
          documentCount: 1,
          lastServiceLabel: 'Never',
          nextTaskLabel: 'No open tasks',
          warrantyExpiringSoon: false,
        },
      ],
      documents: [
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
      ],
      accessItems: [
        {
          id: 'access-wifi',
          propertyId: property.id,
          category: 'wifi',
          label: 'Main Wi-Fi',
          accessCode: '9274',
          linkedDocumentIds: ['document-router'],
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'access-lockbox',
          propertyId: property.id,
          category: 'lockbox',
          label: 'Front lockbox',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
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
          lastReviewedAt: '2026-07-01',
        },
      ],
      importantAccounts: [
        {
          id: 'account-1',
          propertyId: property.id,
          kind: 'insurance',
          providerName: 'Prairie Mutual',
          label: 'Home policy',
          recoveryNotes: 'Claim photos live in the shared drive.',
          mfaEnabled: true,
          recoveryCodesStored: false,
          managedInPasswordManager: false,
          linkedDocumentIds: ['document-policy'],
          lastReviewedAt: '2026-07-01',
        },
        {
          id: 'account-2',
          propertyId: property.id,
          kind: 'internet',
          providerName: 'FiberFast',
          label: 'FiberFast account',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
        },
      ],
      continuityPlaybooks: [],
      tasks: [],
    });

    expect(summary.opportunities.map((item) => item.label)).toContain('Review one digital safety check');
  });

  it('lowers readiness and surfaces review alerts when emergency-critical records go stale', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-09T12:00:00.000Z'));

    const fresh = calculateDashboardReadinessSummary({
      property,
      assets: [
        {
          id: 'asset-router',
          propertyId: property.id,
          name: 'Main Wi-Fi router',
          category: 'Networking',
          networkName: 'OakStreet-5G',
          status: 'ready',
          lastReviewedAt: '2026-07-01',
          roomName: 'Office',
          documentCount: 1,
          lastServiceLabel: 'Never',
          nextTaskLabel: 'No open tasks',
          warrantyExpiringSoon: false,
        },
      ],
      documents: [],
      accessItems: [
        {
          id: 'access-wifi',
          propertyId: property.id,
          category: 'wifi',
          label: 'Main Wi-Fi',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
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
          lastReviewedAt: '2026-07-01',
        },
      ],
      importantAccounts: [
        {
          id: 'account-1',
          propertyId: property.id,
          kind: 'insurance',
          providerName: 'Prairie Mutual',
          label: 'Home policy',
          linkedDocumentIds: [],
          lastReviewedAt: '2026-07-01',
        },
      ],
      continuityPlaybooks: [],
      tasks: [],
    });

    const stale = calculateDashboardReadinessSummary({
      property,
      assets: [
        {
          id: 'asset-router',
          propertyId: property.id,
          name: 'Main Wi-Fi router',
          category: 'Networking',
          networkName: 'OakStreet-5G',
          status: 'ready',
          lastReviewedAt: '2025-12-01',
          roomName: 'Office',
          documentCount: 1,
          lastServiceLabel: 'Never',
          nextTaskLabel: 'No open tasks',
          warrantyExpiringSoon: false,
        },
      ],
      documents: [],
      accessItems: [
        {
          id: 'access-wifi',
          propertyId: property.id,
          category: 'wifi',
          label: 'Main Wi-Fi',
          linkedDocumentIds: [],
          lastReviewedAt: '2025-12-01',
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
      importantAccounts: [
        {
          id: 'account-1',
          propertyId: property.id,
          kind: 'insurance',
          providerName: 'Prairie Mutual',
          label: 'Home policy',
          linkedDocumentIds: [],
          lastReviewedAt: '2025-12-01',
        },
      ],
      continuityPlaybooks: [],
      tasks: [],
    });

    expect(stale.score).toBeLessThan(fresh.score);
    expect(stale.staleRecordsCount).toBe(4);
    expect(stale.priorityReviewAlerts[0]?.label).toBe('Review Jamie Lee');
    expect(stale.breakdown.freshnessPenalty).toBeGreaterThan(0);
  });
});
