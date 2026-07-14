import {
  getEmergencyAudienceView,
  HOMEVAULT_EMERGENCY_AUDIENCE_VIEWS,
} from '../../utils/emergencyAudienceViews';

describe('emergencyAudienceViews', () => {
  it('keeps the whole household view broad and fully visible', () => {
    expect(getEmergencyAudienceView('whole_household')).toEqual(
      expect.objectContaining({
        key: 'whole_household',
        packetFocus: 'broad',
        showCriticalDocuments: true,
        showDigitalSafety: true,
        showImportantAccounts: true,
        showOwnership: true,
        showPrimaryRecoveryAccounts: true,
        showReviewQueue: true,
      }),
    );
  });

  it('maps helper audiences to narrower handoff presets and warnings', () => {
    const teenHelperView = getEmergencyAudienceView('teen_helper');
    const emergencyHelperView = getEmergencyAudienceView('emergency_helper');

    expect(teenHelperView.trustedShareAudienceKey).toBe('house_sitter');
    expect(teenHelperView.packetFocus).toBe('off');
    expect(teenHelperView.showImportantAccounts).toBe(false);
    expect(teenHelperView.authorityWarning).toContain('support-only');

    expect(emergencyHelperView.trustedShareAudienceKey).toBe('emergency_contact');
    expect(emergencyHelperView.packetFocus).toBe('narrow');
    expect(emergencyHelperView.showCriticalDocuments).toBe(true);
    expect(emergencyHelperView.showOwnership).toBe(false);
  });

  it('exposes every declared audience key through the registry', () => {
    expect(HOMEVAULT_EMERGENCY_AUDIENCE_VIEWS.map((view) => view.key)).toEqual([
      'whole_household',
      'spouse',
      'teen_helper',
      'house_sitter',
      'emergency_helper',
    ]);
  });
});
