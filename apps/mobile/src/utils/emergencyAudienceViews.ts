import type {
  HomeVaultTrustedShareAudienceKey,
  HomeVaultTrustedShareSectionKey,
} from '@homevault/export';

export type HomeVaultEmergencyAudienceKey =
  | 'whole_household'
  | 'spouse'
  | 'teen_helper'
  | 'house_sitter'
  | 'emergency_helper';

export type HomeVaultEmergencyAudienceView = {
  authorityWarning?: string;
  description: string;
  key: HomeVaultEmergencyAudienceKey;
  label: string;
  packetFocus: 'broad' | 'narrow' | 'off';
  recommendedPlaybookIds: string[];
  showAdditionalPlaybooks: boolean;
  showCriticalDocuments: boolean;
  showDigitalSafety: boolean;
  showImportantAccounts: boolean;
  showOwnership: boolean;
  showPrimaryRecoveryAccounts: boolean;
  showReviewQueue: boolean;
  trustedShareAudienceKey?: HomeVaultTrustedShareAudienceKey;
  trustedShareSections: HomeVaultTrustedShareSectionKey[];
};

export const HOMEVAULT_EMERGENCY_AUDIENCE_VIEWS: HomeVaultEmergencyAudienceView[] = [
  {
    key: 'whole_household',
    label: 'Whole household',
    description:
      'Show the full HomeVault Emergency workspace with every readiness area, recovery detail, and handoff tool.',
    packetFocus: 'broad',
    recommendedPlaybookIds: [
      'guide-home-lockout',
      'guide-internet-outage',
      'guide-stolen-phone',
      'guide-insurance-incident',
    ],
    showAdditionalPlaybooks: true,
    showCriticalDocuments: true,
    showDigitalSafety: true,
    showImportantAccounts: true,
    showOwnership: true,
    showPrimaryRecoveryAccounts: true,
    showReviewQueue: true,
    trustedShareSections: ['accessInfo', 'emergencyContacts', 'insurance', 'keyDevices', 'recoveryNotes'],
  },
  {
    key: 'spouse',
    label: 'Spouse or partner',
    description:
      'A co-manager view with the same core emergency sections, plus the matching trusted-handoff preset when the other adult may need to take over.',
    packetFocus: 'broad',
    recommendedPlaybookIds: [
      'guide-home-lockout',
      'guide-internet-outage',
      'guide-stolen-phone',
      'guide-insurance-incident',
    ],
    showAdditionalPlaybooks: true,
    showCriticalDocuments: true,
    showDigitalSafety: true,
    showImportantAccounts: true,
    showOwnership: true,
    showPrimaryRecoveryAccounts: true,
    showReviewQueue: true,
    trustedShareAudienceKey: 'spouse',
    trustedShareSections: ['accessInfo', 'emergencyContacts', 'insurance', 'keyDevices', 'recoveryNotes'],
  },
  {
    key: 'teen_helper',
    label: 'Teen helper',
    description:
      'Keep the view small: home access, who to call, a few practical playbooks, and only the device basics a teen might need first.',
    authorityWarning:
      'Teen helper view is support-only. If an adult cannot be reached, focus on safety, the listed adult contacts, and emergency services instead of claims, payments, or account changes.',
    packetFocus: 'off',
    recommendedPlaybookIds: [
      'guide-home-lockout',
      'guide-internet-outage',
      'guide-storm-prep',
      'guide-evacuation-readiness',
    ],
    showAdditionalPlaybooks: false,
    showCriticalDocuments: false,
    showDigitalSafety: false,
    showImportantAccounts: false,
    showOwnership: false,
    showPrimaryRecoveryAccounts: false,
    showReviewQueue: false,
    trustedShareAudienceKey: 'house_sitter',
    trustedShareSections: ['accessInfo', 'emergencyContacts', 'keyDevices'],
  },
  {
    key: 'house_sitter',
    label: 'House sitter',
    description:
      'Focus on access, first-call contacts, and the devices or shutoffs needed to keep the home running during a temporary handoff.',
    authorityWarning:
      'Temporary helper view. Do not approve repairs, insurance actions, or credential changes unless the household asked you to do that in advance.',
    packetFocus: 'off',
    recommendedPlaybookIds: [
      'guide-home-lockout',
      'guide-internet-outage',
      'guide-house-sitter-handoff',
      'guide-travel-handoff',
    ],
    showAdditionalPlaybooks: false,
    showCriticalDocuments: false,
    showDigitalSafety: false,
    showImportantAccounts: false,
    showOwnership: false,
    showPrimaryRecoveryAccounts: false,
    showReviewQueue: false,
    trustedShareAudienceKey: 'house_sitter',
    trustedShareSections: ['accessInfo', 'emergencyContacts', 'keyDevices'],
  },
  {
    key: 'emergency_helper',
    label: 'Emergency helper',
    description:
      'Show the incident-first view: access, who to call, the insurance/recovery basics, and the emergency-oriented playbooks someone needs during a real disruption.',
    authorityWarning:
      'Emergency helper view is for incident support. This person may still need adult approval before starting claims, changing account recovery, or sharing sensitive follow-up details further.',
    packetFocus: 'narrow',
    recommendedPlaybookIds: [
      'guide-home-lockout',
      'guide-internet-outage',
      'guide-insurance-incident',
      'guide-storm-prep',
      'guide-evacuation-readiness',
    ],
    showAdditionalPlaybooks: true,
    showCriticalDocuments: true,
    showDigitalSafety: false,
    showImportantAccounts: true,
    showOwnership: false,
    showPrimaryRecoveryAccounts: false,
    showReviewQueue: false,
    trustedShareAudienceKey: 'emergency_contact',
    trustedShareSections: ['accessInfo', 'emergencyContacts', 'insurance', 'recoveryNotes'],
  },
];

export function getEmergencyAudienceView(
  key: HomeVaultEmergencyAudienceKey,
): HomeVaultEmergencyAudienceView {
  return (
    HOMEVAULT_EMERGENCY_AUDIENCE_VIEWS.find((audience) => audience.key === key) ??
    HOMEVAULT_EMERGENCY_AUDIENCE_VIEWS[0]
  );
}
