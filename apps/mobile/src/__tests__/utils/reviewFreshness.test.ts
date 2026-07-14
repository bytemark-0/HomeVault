import {
  buildCriticalReviewQueue,
  createReviewedOnDate,
  getAccessItemReviewSummary,
  getCriticalDeviceReviewSummary,
  getEmergencyContactReviewSummary,
  getImportantAccountReviewSummary,
} from '../../utils/reviewFreshness';

describe('reviewFreshness', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-09T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('treats fresh critical records as current', () => {
    expect(
      getAccessItemReviewSummary({
        id: 'access-1',
        propertyId: 'property-1',
        category: 'wifi',
        label: 'Main Wi-Fi',
        linkedDocumentIds: [],
        lastReviewedAt: '2026-07-01',
      }).status,
    ).toBe('current');
    expect(
      getEmergencyContactReviewSummary({
        id: 'contact-1',
        propertyId: 'property-1',
        name: 'Jamie Lee',
        role: 'Neighbor',
        priority: 'primary',
        lastReviewedAt: '2026-06-20',
      }).status,
    ).toBe('current');
  });

  it('flags stale or missing review metadata', () => {
    expect(
      getImportantAccountReviewSummary({
        id: 'account-1',
        propertyId: 'property-1',
        kind: 'insurance',
        providerName: 'Prairie Mutual',
        label: 'Home policy',
        linkedDocumentIds: [],
        lastReviewedAt: '2026-01-01',
      }).status,
    ).toBe('stale');
    expect(
      getCriticalDeviceReviewSummary({
        id: 'asset-1',
        propertyId: 'property-1',
        name: 'Main router',
        category: 'Router',
        status: 'ready',
      }).status,
    ).toBe('missing');
  });

  it('reuses last verified dates for access items until a dedicated review date exists', () => {
    const summary = getAccessItemReviewSummary({
      id: 'access-1',
      propertyId: 'property-1',
      category: 'garage',
      label: 'Garage keypad',
      linkedDocumentIds: [],
      lastVerifiedAt: '2026-06-15',
    });

    expect(summary.status).toBe('current');
  });

  it('formats review dates as YYYY-MM-DD values for persistence', () => {
    expect(createReviewedOnDate()).toBe('2026-07-09');
  });

  it('sorts stale and missing records by emergency impact', () => {
    const queue = buildCriticalReviewQueue({
      accessItems: [
        {
          id: 'access-wifi',
          propertyId: 'property-1',
          category: 'wifi',
          label: 'Main Wi-Fi',
          linkedDocumentIds: [],
          lastReviewedAt: '2025-12-01',
        },
      ],
      assets: [
        {
          id: 'asset-router',
          propertyId: 'property-1',
          name: 'Main router',
          category: 'Router',
          status: 'ready',
        },
      ],
      emergencyContacts: [
        {
          id: 'contact-1',
          propertyId: 'property-1',
          name: 'Jamie Lee',
          role: 'Neighbor',
          priority: 'primary',
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
          lastReviewedAt: '2026-07-01',
        },
      ],
    });

    expect(queue.slice(0, 3).map((item) => item.label)).toEqual([
      'Jamie Lee',
      'Main router',
      'Main Wi-Fi',
    ]);
    expect(queue[0]?.status).toBe('missing');
  });
});
