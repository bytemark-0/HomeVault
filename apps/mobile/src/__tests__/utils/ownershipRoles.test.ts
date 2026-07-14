import {
  buildOwnershipResponsibilities,
  buildOwnershipSummary,
  formatOwnershipHandoffSummary,
} from '../../utils/ownershipRoles';

describe('ownershipRoles', () => {
  it('maps ownership and backup coverage for core responsibilities', () => {
    const responsibilities = buildOwnershipResponsibilities({
      assets: [
        {
          id: 'asset-phone',
          propertyId: 'property-1',
          name: 'Jamie phone',
          category: 'Phone',
          ownerName: 'Jamie',
          status: 'ready',
        },
      ],
      emergencyContacts: [
        {
          id: 'contact-1',
          propertyId: 'property-1',
          name: 'Taylor Reed',
          role: 'Backup household helper',
          priority: 'secondary',
        },
        {
          id: 'contact-2',
          propertyId: 'property-1',
          name: 'Maple Kids Daycare',
          role: 'School pickup office',
          priority: 'other',
        },
        {
          id: 'contact-3',
          propertyId: 'property-1',
          name: 'River City Plumbing',
          role: 'Emergency plumber',
          priority: 'service_provider',
        },
      ],
      importantAccounts: [
        {
          id: 'account-insurance',
          propertyId: 'property-1',
          kind: 'insurance',
          providerName: 'Prairie Mutual',
          label: 'Home policy',
          managerRole: 'self',
          linkedDocumentIds: [],
        },
        {
          id: 'account-utility',
          propertyId: 'property-1',
          kind: 'utility',
          providerName: 'Maple Utilities',
          label: 'Electric and water billing',
          managerRole: 'shared_household',
          isSharedHouseholdAccount: true,
          linkedDocumentIds: [],
        },
        {
          id: 'account-email',
          propertyId: 'property-1',
          kind: 'email',
          providerName: 'Gmail',
          label: 'Family inbox',
          managerRole: 'shared_household',
          linkedDocumentIds: [],
        },
      ],
    });

    const summary = buildOwnershipSummary(responsibilities);

    expect(responsibilities.find((item) => item.key === 'insurance')).toEqual(
      expect.objectContaining({
        ownerLabel: 'You',
        backupLabel: 'Taylor Reed (Backup household helper)',
        status: 'ready',
      }),
    );
    expect(responsibilities.find((item) => item.key === 'utilities')).toEqual(
      expect.objectContaining({
        ownerLabel: 'Shared household',
        backupLabel: 'Shared household access',
        status: 'ready',
      }),
    );
    expect(responsibilities.find((item) => item.key === 'school_contacts')).toEqual(
      expect.objectContaining({
        ownerLabel: 'Shared household',
        backupLabel: 'Taylor Reed (Backup household helper)',
        status: 'ready',
      }),
    );
    expect(responsibilities.find((item) => item.key === 'pets')?.status).toBe('not_applicable');
    expect(summary.readyCount).toBe(5);
    expect(summary.total).toBe(5);
    expect(summary.ownerGapCount).toBe(0);
    expect(summary.backupGapCount).toBe(0);
    expect(summary.status).toBe('ready');
  });

  it('formats a handoff summary with owner and backup gaps', () => {
    const responsibilities = buildOwnershipResponsibilities({
      assets: [],
      emergencyContacts: [],
      importantAccounts: [
        {
          id: 'account-insurance',
          propertyId: 'property-1',
          kind: 'insurance',
          providerName: 'Prairie Mutual',
          label: 'Home policy',
          linkedDocumentIds: [],
        },
      ],
    });

    const formatted = formatOwnershipHandoffSummary({
      propertyLabel: 'Oak Street home',
      responsibilities,
    });

    expect(formatted).toContain('HomeVault Responsibility Handoff');
    expect(formatted).toContain('Property   : Oak Street home');
    expect(formatted).toContain('Insurance claims');
    expect(formatted).toContain('Owner      : Not assigned');
    expect(formatted).toContain('Backup     : Not assigned');
  });
});
