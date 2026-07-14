import {
  buildDigitalSafetyChecklist,
  buildDigitalSafetyPlaybook,
  buildPrimaryRecoveryAccountCoverage,
} from '../../utils/digitalSafety';

describe('digitalSafety', () => {
  it('builds a mixed readiness checklist from accounts and devices', () => {
    const checklist = buildDigitalSafetyChecklist(
      [
        {
          id: 'account-1',
          propertyId: 'property-1',
          kind: 'insurance',
          providerName: 'Prairie Mutual',
          label: 'Home policy',
          mfaEnabled: true,
          recoveryCodesStored: false,
          managedInPasswordManager: true,
          linkedDocumentIds: [],
        },
      ],
      [
        {
          id: 'asset-phone',
          propertyId: 'property-1',
          name: 'Jamie phone',
          category: 'Phone',
          backupEnabled: true,
          screenLockEnabled: true,
          findMyDeviceEnabled: false,
          status: 'ready',
        },
      ],
    );

    expect(checklist.find((item) => item.key === 'mfa')?.status).toBe('ready');
    expect(checklist.find((item) => item.key === 'recovery_codes')?.status).toBe('needs_attention');
    expect(checklist.find((item) => item.key === 'password_manager')?.status).toBe('ready');
    expect(checklist.find((item) => item.key === 'device_backups')?.status).toBe('ready');
    expect(checklist.find((item) => item.key === 'phone_lock')?.status).toBe('ready');
    expect(checklist.find((item) => item.key === 'find_my_device')?.status).toBe('needs_attention');
  });

  it('builds a linked digital safety playbook without passwords', () => {
    const playbook = buildDigitalSafetyPlaybook(
      {
        id: 'property-1',
        householdId: 'household-1',
        label: 'Oak Street home',
        type: 'single_family',
      },
      [
        {
          id: 'account-1',
          propertyId: 'property-1',
          kind: 'banking',
          providerName: 'River Bank',
          label: 'Primary bank login',
          linkedDocumentIds: [],
        },
      ],
      [],
    );

    expect(playbook.category).toBe('digital_safety');
    expect(playbook.linkedRecordIds).toEqual(['account-1']);
    expect(playbook.notes).toMatch(/never stores passwords/i);
    expect(playbook.steps).toHaveLength(6);
  });

  it('highlights missing or stale primary recovery accounts', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-09T12:00:00.000Z'));

    const coverage = buildPrimaryRecoveryAccountCoverage([
      {
        id: 'account-email',
        propertyId: 'property-1',
        kind: 'email',
        providerName: 'Gmail',
        label: 'Family recovery email',
        email: 'family@example.test',
        managerRole: 'shared_household',
        isSharedHouseholdAccount: true,
        linkedDocumentIds: [],
        lastReviewedAt: '2026-01-01',
      },
      {
        id: 'account-carrier',
        propertyId: 'property-1',
        kind: 'carrier',
        providerName: 'Blue Wireless',
        label: 'Primary mobile carrier',
        phone: '555-0122',
        managerRole: 'partner',
        linkedDocumentIds: [],
        lastReviewedAt: '2026-07-01',
      },
    ]);

    expect(coverage.find((item) => item.key === 'primary_email')?.status).toBe('needs_attention');
    expect(coverage.find((item) => item.key === 'carrier')?.status).toBe('ready');
    expect(coverage.find((item) => item.key === 'platform')?.status).toBe('missing');

    jest.useRealTimers();
  });
});
