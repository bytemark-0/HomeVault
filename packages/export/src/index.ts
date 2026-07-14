import {
  isDeviceAsset,
  type AccessItem,
  type Asset,
  type ContinuityPlaybook,
  type DocumentRecord,
  type EmergencyContact,
  type ImportantAccount,
  type MaintenanceTask,
  type PartSupply,
  type Property,
  type RepairEvent,
  type RoomArea,
  type TaskCompletion,
} from '@homevault/domain';

export type HomeVaultExportManifest = {
  app: 'HomeVault';
  version: 1;
  property: {
    id: string;
    label: string;
    type: Property['type'];
    yearBuilt?: number;
    purchaseDate?: string;
  };
  generatedAt: string;
  recordCounts: {
    rooms: number;
    assets: number;
    documents: number;
    accessItems: number;
    emergencyContacts: number;
    importantAccounts: number;
    continuityPlaybooks: number;
    tasks: number;
    taskCompletions: number;
    repairEvents: number;
    parts: number;
  };
  coverage: {
    activeTaskCount: number;
    attachedDocumentCount: number;
    linkedDocumentCount: number;
    documentedAssetCount: number;
    repairEventsWithCostCount: number;
  };
  sensitiveData: HomeVaultSensitiveDataSummary;
  checklist: HomeVaultExportChecklistItem[];
};

export type HomeVaultExportPackage = {
  manifest: HomeVaultExportManifest;
  attachments: HomeVaultExportAttachment[];
  records: {
    property: Property;
    rooms: RoomArea[];
    assets: Asset[];
    documents: DocumentRecord[];
    accessItems: AccessItem[];
    emergencyContacts: EmergencyContact[];
    importantAccounts: ImportantAccount[];
    continuityPlaybooks: ContinuityPlaybook[];
    tasks: MaintenanceTask[];
    taskCompletions: TaskCompletion[];
    repairEvents: RepairEvent[];
    parts: PartSupply[];
  };
};

export type HomeVaultExportAttachment = {
  documentId: string;
  title: string;
  attachedAt?: string;
  filePath: string;
  fileName?: string;
  linkedRecordIds: string[];
  mimeType?: string;
  sizeBytes?: number;
  storageKind?: NonNullable<DocumentRecord['attachment']>['storageKind'];
  type: DocumentRecord['type'];
};

export type HomeVaultExportValidationErrorKind =
  | 'not_json'
  | 'not_homevault'
  | 'version_unsupported'
  | 'malformed';

export type HomeVaultExportPackageValidation =
  | {
      ok: true;
      package: HomeVaultExportPackage;
      preview: HomeVaultImportPreview;
      summary: string;
    }
  | {
      ok: false;
      errorKind: HomeVaultExportValidationErrorKind;
      errors: string[];
    };

export type HomeVaultImportPreview = {
  attachmentCount: number;
  generatedAt: string;
  propertyLabel: string;
  recordCounts: HomeVaultExportManifest['recordCounts'];
  reviewItemCount: number;
  includesSensitiveData: boolean;
};

export type HomeVaultSensitiveDataSummary = {
  includesSensitiveData: boolean;
  accessItemCount: number;
  emergencyContactCount: number;
  importantAccountCount: number;
  assetSerialCount: number;
};

export type HomeVaultExportChecklistItem = {
  id:
    | 'rooms'
    | 'assets'
    | 'documents'
    | 'history'
    | 'tasks'
    | 'assetDocumentation'
    | 'attachments';
  label: string;
  state: 'ready' | 'review';
  detail: string;
  action: string;
};

export type BuildExportManifestInput = {
  property: Property;
  assets: Asset[];
  documents: DocumentRecord[];
  accessItems: AccessItem[];
  emergencyContacts: EmergencyContact[];
  importantAccounts: ImportantAccount[];
  continuityPlaybooks: ContinuityPlaybook[];
  parts: PartSupply[];
  repairEvents: RepairEvent[];
  rooms: RoomArea[];
  taskCompletions: TaskCompletion[];
  tasks: MaintenanceTask[];
  generatedAt?: string;
};

export type HomeVaultEmergencyPacket = {
  app: 'HomeVault';
  kind: 'emergency_packet';
  version: 1;
  generatedAt: string;
  property: HomeVaultExportManifest['property'];
  warning: string;
  summary: HomeVaultEmergencyPacketSummary;
  sections: {
    accessInfo: HomeVaultEmergencyPacketSection<HomeVaultEmergencyPacketAccessItem>;
    emergencyContacts: HomeVaultEmergencyPacketSection<HomeVaultEmergencyPacketEmergencyContact>;
    insurance: HomeVaultEmergencyPacketSection<HomeVaultEmergencyPacketImportantAccount>;
    keyDevices: HomeVaultEmergencyPacketDeviceSection;
    recoveryNotes: HomeVaultEmergencyPacketRecoverySection;
  };
  records: {
    accessItems: HomeVaultEmergencyPacketAccessItem[];
    emergencyContacts: HomeVaultEmergencyPacketEmergencyContact[];
    importantAccounts: HomeVaultEmergencyPacketImportantAccount[];
    keyDevices: HomeVaultEmergencyPacketDevice[];
    recoveryNotes: HomeVaultEmergencyPacketRecoveryNote[];
    continuityPlaybooks: ContinuityPlaybook[];
    documents: HomeVaultEmergencyPacketDocument[];
  };
};

export type HomeVaultEmergencyPacketSectionKey =
  | 'accessInfo'
  | 'emergencyContacts'
  | 'insurance'
  | 'keyDevices'
  | 'recoveryNotes';

export type HomeVaultEmergencyPacketSectionSummary = {
  key: HomeVaultEmergencyPacketSectionKey;
  title: string;
  itemCount: number;
  documentCount: number;
  status: 'ready' | 'missing';
  includes: string;
  emptyState: string;
};

export type HomeVaultEmergencyPacketSummary = {
  hasContent: boolean;
  containsSensitiveValues: boolean;
  includedSectionCount: number;
  missingSectionCount: number;
  includedSections: HomeVaultEmergencyPacketSectionSummary[];
  missingSections: HomeVaultEmergencyPacketSectionSummary[];
};

export type HomeVaultEmergencyPacketSection<TItem> = {
  title: string;
  description: string;
  emptyState: string;
  items: TItem[];
  supportingDocuments: HomeVaultEmergencyPacketDocument[];
};

export type HomeVaultEmergencyPacketAccessItem = Pick<
  AccessItem,
  | 'id'
  | 'category'
  | 'label'
  | 'accessCode'
  | 'location'
  | 'instructions'
  | 'notes'
  | 'lastVerifiedAt'
> & {
  linkedAssetLabel?: string;
  linkedDocumentIds: string[];
};

export type HomeVaultEmergencyPacketEmergencyContact = EmergencyContact;

export type HomeVaultEmergencyPacketImportantAccount = Pick<
  ImportantAccount,
  | 'id'
  | 'kind'
  | 'providerName'
  | 'label'
  | 'website'
  | 'phone'
  | 'email'
  | 'mfaEnabled'
  | 'recoveryCodesStored'
  | 'managedInPasswordManager'
  | 'recoveryNotes'
> & {
  accountNumberLast4?: string;
  linkedDocumentIds: string[];
};

export type HomeVaultEmergencyPacketDocument = Pick<
  DocumentRecord,
  'id' | 'title' | 'type' | 'date' | 'vendor'
>;

export type HomeVaultEmergencyPacketDevice = Pick<
  Asset,
  | 'id'
  | 'name'
  | 'category'
  | 'brand'
  | 'model'
  | 'serial'
  | 'networkName'
  | 'internetProvider'
  | 'networkAdminUrl'
  | 'backupEnabled'
  | 'screenLockEnabled'
  | 'findMyDeviceEnabled'
  | 'notes'
> & {
  roomName?: string;
  linkedAccessItemIds: string[];
  linkedDocumentIds: string[];
};

export type HomeVaultEmergencyPacketDeviceSection = HomeVaultEmergencyPacketSection<HomeVaultEmergencyPacketDevice> & {
  linkedAccessItems: HomeVaultEmergencyPacketAccessItem[];
};

export type HomeVaultEmergencyPacketRecoveryNote = {
  id: string;
  label: string;
  detail: string;
  source: 'important_account' | 'playbook';
};

export type HomeVaultEmergencyPacketRecoverySection = {
  title: string;
  description: string;
  emptyState: string;
  notes: HomeVaultEmergencyPacketRecoveryNote[];
  playbooks: ContinuityPlaybook[];
  supportingDocuments: HomeVaultEmergencyPacketDocument[];
};

export type HomeVaultTrustedShareAudienceKey =
  | 'spouse'
  | 'house_sitter'
  | 'travel_handoff'
  | 'emergency_contact';

export type HomeVaultTrustedShareSectionKey = HomeVaultEmergencyPacketSectionKey;

export type HomeVaultTrustedShareAudience = {
  key: HomeVaultTrustedShareAudienceKey;
  label: string;
  description: string;
  recommendedSectionKeys: HomeVaultTrustedShareSectionKey[];
  scope: 'co_manager' | 'temporary' | 'emergency';
  reviewPrompt: string;
  checklist: string[];
};

export type HomeVaultTrustedShareSectionOption = {
  key: HomeVaultTrustedShareSectionKey;
  title: string;
  description: string;
  includes: string;
};

export type HomeVaultTrustedShareSectionState = 'included' | 'excluded' | 'empty';

export type HomeVaultTrustedShareSectionSummary = {
  key: HomeVaultTrustedShareSectionKey;
  title: string;
  itemCount: number;
  documentCount: number;
  state: HomeVaultTrustedShareSectionState;
  includes: string;
  rationale: string;
};

export type HomeVaultTrustedShareSection<TItem> = HomeVaultEmergencyPacketSection<TItem> & {
  included: boolean;
  state: HomeVaultTrustedShareSectionState;
  rationale: string;
};

export type HomeVaultTrustedShareDeviceSection = HomeVaultEmergencyPacketDeviceSection & {
  included: boolean;
  state: HomeVaultTrustedShareSectionState;
  rationale: string;
};

export type HomeVaultTrustedShareRecoverySection = HomeVaultEmergencyPacketRecoverySection & {
  included: boolean;
  state: HomeVaultTrustedShareSectionState;
  rationale: string;
};

export type HomeVaultTrustedShareArtifact = {
  app: 'HomeVault';
  kind: 'trusted_share';
  version: 1;
  generatedAt: string;
  property: HomeVaultExportManifest['property'];
  audience: HomeVaultTrustedShareAudience;
  warning: string;
  v1Notice: string;
  tradeoffs: {
    localFirst: string;
    liveAccess: string;
    futureDirection: string;
  };
  selections: Record<HomeVaultTrustedShareSectionKey, boolean>;
  summary: {
    hasContent: boolean;
    containsSensitiveValues: boolean;
    includedSectionCount: number;
    omittedSectionCount: number;
    includedSections: HomeVaultTrustedShareSectionSummary[];
    omittedSections: HomeVaultTrustedShareSectionSummary[];
  };
  sections: {
    accessInfo: HomeVaultTrustedShareSection<HomeVaultEmergencyPacketAccessItem>;
    emergencyContacts: HomeVaultTrustedShareSection<HomeVaultEmergencyPacketEmergencyContact>;
    insurance: HomeVaultTrustedShareSection<HomeVaultEmergencyPacketImportantAccount>;
    keyDevices: HomeVaultTrustedShareDeviceSection;
    recoveryNotes: HomeVaultTrustedShareRecoverySection;
  };
  records: {
    accessItems: HomeVaultEmergencyPacketAccessItem[];
    emergencyContacts: HomeVaultEmergencyPacketEmergencyContact[];
    importantAccounts: HomeVaultEmergencyPacketImportantAccount[];
    keyDevices: HomeVaultEmergencyPacketDevice[];
    linkedAccessItems: HomeVaultEmergencyPacketAccessItem[];
    recoveryNotes: HomeVaultEmergencyPacketRecoveryNote[];
    continuityPlaybooks: ContinuityPlaybook[];
    documents: HomeVaultEmergencyPacketDocument[];
  };
};

export type BuildHomeVaultTrustedShareOptions = {
  audience: HomeVaultTrustedShareAudienceKey;
  includeSections?: HomeVaultTrustedShareSectionKey[];
};

export type HomeVaultItemShareAudienceKey =
  | 'spouse'
  | 'house_sitter'
  | 'emergency_helper'
  | 'contractor'
  | 'other';

export type HomeVaultItemShareRecordType =
  | 'access_item'
  | 'emergency_contact'
  | 'important_account'
  | 'asset'
  | 'document'
  | 'continuity_playbook';

export type HomeVaultItemShareBundleItem = {
  recordType: HomeVaultItemShareRecordType;
  recordId: string;
  label: string;
  linkedRecordIds: string[];
  includedFieldIds: string[];
  omittedFieldIds: string[];
};

export type HomeVaultItemShareBundlePayload = {
  property: Pick<Property, 'id' | 'label' | 'type'>;
  records: {
    accessItems: AccessItem[];
    emergencyContacts: EmergencyContact[];
    importantAccounts: ImportantAccount[];
    assets: Asset[];
    documents: DocumentRecord[];
    continuityPlaybooks: ContinuityPlaybook[];
  };
  omittedFieldIdsByRecordId: Record<string, string[]>;
  readOnly: true;
};

export type HomeVaultItemShareBundle = {
  app: 'HomeVault';
  kind: 'item_share_bundle';
  version: 1;
  provenance: {
    senderLabel: string;
    householdLabel: string;
    audienceLabel: string;
    audienceKey: HomeVaultItemShareAudienceKey;
    generatedAt: string;
    expiresAt?: string;
    readOnly: true;
  };
  contents: {
    primaryRecordType: HomeVaultItemShareRecordType;
    itemCount: number;
    linkedRecordCount: number;
    omittedFieldCount: number;
    items: HomeVaultItemShareBundleItem[];
  };
  encryption: {
    scheme: 'aes-256-gcm';
    keyDerivation: 'pbkdf2-sha256';
    iterations: number;
    saltBase64: string;
    ivBase64: string;
    ciphertextBase64: string;
  };
};

export type BuildHomeVaultItemShareBundleInput = {
  property: Pick<Property, 'id' | 'label' | 'type'>;
  senderLabel: string;
  audience: {
    key: HomeVaultItemShareAudienceKey;
    label: string;
  };
  expiresAt?: string;
  generatedAt?: string;
  items: HomeVaultItemShareBundleItem[];
  encryption: HomeVaultItemShareBundle['encryption'];
};

export type HomeVaultItemShareBundleValidationErrorKind =
  | 'not_json'
  | 'not_homevault'
  | 'version_unsupported'
  | 'malformed';

export type HomeVaultItemShareBundleImportPreview = {
  senderLabel: string;
  householdLabel: string;
  audienceLabel: string;
  audienceKey: HomeVaultItemShareAudienceKey;
  generatedAt: string;
  expiresAt: string | null;
  readOnly: true;
  primaryRecordType: HomeVaultItemShareRecordType;
  itemCount: number;
  linkedRecordCount: number;
  omittedFieldCount: number;
  items: HomeVaultItemShareBundleItem[];
};

export type HomeVaultItemShareBundleValidation =
  | {
      ok: true;
      bundle: HomeVaultItemShareBundle;
      preview: HomeVaultItemShareBundleImportPreview;
      summary: string;
    }
  | {
      ok: false;
      errorKind: HomeVaultItemShareBundleValidationErrorKind;
      errors: string[];
    };

export type HomeVaultOfflineCompanionPackTargetKey = 'primary_user' | 'helper_device';

export type HomeVaultOfflineCompanionPackSection = {
  key: HomeVaultEmergencyPacketSectionKey;
  title: string;
  state: 'included' | 'omitted' | 'missing';
  source: 'emergency_packet' | 'trusted_share';
  itemCount: number;
  documentCount: number;
  rationale: string;
};

export type HomeVaultOfflineCompanionPack = {
  app: 'HomeVault';
  kind: 'offline_companion_pack';
  version: 1;
  generatedAt: string;
  property: HomeVaultExportManifest['property'];
  target: {
    key: HomeVaultOfflineCompanionPackTargetKey;
    label: string;
    description: string;
  };
  readOnly: true;
  unlock: {
    mode: 'device_local_when_available';
    detail: string;
  };
  warnings: {
    staleness: string;
    rotation: string;
    deviceLoss: string;
  };
  derivedFrom: {
    emergencyPacketVersion: HomeVaultEmergencyPacket['version'];
    trustedShareAudienceKey: HomeVaultTrustedShareAudienceKey;
    trustedShareVersion: HomeVaultTrustedShareArtifact['version'];
  };
  summary: {
    containsSensitiveValues: boolean;
    contactCount: number;
    documentCount: number;
    incidentCount: number;
    includedSectionCount: number;
    omittedSectionCount: number;
    missingSectionCount: number;
    recordCount: number;
  };
  sections: HomeVaultOfflineCompanionPackSection[];
  records: {
    accessItems: HomeVaultEmergencyPacketAccessItem[];
    emergencyContacts: HomeVaultEmergencyPacketEmergencyContact[];
    importantAccounts: HomeVaultEmergencyPacketImportantAccount[];
    keyDevices: HomeVaultEmergencyPacketDevice[];
    linkedAccessItems: HomeVaultEmergencyPacketAccessItem[];
    recoveryNotes: HomeVaultEmergencyPacketRecoveryNote[];
    continuityPlaybooks: ContinuityPlaybook[];
    documents: HomeVaultEmergencyPacketDocument[];
  };
};

export type BuildHomeVaultOfflineCompanionPackOptions = {
  generatedAt?: string;
  target: HomeVaultOfflineCompanionPackTargetKey;
};

export type HomeVaultCareCardTemplateKey =
  | 'child'
  | 'pet'
  | 'elder'
  | 'medical_dependent';

export type HomeVaultCareCardAudienceKey =
  | 'caregiver'
  | 'temporary_helper'
  | 'family_support'
  | 'medical_support';

export type HomeVaultCaregiverAudienceKey =
  | 'grandparent'
  | 'babysitter'
  | 'pet_sitter'
  | 'elder_helper';

export type HomeVaultCareCardSensitivityLevel = 'medium' | 'high';

export type HomeVaultCareCardMedication = {
  label: string;
  dose?: string;
  schedule?: string;
  instructions?: string;
  isCritical?: boolean;
};

export type HomeVaultCareCardRoutine = {
  label: string;
  timeLabel?: string;
  detail: string;
};

export type HomeVaultCareCardProviderContact = {
  label: string;
  role: string;
  phone?: string;
  email?: string;
  notes?: string;
};

export type HomeVaultCareCardMissingPrompt = {
  id: string;
  label: string;
  detail: string;
  severity: 'medium' | 'high';
};

export type HomeVaultCareCard = {
  app: 'HomeVault';
  kind: 'care_card';
  version: 1;
  generatedAt: string;
  property: Pick<Property, 'id' | 'label' | 'type'>;
  template: {
    key: HomeVaultCareCardTemplateKey;
    label: string;
    description: string;
  };
  subject: {
    name: string;
    descriptor?: string;
  };
  warning: string;
  sensitivity: {
    level: HomeVaultCareCardSensitivityLevel;
    label: string;
    detail: string;
  };
  shareDefaults: {
    caregiverHandoff: {
      audienceKey: HomeVaultCareCardAudienceKey;
      audienceLabel: string;
      readOnly: true;
      mode: 'trusted_handoff';
      detail: string;
    };
    emergencySnapshot: {
      audienceKey: 'family_support' | 'medical_support';
      audienceLabel: string;
      readOnly: true;
      mode: 'emergency_packet';
      detail: string;
    };
  };
  summary: {
    medicationCount: number;
    routineCount: number;
    providerContactCount: number;
    emergencyContactCount: number;
    pickupRuleCount: number;
    schoolDetailCount: number;
    criticalNoteCount: number;
    missingPromptCount: number;
    hasHighRiskGap: boolean;
  };
  sections: {
    medications: HomeVaultCareCardMedication[];
    routines: HomeVaultCareCardRoutine[];
    pickupRules: string[];
    schoolDetails: string[];
    providerContacts: HomeVaultCareCardProviderContact[];
    emergencyContacts: EmergencyContact[];
    criticalNotes: string[];
  };
  missingPrompts: HomeVaultCareCardMissingPrompt[];
};

export type BuildHomeVaultCareCardInput = {
  property: Pick<Property, 'id' | 'label' | 'type'>;
  template: HomeVaultCareCardTemplateKey;
  subjectName: string;
  subjectDescriptor?: string;
  medications?: HomeVaultCareCardMedication[];
  routines?: HomeVaultCareCardRoutine[];
  pickupRules?: string[];
  schoolDetails?: string[];
  providerContacts?: HomeVaultCareCardProviderContact[];
  emergencyContacts?: EmergencyContact[];
  criticalNotes?: string[];
  generatedAt?: string;
};

export type HomeVaultCaregiverPlan = {
  app: 'HomeVault';
  kind: 'caregiver_plan';
  version: 1;
  generatedAt: string;
  expiresAt: string;
  property: Pick<Property, 'id' | 'label' | 'type'>;
  template: HomeVaultCareCard['template'];
  subject: HomeVaultCareCard['subject'];
  audience: {
    key: HomeVaultCaregiverAudienceKey;
    label: string;
    description: string;
  };
  warning: string;
  summary: {
    expiresInDays: number;
    routineCount: number;
    medicationCount: number;
    providerContactCount: number;
    pickupContactCount: number;
    schoolDetailCount: number;
    hasHighRiskGap: boolean;
  };
  scope: {
    allowedActions: string[];
    disallowedActions: string[];
  };
  linkedRecords: {
    pickupContacts: EmergencyContact[];
    providerContacts: HomeVaultCareCardProviderContact[];
    medications: HomeVaultCareCardMedication[];
    schoolDetails: string[];
  };
  reviewPrompts: string[];
  travelTransitionPrompts: string[];
  missingPrompts: HomeVaultCareCardMissingPrompt[];
};

export type BuildHomeVaultCaregiverPlanInput = {
  careCard: HomeVaultCareCard;
  audience: HomeVaultCaregiverAudienceKey;
  expiresInDays?: number;
  generatedAt?: string;
};

export type HomeVaultOfflineCompanionPackValidationErrorKind =
  | 'not_json'
  | 'not_homevault'
  | 'version_unsupported'
  | 'malformed';

export type HomeVaultOfflineCompanionPackImportPreview = {
  householdLabel: string;
  generatedAt: string;
  readOnly: true;
  target: HomeVaultOfflineCompanionPack['target'];
  unlock: HomeVaultOfflineCompanionPack['unlock'];
  warnings: HomeVaultOfflineCompanionPack['warnings'];
  derivedFrom: HomeVaultOfflineCompanionPack['derivedFrom'];
  summary: HomeVaultOfflineCompanionPack['summary'];
  sections: HomeVaultOfflineCompanionPackSection[];
};

export type HomeVaultOfflineCompanionPackValidation =
  | {
      ok: true;
      pack: HomeVaultOfflineCompanionPack;
      preview: HomeVaultOfflineCompanionPackImportPreview;
      summary: string;
    }
  | {
      ok: false;
      errorKind: HomeVaultOfflineCompanionPackValidationErrorKind;
      errors: string[];
    };

export const HOMEVAULT_TRUSTED_SHARE_AUDIENCES: HomeVaultTrustedShareAudience[] = [
  {
    key: 'spouse',
    label: 'Spouse or partner',
    description: 'Prepare a broad handoff for the person most likely to co-manage the household.',
    recommendedSectionKeys: [
      'accessInfo',
      'emergencyContacts',
      'insurance',
      'keyDevices',
      'recoveryNotes',
    ],
    scope: 'co_manager',
    reviewPrompt:
      'Use this when the other person may need the fuller household picture, not just temporary access while you are away.',
    checklist: [
      'Review any stale access codes or recovery notes before you share.',
      'Confirm the other person can already identify the right property and core records.',
      'Rotate the handoff again after a major account, lock, or contact change.',
    ],
  },
  {
    key: 'house_sitter',
    label: 'House sitter',
    description: 'Share only the access, contact, and device details needed to keep the home running.',
    recommendedSectionKeys: ['accessInfo', 'emergencyContacts', 'keyDevices'],
    scope: 'temporary',
    reviewPrompt:
      'Use this for temporary helper coverage. It intentionally leaves out insurance and recovery guidance unless you choose to add them.',
    checklist: [
      'Review door, gate, garage, and Wi-Fi details before the sitter arrives.',
      'Confirm the first-call neighbor, family member, or service contact is still correct.',
      'Rotate time-limited codes or notes after the sitter no longer needs access.',
    ],
  },
  {
    key: 'travel_handoff',
    label: 'Travel handoff',
    description: 'Prepare a lighter temporary handoff before extended travel or planned absence.',
    recommendedSectionKeys: ['accessInfo', 'emergencyContacts', 'keyDevices'],
    scope: 'temporary',
    reviewPrompt:
      'Use this before a trip so a trusted person can help with routine issues without receiving the fuller emergency packet by default.',
    checklist: [
      'Review entry notes, shutoff locations, and Wi-Fi details before you leave.',
      'Confirm the helper knows when to call you first versus when to act on their own.',
      'Refresh the handoff if travel dates, pet care, or temporary codes change.',
    ],
  },
  {
    key: 'emergency_contact',
    label: 'Emergency contact',
    description: 'Share the details someone needs to help during an incident without giving them everything else.',
    recommendedSectionKeys: ['accessInfo', 'emergencyContacts', 'insurance', 'recoveryNotes'],
    scope: 'emergency',
    reviewPrompt:
      'Use this when someone needs the emergency essentials for a real incident, not a normal absence.',
    checklist: [
      'Review claims contacts, recovery notes, and the helper list before sharing.',
      'Confirm the recipient understands this is a static document, not live account access.',
      'Replace the handoff after any incident that exposes codes, locations, or recovery details.',
    ],
  },
];

export const HOMEVAULT_TRUSTED_SHARE_SECTION_OPTIONS: HomeVaultTrustedShareSectionOption[] = [
  {
    key: 'accessInfo',
    title: 'Access info',
    description: 'Door codes, Wi-Fi details, entry notes, and utility shutoff guidance.',
    includes: 'Door codes, Wi-Fi details, shutoffs, and entry notes.',
  },
  {
    key: 'emergencyContacts',
    title: 'Emergency contacts',
    description: 'Neighbors, family, and service contacts to call first.',
    includes: 'Neighbors, family, and service providers to contact first.',
  },
  {
    key: 'insurance',
    title: 'Insurance',
    description: 'Claims contacts, policy references, and supporting paperwork.',
    includes: 'Policy references, claims contacts, and related paperwork.',
  },
  {
    key: 'keyDevices',
    title: 'Key devices',
    description: 'Routers, phones, and other devices that keep the household connected.',
    includes: 'Routers, phones, and critical connectivity devices.',
  },
  {
    key: 'recoveryNotes',
    title: 'Recovery notes',
    description: 'Account recovery guidance and continuity playbooks.',
    includes: 'Account recovery guidance and continuity playbooks.',
  },
];

export const HOMEVAULT_CARE_CARD_TEMPLATES: Array<{
  key: HomeVaultCareCardTemplateKey;
  label: string;
  description: string;
  caregiverAudienceKey: HomeVaultCareCardAudienceKey;
  caregiverAudienceLabel: string;
  emergencyAudienceKey: 'family_support' | 'medical_support';
  emergencyAudienceLabel: string;
}> = [
  {
    key: 'child',
    label: 'Child care card',
    description:
      'Prepare the school, pickup, routine, and emergency details a trusted adult needs for a child.',
    caregiverAudienceKey: 'caregiver',
    caregiverAudienceLabel: 'Caregiver',
    emergencyAudienceKey: 'family_support',
    emergencyAudienceLabel: 'Family support',
  },
  {
    key: 'pet',
    label: 'Pet care card',
    description:
      'Prepare feeding, medication, vet, and behavior notes for someone helping with a pet.',
    caregiverAudienceKey: 'temporary_helper',
    caregiverAudienceLabel: 'Pet helper',
    emergencyAudienceKey: 'family_support',
    emergencyAudienceLabel: 'Emergency pet support',
  },
  {
    key: 'elder',
    label: 'Elder support card',
    description:
      'Prepare routine, provider, medication, and contact details for an elder-support handoff.',
    caregiverAudienceKey: 'caregiver',
    caregiverAudienceLabel: 'Support caregiver',
    emergencyAudienceKey: 'medical_support',
    emergencyAudienceLabel: 'Emergency support',
  },
  {
    key: 'medical_dependent',
    label: 'Medical-dependent care card',
    description:
      'Prepare medication, provider, routine, and escalation details for a medically sensitive dependent.',
    caregiverAudienceKey: 'medical_support',
    caregiverAudienceLabel: 'Medical caregiver',
    emergencyAudienceKey: 'medical_support',
    emergencyAudienceLabel: 'Emergency medical support',
  },
];

export const HOMEVAULT_CAREGIVER_PLAN_AUDIENCES: Array<{
  key: HomeVaultCaregiverAudienceKey;
  label: string;
  description: string;
  defaultExpiryDays: number;
  allowedActions: string[];
  disallowedActions: string[];
  reviewPrompts: string[];
  travelTransitionPrompts: string[];
}> = [
  {
    key: 'grandparent',
    label: 'Grandparent helper',
    description:
      'A family helper who may handle pickup, meals, bedtime, and the first escalation steps.',
    defaultExpiryDays: 14,
    allowedActions: [
      'Follow the daily routine and medication notes exactly as written.',
      'Use approved pickup and release rules for school, care, or activity transitions.',
      'Call the listed family and provider contacts if something feels off.',
    ],
    disallowedActions: [
      'Do not improvise medication changes or skip escalation steps.',
      'Do not hand off the dependent to an unlisted adult without confirmation.',
      'Do not share the care card beyond the trusted family circle.',
    ],
    reviewPrompts: [
      'Confirm pickup permissions, allergy notes, and after-school routine details before sharing.',
      'Check that all listed family contacts still expect to be part of the backup plan.',
    ],
    travelTransitionPrompts: [
      'Refresh dates, pickup logistics, and nighttime routine changes before the caregiver period starts.',
      'Reissue the handoff if travel, school, or custody timing changes.',
    ],
  },
  {
    key: 'babysitter',
    label: 'Babysitter',
    description:
      'A short-term childcare helper who needs the routine, pickup rules, and clear escalation boundaries first.',
    defaultExpiryDays: 3,
    allowedActions: [
      'Follow the meal, bedtime, and handoff routine for this short coverage window.',
      'Use only the listed emergency contacts and approved provider numbers.',
      'Escalate quickly when a critical note or medication instruction says to do so.',
    ],
    disallowedActions: [
      'Do not transport, medicate, or release the child beyond what this plan explicitly allows.',
      'Do not make account, school, or custody decisions.',
      'Do not keep the plan after the shift or reuse it for a future date without a refresh.',
    ],
    reviewPrompts: [
      'Review arrival, departure, and bedtime expectations before the sitter arrives.',
      'Confirm the sitter understands what requires an immediate call versus a routine update.',
    ],
    travelTransitionPrompts: [
      'Replace the handoff after any change to who is home, who can pick up, or how late coverage may run.',
      'Refresh the plan before trips, overnights, or a new sitter transition.',
    ],
  },
  {
    key: 'pet_sitter',
    label: 'Pet sitter',
    description:
      'A pet helper who needs feeding, medication, behavior, and vet guidance without the broader household system.',
    defaultExpiryDays: 7,
    allowedActions: [
      'Follow feeding, walk, medication, and entry instructions exactly as written.',
      'Call the vet or emergency contact when behavior or symptoms match the critical notes.',
      'Use only the listed home-entry and pet-care steps for this assignment.',
    ],
    disallowedActions: [
      'Do not change medication timing, food, or crate rules without confirmation.',
      'Do not share entry or care details with another helper unless the household approves it.',
      'Do not keep the handoff active after the pet-care window ends.',
    ],
    reviewPrompts: [
      'Review gate, leash, feeding, litter, and medication details before the sitter window begins.',
      'Confirm the helper knows when to call the vet, the owner, or the first backup contact.',
    ],
    travelTransitionPrompts: [
      'Refresh the plan before trips, boarding changes, or a new sitter rotation.',
      'Rotate entry and care details after the sitter no longer needs access.',
    ],
  },
  {
    key: 'elder_helper',
    label: 'Elder helper',
    description:
      'A temporary adult helper who needs routine, medication, and provider context while staying inside clear authority limits.',
    defaultExpiryDays: 7,
    allowedActions: [
      'Follow the daily support routine and medication schedule exactly as documented.',
      'Use the listed provider and family contacts when symptoms, confusion, or logistics change.',
      'Escalate to emergency or medical support when the critical notes say not to wait.',
    ],
    disallowedActions: [
      'Do not change medication, bills, or legal decisions without explicit approval.',
      'Do not transport or release information beyond the listed support circle.',
      'Do not rely on an expired version of the plan for a new care window.',
    ],
    reviewPrompts: [
      'Review mobility, timing, and provider-call expectations before the helper takes over.',
      'Confirm the helper understands which choices are support-only and which require family approval.',
    ],
    travelTransitionPrompts: [
      'Refresh the plan before respite care, hospital discharge, or any caregiver changeover.',
      'Replace the plan after provider, medication, or support-network changes.',
    ],
  },
];

export const HOMEVAULT_ITEM_SHARE_AUDIENCES: Array<{
  key: HomeVaultItemShareAudienceKey;
  label: string;
}> = [
  { key: 'spouse', label: 'Spouse or partner' },
  { key: 'house_sitter', label: 'House sitter' },
  { key: 'emergency_helper', label: 'Emergency helper' },
  { key: 'contractor', label: 'Contractor' },
  { key: 'other', label: 'Other trusted person' },
];

export function buildHomeVaultExportManifest({
  property,
  assets,
  documents,
  accessItems,
  emergencyContacts,
  importantAccounts,
  continuityPlaybooks,
  parts,
  repairEvents,
  rooms,
  taskCompletions,
  tasks,
  generatedAt = new Date().toISOString(),
}: BuildExportManifestInput): HomeVaultExportManifest {
  const activeTaskCount = tasks.filter((task) => task.state !== 'completed').length;
  const attachedDocumentCount = documents.filter((document) => getDocumentAttachmentUri(document)).length;
  const linkedDocumentCount = documents.filter(
    (document) => document.linkedRecordIds.length > 0,
  ).length;
  const documentedAssetCount = assets.filter((asset) =>
    documents.some((document) => document.linkedRecordIds.includes(asset.id)),
  ).length;
  const repairEventsWithCostCount = repairEvents.filter(
    (repairEvent) => repairEvent.costCents !== undefined,
  ).length;

  return {
    app: 'HomeVault',
    version: 1,
    property: {
      id: property.id,
      label: property.label,
      type: property.type,
      yearBuilt: property.yearBuilt,
      purchaseDate: property.purchaseDate,
    },
    generatedAt,
    recordCounts: {
      rooms: rooms.length,
      assets: assets.length,
      documents: documents.length,
      accessItems: accessItems.length,
      emergencyContacts: emergencyContacts.length,
      importantAccounts: importantAccounts.length,
      continuityPlaybooks: continuityPlaybooks.length,
      tasks: tasks.length,
      taskCompletions: taskCompletions.length,
      repairEvents: repairEvents.length,
      parts: parts.length,
    },
    coverage: {
      activeTaskCount,
      attachedDocumentCount,
      linkedDocumentCount,
      documentedAssetCount,
      repairEventsWithCostCount,
    },
    sensitiveData: summarizeSensitiveData({
      accessItems,
      assets,
      emergencyContacts,
      importantAccounts,
    }),
    checklist: buildExportChecklist({
      activeTaskCount,
      attachedDocumentCount,
      assetCount: assets.length,
      documentCount: documents.length,
      documentedAssetCount,
      linkedDocumentCount,
      repairEventCount: repairEvents.length,
      repairEventsWithCostCount,
      roomCount: rooms.length,
      taskCompletionCount: taskCompletions.length,
    }),
  };
}

export function formatHomeVaultExportManifest(manifest: HomeVaultExportManifest): string {
  return JSON.stringify(manifest, null, 2);
}

export function buildHomeVaultExportPackage(
  input: BuildExportManifestInput,
): HomeVaultExportPackage {
  return {
    manifest: buildHomeVaultExportManifest(input),
    attachments: buildExportAttachments(input.documents),
    records: {
      property: { ...input.property },
      rooms: input.rooms.map((room) => ({ ...room })),
      assets: input.assets.map((asset) => ({ ...asset })),
      documents: input.documents.map((document) => ({
        ...document,
        linkedRecordIds: [...document.linkedRecordIds],
      })),
      accessItems: input.accessItems.map((accessItem) => ({
        ...accessItem,
        linkedDocumentIds: [...accessItem.linkedDocumentIds],
      })),
      emergencyContacts: input.emergencyContacts.map((contact) => ({ ...contact })),
      importantAccounts: input.importantAccounts.map((account) => ({
        ...account,
        linkedDocumentIds: [...account.linkedDocumentIds],
      })),
      continuityPlaybooks: input.continuityPlaybooks.map((playbook) => ({
        ...playbook,
        steps: playbook.steps.map((step) => ({ ...step })),
        linkedRecordIds: [...playbook.linkedRecordIds],
      })),
      tasks: input.tasks.map((task) => ({ ...task })),
      taskCompletions: input.taskCompletions.map((completion) => ({ ...completion })),
      repairEvents: input.repairEvents.map((repairEvent) => ({
        ...repairEvent,
        documentIds: [...repairEvent.documentIds],
      })),
      parts: input.parts.map((part) => ({ ...part })),
    },
  };
}

export function buildHomeVaultEmergencyPacket(
  input: BuildExportManifestInput,
): HomeVaultEmergencyPacket {
  const manifest = buildHomeVaultExportManifest(input);
  const assetById = new Map(input.assets.map((asset) => [asset.id, asset]));
  const roomById = new Map(input.rooms.map((room) => [room.id, room]));
  const documentById = new Map(input.documents.map((document) => [document.id, document]));
  const accessItems = input.accessItems.map((accessItem) => ({
    id: accessItem.id,
    category: accessItem.category,
    label: accessItem.label,
    accessCode: accessItem.accessCode,
    location: accessItem.location,
    instructions: accessItem.instructions,
    notes: accessItem.notes,
    lastVerifiedAt: accessItem.lastVerifiedAt,
    linkedAssetLabel: accessItem.linkedAssetId
      ? assetById.get(accessItem.linkedAssetId)?.name
      : undefined,
    linkedDocumentIds: [...accessItem.linkedDocumentIds],
  }));
  const emergencyContacts = input.emergencyContacts.map((contact) => ({ ...contact }));
  const importantAccounts = input.importantAccounts.map((account) => ({
    id: account.id,
    kind: account.kind,
    providerName: account.providerName,
    label: account.label,
    website: account.website,
    phone: account.phone,
    email: account.email,
    mfaEnabled: account.mfaEnabled,
    recoveryCodesStored: account.recoveryCodesStored,
    managedInPasswordManager: account.managedInPasswordManager,
    recoveryNotes: account.recoveryNotes,
    accountNumberLast4: maskAccountNumber(account.accountNumber),
    linkedDocumentIds: [...account.linkedDocumentIds],
  }));
  const continuityPlaybooks = input.continuityPlaybooks.map((playbook) => ({
    ...playbook,
    steps: playbook.steps.map((step) => ({ ...step })),
    linkedRecordIds: [...playbook.linkedRecordIds],
  }));
  const keyDevices = buildEmergencyPacketDevices(input, roomById);
  const recoveryNotes = buildEmergencyPacketRecoveryNotes(importantAccounts, continuityPlaybooks);

  const accessDocumentIds = collectDocumentIds(accessItems.map((item) => item.linkedDocumentIds));
  const insuranceAccounts = importantAccounts.filter((account) => account.kind === 'insurance');
  const insuranceDocumentIds = collectDocumentIds(
    insuranceAccounts.map((account) => account.linkedDocumentIds),
  );
  const deviceDocumentIds = collectDocumentIds(
    keyDevices.map((device) => device.linkedDocumentIds),
    accessItems
      .filter(
        (accessItem) =>
          accessItem.category === 'wifi' ||
          accessItem.category === 'router' ||
          keyDevices.some((device) => device.linkedAccessItemIds.includes(accessItem.id)),
      )
      .map((accessItem) => accessItem.linkedDocumentIds),
  );
  const recoveryDocumentIds = collectDocumentIds(
    importantAccounts
      .filter((account) => Boolean(account.recoveryNotes))
      .map((account) => account.linkedDocumentIds),
    continuityPlaybooks.map((playbook) =>
      playbook.linkedRecordIds.filter((recordId) => documentById.has(recordId)),
    ),
  );
  const linkedDocumentIds = collectDocumentIds(
    accessItems.map((item) => item.linkedDocumentIds),
    importantAccounts.map((account) => account.linkedDocumentIds),
    keyDevices.map((device) => device.linkedDocumentIds),
    continuityPlaybooks.map((playbook) =>
      playbook.linkedRecordIds.filter((recordId) => documentById.has(recordId)),
    ),
  );
  const documents = toEmergencyPacketDocuments(input.documents.filter((document) => linkedDocumentIds.has(document.id)));
  const deviceAccessItems = accessItems.filter(
    (accessItem) =>
      accessItem.category === 'wifi' ||
      accessItem.category === 'router' ||
      keyDevices.some((device) => device.linkedAccessItemIds.includes(accessItem.id)),
  );
  const sections = {
    accessInfo: {
      title: 'Access info',
      description: 'Door codes, Wi-Fi details, shutoffs, and entry instructions needed quickly.',
      emptyState: 'No access records are saved yet.',
      items: accessItems,
      supportingDocuments: toDocumentsById(documentById, accessDocumentIds),
    },
    emergencyContacts: {
      title: 'Emergency contacts',
      description: 'Trusted people and service contacts to call first.',
      emptyState: 'No emergency contacts are saved yet.',
      items: emergencyContacts,
      supportingDocuments: [],
    },
    insurance: {
      title: 'Insurance',
      description: 'Claims contacts, policy references, and related documents.',
      emptyState: 'No insurance records are saved yet.',
      items: insuranceAccounts,
      supportingDocuments: toDocumentsById(documentById, insuranceDocumentIds),
    },
    keyDevices: {
      title: 'Key devices',
      description: 'Routers, phones, and other devices that keep the household connected.',
      emptyState: 'No key devices or router records are saved yet.',
      items: keyDevices,
      linkedAccessItems: deviceAccessItems,
      supportingDocuments: toDocumentsById(documentById, deviceDocumentIds),
    },
    recoveryNotes: {
      title: 'Recovery notes',
      description: 'Account recovery guidance and response playbooks for common incidents.',
      emptyState: 'No recovery notes or continuity playbooks are saved yet.',
      notes: recoveryNotes,
      playbooks: continuityPlaybooks,
      supportingDocuments: toDocumentsById(documentById, recoveryDocumentIds),
    },
  } satisfies HomeVaultEmergencyPacket['sections'];
  const sectionSummaries = buildEmergencyPacketSectionSummaries(sections);

  return {
    app: 'HomeVault',
    kind: 'emergency_packet',
    version: 1,
    generatedAt: manifest.generatedAt,
    property: { ...manifest.property },
    warning:
      'This packet may include access codes, recovery instructions, and contact details. Share it only with trusted people and store it securely.',
    summary: {
      hasContent: sectionSummaries.some((section) => section.status === 'ready'),
      containsSensitiveValues: manifest.sensitiveData.includesSensitiveData,
      includedSectionCount: sectionSummaries.filter((section) => section.status === 'ready').length,
      missingSectionCount: sectionSummaries.filter((section) => section.status === 'missing').length,
      includedSections: sectionSummaries.filter((section) => section.status === 'ready'),
      missingSections: sectionSummaries.filter((section) => section.status === 'missing'),
    },
    sections,
    records: {
      accessItems,
      emergencyContacts,
      importantAccounts,
      keyDevices,
      recoveryNotes,
      continuityPlaybooks,
      documents,
    },
  };
}

export function buildHomeVaultTrustedShareArtifact(
  input: BuildExportManifestInput,
  options: BuildHomeVaultTrustedShareOptions,
): HomeVaultTrustedShareArtifact {
  const manifest = buildHomeVaultExportManifest(input);
  const emergencyPacket = buildHomeVaultEmergencyPacket(input);
  const audience = getTrustedShareAudience(options.audience);
  const selections = buildTrustedShareSelections(audience, options.includeSections);
  const sectionSummaries = buildEmergencyPacketSectionSummaries(emergencyPacket.sections);
  const sectionSummaryByKey = new Map(sectionSummaries.map((section) => [section.key, section]));

  const accessInfo = buildTrustedShareStandardSection(
    emergencyPacket.sections.accessInfo,
    sectionSummaryByKey.get('accessInfo'),
    selections.accessInfo,
  );
  const emergencyContacts = buildTrustedShareStandardSection(
    emergencyPacket.sections.emergencyContacts,
    sectionSummaryByKey.get('emergencyContacts'),
    selections.emergencyContacts,
  );
  const insurance = buildTrustedShareStandardSection(
    emergencyPacket.sections.insurance,
    sectionSummaryByKey.get('insurance'),
    selections.insurance,
  );
  const keyDevices = buildTrustedShareDeviceSection(
    emergencyPacket.sections.keyDevices,
    sectionSummaryByKey.get('keyDevices'),
    selections.keyDevices,
  );
  const recoveryNotes = buildTrustedShareRecoverySection(
    emergencyPacket.sections.recoveryNotes,
    sectionSummaryByKey.get('recoveryNotes'),
    selections.recoveryNotes,
  );
  const trustedSections = {
    accessInfo,
    emergencyContacts,
    insurance,
    keyDevices,
    recoveryNotes,
  } satisfies HomeVaultTrustedShareArtifact['sections'];
  const trustedSectionSummaries = buildTrustedShareSectionSummaries(trustedSections);
  const linkedDocumentIds = collectDocumentIds(
    accessInfo.included ? accessInfo.supportingDocuments.map((document) => [document.id]) : [],
    insurance.included ? insurance.supportingDocuments.map((document) => [document.id]) : [],
    keyDevices.included ? keyDevices.supportingDocuments.map((document) => [document.id]) : [],
    recoveryNotes.included
      ? recoveryNotes.supportingDocuments.map((document) => [document.id])
      : [],
  );

  return {
    app: 'HomeVault',
    kind: 'trusted_share',
    version: 1,
    generatedAt: manifest.generatedAt,
    property: { ...manifest.property },
    audience,
    warning:
      'This handoff may include codes, contact details, or recovery notes. Share it only with the intended trusted person and replace it when details change.',
    v1Notice:
      'Trusted share v1 is a document-based handoff from this device. It is not live collaborative access and it will not stay up to date after you send it.',
    tradeoffs: {
      localFirst:
        'This local-first export keeps control on your device and avoids building account sync before the household data model is ready.',
      liveAccess:
        'People who receive this handoff cannot browse the app, collaborate live, or receive updates unless you send a new version.',
      futureDirection:
        'Future account-based sharing can add permissions, revocation, and live updates. This v1 flow is intentionally simpler and static.',
    },
    selections,
    summary: {
      hasContent: trustedSectionSummaries.some((section) => section.state === 'included'),
      containsSensitiveValues: manifest.sensitiveData.includesSensitiveData,
      includedSectionCount: trustedSectionSummaries.filter((section) => section.state === 'included')
        .length,
      omittedSectionCount: trustedSectionSummaries.filter((section) => section.state !== 'included')
        .length,
      includedSections: trustedSectionSummaries.filter((section) => section.state === 'included'),
      omittedSections: trustedSectionSummaries.filter((section) => section.state !== 'included'),
    },
    sections: trustedSections,
    records: {
      accessItems: accessInfo.included ? accessInfo.items : [],
      emergencyContacts: emergencyContacts.included ? emergencyContacts.items : [],
      importantAccounts: insurance.included ? insurance.items : [],
      keyDevices: keyDevices.included ? keyDevices.items : [],
      linkedAccessItems: keyDevices.included ? keyDevices.linkedAccessItems : [],
      recoveryNotes: recoveryNotes.included ? recoveryNotes.notes : [],
      continuityPlaybooks: recoveryNotes.included ? recoveryNotes.playbooks : [],
      documents: [
        ...linkedDocumentIds,
      ].map((documentId) => emergencyPacket.records.documents.find((document) => document.id === documentId)).filter(
        (document): document is HomeVaultEmergencyPacketDocument => Boolean(document),
      ),
    },
  };
}

export function buildHomeVaultItemShareBundle(
  input: BuildHomeVaultItemShareBundleInput,
): HomeVaultItemShareBundle {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const primaryRecordType = input.items[0]?.recordType ?? 'document';
  const linkedRecordCount = sumUniqueLengths(input.items.map((item) => item.linkedRecordIds));
  const omittedFieldCount = sumUniqueLengths(input.items.map((item) => item.omittedFieldIds));

  return {
    app: 'HomeVault',
    kind: 'item_share_bundle',
    version: 1,
    provenance: {
      senderLabel: input.senderLabel,
      householdLabel: input.property.label,
      audienceLabel: input.audience.label,
      audienceKey: input.audience.key,
      generatedAt,
      expiresAt: input.expiresAt,
      readOnly: true,
    },
    contents: {
      primaryRecordType,
      itemCount: input.items.length,
      linkedRecordCount,
      omittedFieldCount,
      items: input.items.map((item) => ({
        ...item,
        linkedRecordIds: [...item.linkedRecordIds],
        includedFieldIds: [...item.includedFieldIds],
        omittedFieldIds: [...item.omittedFieldIds],
      })),
    },
    encryption: { ...input.encryption },
  };
}

export function buildHomeVaultOfflineCompanionPack(
  input: BuildExportManifestInput,
  options: BuildHomeVaultOfflineCompanionPackOptions,
): HomeVaultOfflineCompanionPack {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const normalizedInput = { ...input, generatedAt };
  const emergencyPacket = buildHomeVaultEmergencyPacket(normalizedInput);
  const helperShare = buildHomeVaultTrustedShareArtifact(normalizedInput, {
    audience: 'emergency_contact',
  });
  const target = getOfflineCompanionTarget(options.target);
  const sourceRecords =
    options.target === 'primary_user'
      ? {
          accessItems: emergencyPacket.records.accessItems,
          emergencyContacts: emergencyPacket.records.emergencyContacts,
          importantAccounts: emergencyPacket.records.importantAccounts,
          keyDevices: emergencyPacket.records.keyDevices,
          linkedAccessItems: emergencyPacket.sections.keyDevices.linkedAccessItems,
          recoveryNotes: emergencyPacket.records.recoveryNotes,
          continuityPlaybooks: emergencyPacket.records.continuityPlaybooks,
          documents: emergencyPacket.records.documents,
        }
      : {
          accessItems: helperShare.records.accessItems,
          emergencyContacts: helperShare.records.emergencyContacts,
          importantAccounts: helperShare.records.importantAccounts,
          keyDevices: helperShare.records.keyDevices,
          linkedAccessItems: helperShare.records.linkedAccessItems,
          recoveryNotes: helperShare.records.recoveryNotes,
          continuityPlaybooks: helperShare.records.continuityPlaybooks,
          documents: helperShare.records.documents,
        };
  const sections: HomeVaultOfflineCompanionPackSection[] =
    options.target === 'primary_user'
      ? [
          ...emergencyPacket.summary.includedSections.map((section) => ({
            key: section.key,
            title: section.title,
            state: 'included' as const,
            source: 'emergency_packet' as const,
            itemCount: section.itemCount,
            documentCount: section.documentCount,
            rationale: section.includes,
          })),
          ...emergencyPacket.summary.missingSections.map((section) => ({
            key: section.key,
            title: section.title,
            state: 'missing' as const,
            source: 'emergency_packet' as const,
            itemCount: section.itemCount,
            documentCount: section.documentCount,
            rationale: section.emptyState,
          })),
        ]
      : [
          ...helperShare.summary.includedSections.map((section) => ({
            key: section.key,
            title: section.title,
            state: 'included' as const,
            source: 'trusted_share' as const,
            itemCount: section.itemCount,
            documentCount: section.documentCount,
            rationale: section.includes,
          })),
          ...helperShare.summary.omittedSections.map((section) => ({
            key: section.key,
            title: section.title,
            state: section.state === 'empty' ? ('missing' as const) : ('omitted' as const),
            source: 'trusted_share' as const,
            itemCount: section.itemCount,
            documentCount: section.documentCount,
            rationale: section.rationale,
          })),
        ];

  return {
    app: 'HomeVault',
    kind: 'offline_companion_pack',
    version: 1,
    generatedAt,
    property: { ...emergencyPacket.property },
    target,
    readOnly: true,
    unlock: {
      mode: 'device_local_when_available',
      detail:
        options.target === 'primary_user'
          ? 'Prefer device-local protection such as biometrics, screen lock, or OS-protected files when available.'
          : 'Store this only on a helper device that already uses a local screen lock or device-local protected files.',
    },
    warnings: {
      staleness:
        'This offline pack is static after export. Replace it whenever contacts, codes, recovery notes, or linked records change.',
      rotation:
        'Rotate the pack after any real incident, helper handoff, or credential change that may expose sensitive details.',
      deviceLoss:
        'If the device holding this pack is lost, assume the included emergency details may need to be reviewed and rotated.',
    },
    derivedFrom: {
      emergencyPacketVersion: emergencyPacket.version,
      trustedShareAudienceKey: helperShare.audience.key,
      trustedShareVersion: helperShare.version,
    },
    summary: {
      containsSensitiveValues: emergencyPacket.summary.containsSensitiveValues,
      contactCount: sourceRecords.emergencyContacts.length,
      documentCount: sourceRecords.documents.length,
      incidentCount: sourceRecords.continuityPlaybooks.length,
      includedSectionCount: sections.filter((section) => section.state === 'included').length,
      omittedSectionCount: sections.filter((section) => section.state === 'omitted').length,
      missingSectionCount: sections.filter((section) => section.state === 'missing').length,
      recordCount:
        sourceRecords.accessItems.length +
        sourceRecords.emergencyContacts.length +
        sourceRecords.importantAccounts.length +
        sourceRecords.keyDevices.length +
        sourceRecords.recoveryNotes.length,
    },
    sections,
    records: {
      accessItems: sourceRecords.accessItems.map((item) => ({ ...item, linkedDocumentIds: [...item.linkedDocumentIds] })),
      emergencyContacts: sourceRecords.emergencyContacts.map((item) => ({ ...item })),
      importantAccounts: sourceRecords.importantAccounts.map((item) => ({ ...item, linkedDocumentIds: [...item.linkedDocumentIds] })),
      keyDevices: sourceRecords.keyDevices.map((item) => ({ ...item, linkedAccessItemIds: [...item.linkedAccessItemIds] })),
      linkedAccessItems: sourceRecords.linkedAccessItems.map((item) => ({ ...item, linkedDocumentIds: [...item.linkedDocumentIds] })),
      recoveryNotes: sourceRecords.recoveryNotes.map((item) => ({ ...item })),
      continuityPlaybooks: sourceRecords.continuityPlaybooks.map((playbook) => ({
        ...playbook,
        linkedRecordIds: [...playbook.linkedRecordIds],
        steps: playbook.steps.map((step) => ({ ...step })),
      })),
      documents: sourceRecords.documents.map((document) => ({ ...document })),
    },
  };
}

export function buildHomeVaultCareCard(
  input: BuildHomeVaultCareCardInput,
): HomeVaultCareCard {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const template = getCareCardTemplate(input.template);
  const medications = (input.medications ?? []).map((item) => ({ ...item }));
  const routines = (input.routines ?? []).map((item) => ({ ...item }));
  const pickupRules = [...(input.pickupRules ?? [])];
  const schoolDetails = [...(input.schoolDetails ?? [])];
  const providerContacts = (input.providerContacts ?? []).map((item) => ({ ...item }));
  const emergencyContacts = (input.emergencyContacts ?? []).map((item) => ({ ...item }));
  const criticalNotes = [...(input.criticalNotes ?? [])];
  const missingPrompts = buildCareCardMissingPrompts({
    criticalNotes,
      emergencyContacts,
      medications,
      pickupRules,
      providerContacts,
      routines,
      schoolDetails,
      template: template.key,
    });
  const sensitivity = summarizeCareCardSensitivity({
    criticalNotes,
    medications,
    missingPrompts,
    template: template.key,
  });

  return {
    app: 'HomeVault',
    kind: 'care_card',
    version: 1,
    generatedAt,
    property: { ...input.property },
    template: {
      key: template.key,
      label: template.label,
      description: template.description,
    },
    subject: {
      name: input.subjectName,
      descriptor: input.subjectDescriptor,
    },
    warning:
      'Care cards are read-only handoff summaries. Share only with trusted helpers and refresh them after medication, routine, pickup, or provider changes.',
    sensitivity,
    shareDefaults: {
      caregiverHandoff: {
        audienceKey: template.caregiverAudienceKey,
        audienceLabel: template.caregiverAudienceLabel,
        readOnly: true,
        mode: 'trusted_handoff',
        detail:
          'Use a narrower caregiver handoff by default so helpers receive only the care details they need, not the broader household archive.',
      },
      emergencySnapshot: {
        audienceKey: template.emergencyAudienceKey,
        audienceLabel: template.emergencyAudienceLabel,
        readOnly: true,
        mode: 'emergency_packet',
        detail:
          'Use the broader emergency snapshot only when someone must act quickly and the dependent-care context outweighs tighter redaction.',
      },
    },
    summary: {
      medicationCount: medications.length,
      routineCount: routines.length,
      providerContactCount: providerContacts.length,
      emergencyContactCount: emergencyContacts.length,
      pickupRuleCount: pickupRules.length,
      schoolDetailCount: schoolDetails.length,
      criticalNoteCount: criticalNotes.length,
      missingPromptCount: missingPrompts.length,
      hasHighRiskGap: missingPrompts.some((prompt) => prompt.severity === 'high'),
    },
    sections: {
      medications,
      routines,
      pickupRules,
      schoolDetails,
      providerContacts,
      emergencyContacts,
      criticalNotes,
    },
    missingPrompts,
  };
}

export function buildHomeVaultCaregiverPlan(
  input: BuildHomeVaultCaregiverPlanInput,
): HomeVaultCaregiverPlan {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const audience = getCaregiverPlanAudience(input.audience);
  const expiresInDays = input.expiresInDays ?? audience.defaultExpiryDays;
  const expiresAt = new Date(
    new Date(generatedAt).getTime() + expiresInDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  return {
    app: 'HomeVault',
    kind: 'caregiver_plan',
    version: 1,
    generatedAt,
    expiresAt,
    property: { ...input.careCard.property },
    template: { ...input.careCard.template },
    subject: { ...input.careCard.subject },
    audience: {
      key: audience.key,
      label: audience.label,
      description: audience.description,
    },
    warning:
      'This caregiver plan is temporary, read-only, and audience-specific. Reissue it after schedule, medication, contact, or caregiver changes.',
    summary: {
      expiresInDays,
      routineCount: input.careCard.summary.routineCount,
      medicationCount: input.careCard.summary.medicationCount,
      providerContactCount: input.careCard.summary.providerContactCount,
      pickupContactCount: input.careCard.summary.emergencyContactCount,
      schoolDetailCount: input.careCard.summary.schoolDetailCount,
      hasHighRiskGap: input.careCard.summary.hasHighRiskGap,
    },
    scope: {
      allowedActions: [...audience.allowedActions],
      disallowedActions: [...audience.disallowedActions],
    },
    linkedRecords: {
      pickupContacts: input.careCard.sections.emergencyContacts.map((contact) => ({ ...contact })),
      providerContacts: input.careCard.sections.providerContacts.map((contact) => ({ ...contact })),
      medications: input.careCard.sections.medications.map((medication) => ({ ...medication })),
      schoolDetails: [...input.careCard.sections.schoolDetails],
    },
    reviewPrompts: [...audience.reviewPrompts],
    travelTransitionPrompts: [...audience.travelTransitionPrompts],
    missingPrompts: input.careCard.missingPrompts.map((prompt) => ({ ...prompt })),
  };
}

export function formatHomeVaultCareCard(card: HomeVaultCareCard): string {
  const lines = [
    'HomeVault Care Card',
    '===================',
    '',
    `Property : ${card.property.label}`,
    `Template : ${card.template.label}`,
    `Subject  : ${card.subject.name}`,
    `Generated: ${card.generatedAt}`,
    '',
    `Warning  : ${card.warning}`,
    `Share    : ${card.shareDefaults.caregiverHandoff.audienceLabel} (${card.shareDefaults.caregiverHandoff.mode})`,
    `Emergency: ${card.shareDefaults.emergencySnapshot.audienceLabel} (${card.shareDefaults.emergencySnapshot.mode})`,
    `Sensitivity: ${card.sensitivity.label}`,
    '',
    'Medications',
    '-----------',
    ...(card.sections.medications.length > 0
      ? card.sections.medications.map((item) =>
          [item.label, item.dose, item.schedule, item.instructions, item.isCritical ? 'Critical' : null]
            .filter((value): value is string => Boolean(value))
            .join(' · '),
        )
      : ['No medications saved.']),
    '',
    'Routines',
    '--------',
    ...(card.sections.routines.length > 0
      ? card.sections.routines.map((item) =>
          [item.label, item.timeLabel, item.detail]
            .filter((value): value is string => Boolean(value))
            .join(' · '),
        )
      : ['No routines saved.']),
    '',
    'Pickup Rules',
    '------------',
    ...(card.sections.pickupRules.length > 0
      ? card.sections.pickupRules
      : ['No pickup or handoff rules saved.']),
    '',
    'School Details',
    '--------------',
    ...(card.sections.schoolDetails.length > 0
      ? card.sections.schoolDetails
      : ['No school or activity details saved.']),
    '',
    'Provider Contacts',
    '-----------------',
    ...(card.sections.providerContacts.length > 0
      ? card.sections.providerContacts.map((item) =>
          [item.label, item.role, item.phone, item.email, item.notes]
            .filter((value): value is string => Boolean(value))
            .join(' · '),
        )
      : ['No provider contacts saved.']),
    '',
    'Critical Notes',
    '--------------',
    ...(card.sections.criticalNotes.length > 0
      ? card.sections.criticalNotes
      : ['No critical notes saved.']),
    '',
    'Missing Prompts',
    '---------------',
    ...(card.missingPrompts.length > 0
      ? card.missingPrompts.map((prompt) => `${prompt.severity.toUpperCase()}: ${prompt.label} — ${prompt.detail}`)
      : ['No high-risk gaps detected in this care card.']),
  ];

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

export function formatHomeVaultCaregiverPlan(plan: HomeVaultCaregiverPlan): string {
  const lines = [
    'HomeVault Caregiver Plan',
    '========================',
    '',
    `Property : ${plan.property.label}`,
    `Template : ${plan.template.label}`,
    `Subject  : ${plan.subject.name}`,
    `Audience : ${plan.audience.label}`,
    `Generated: ${plan.generatedAt}`,
    `Expires  : ${plan.expiresAt}`,
    '',
    `Warning  : ${plan.warning}`,
    '',
    'Allowed Actions',
    '---------------',
    ...plan.scope.allowedActions.map((item) => `- ${item}`),
    '',
    'Not Authorized',
    '--------------',
    ...plan.scope.disallowedActions.map((item) => `- ${item}`),
    '',
    'Linked Care Records',
    '-------------------',
    `- Pickup contacts: ${plan.linkedRecords.pickupContacts.length}`,
    `- Provider contacts: ${plan.linkedRecords.providerContacts.length}`,
    `- Medications: ${plan.linkedRecords.medications.length}`,
    `- School details: ${plan.linkedRecords.schoolDetails.length}`,
    '',
    'Pre-Handoff Review',
    '------------------',
    ...plan.reviewPrompts.map((item) => `- ${item}`),
    '',
    'Travel Or Transition Review',
    '---------------------------',
    ...plan.travelTransitionPrompts.map((item) => `- ${item}`),
    '',
    'Medication Snapshot',
    '-------------------',
    ...(plan.linkedRecords.medications.length > 0
      ? plan.linkedRecords.medications.map((item) =>
          `- ${[item.label, item.dose, item.schedule, item.instructions].filter((value): value is string => Boolean(value)).join(' · ')}`,
        )
      : ['- No medications saved.']),
    '',
    'Provider Contacts',
    '-----------------',
    ...(plan.linkedRecords.providerContacts.length > 0
      ? plan.linkedRecords.providerContacts.map((item) =>
          `- ${[item.label, item.role, item.phone, item.email, item.notes].filter((value): value is string => Boolean(value)).join(' · ')}`,
        )
      : ['- No provider contacts saved.']),
    '',
    'Pickup Contacts',
    '---------------',
    ...(plan.linkedRecords.pickupContacts.length > 0
      ? plan.linkedRecords.pickupContacts.map((item) =>
          `- ${[item.name, item.role, item.phone, item.email].filter((value): value is string => Boolean(value)).join(' · ')}`,
        )
      : ['- No pickup contacts saved.']),
    '',
    'School Details',
    '--------------',
    ...(plan.linkedRecords.schoolDetails.length > 0
      ? plan.linkedRecords.schoolDetails.map((item) => `- ${item}`)
      : ['- No school or activity details saved.']),
    '',
    'Missing Prompts',
    '---------------',
    ...(plan.missingPrompts.length > 0
      ? plan.missingPrompts.map((prompt) => `- ${prompt.severity.toUpperCase()}: ${prompt.label} — ${prompt.detail}`)
      : ['- No high-risk gaps detected in this plan.']),
  ];

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

export function formatHomeVaultItemShareBundle(bundle: HomeVaultItemShareBundle): string {
  return JSON.stringify(bundle, null, 2);
}

export function formatHomeVaultOfflineCompanionPack(pack: HomeVaultOfflineCompanionPack): string {
  return JSON.stringify(pack, null, 2);
}

export function parseHomeVaultItemShareBundle(
  source: string,
): HomeVaultItemShareBundleValidation {
  let parsed: unknown;

  try {
    parsed = JSON.parse(source);
  } catch {
    return { ok: false, errorKind: 'not_json', errors: ['The selected file is not valid JSON.'] };
  }

  return validateHomeVaultItemShareBundle(parsed);
}

export function parseHomeVaultOfflineCompanionPack(
  source: string,
): HomeVaultOfflineCompanionPackValidation {
  let parsed: unknown;

  try {
    parsed = JSON.parse(source);
  } catch {
    return { ok: false, errorKind: 'not_json', errors: ['The selected file is not valid JSON.'] };
  }

  return validateHomeVaultOfflineCompanionPack(parsed);
}

export function validateHomeVaultItemShareBundle(
  candidate: unknown,
): HomeVaultItemShareBundleValidation {
  const errors: string[] = [];

  if (!isRecord(candidate)) {
    return { ok: false, errorKind: 'not_homevault', errors: ['The bundle must be a JSON object.'] };
  }

  if (candidate.app !== 'HomeVault' || candidate.kind !== 'item_share_bundle') {
    return {
      ok: false,
      errorKind: 'not_homevault',
      errors: ['This file does not appear to be a HomeVault item-share bundle.'],
    };
  }

  if (candidate.version !== 1) {
    const versionLabel =
      typeof candidate.version === 'number' ? `version ${candidate.version}` : 'an unknown version';

    return {
      ok: false,
      errorKind: 'version_unsupported',
      errors: [
        `This item-share bundle uses ${versionLabel} of the HomeVault format. Only version 1 is supported by this app.`,
      ],
    };
  }

  if (!isRecord(candidate.provenance)) {
    errors.push('Missing provenance object.');
  }

  if (!isRecord(candidate.contents)) {
    errors.push('Missing contents object.');
  }

  if (!isRecord(candidate.encryption)) {
    errors.push('Missing encryption object.');
  }

  if (
    errors.length > 0 ||
    !isRecord(candidate.provenance) ||
    !isRecord(candidate.contents) ||
    !isRecord(candidate.encryption)
  ) {
    return { ok: false, errorKind: 'malformed', errors };
  }

  if (!Array.isArray(candidate.contents.items) || candidate.contents.items.length === 0) {
    errors.push('Bundle contents must include at least one shared item.');
  }

  if (typeof candidate.provenance.senderLabel !== 'string' || candidate.provenance.senderLabel.length === 0) {
    errors.push('Provenance sender label is missing.');
  }

  if (typeof candidate.provenance.householdLabel !== 'string' || candidate.provenance.householdLabel.length === 0) {
    errors.push('Provenance household label is missing.');
  }

  if (typeof candidate.provenance.audienceLabel !== 'string' || candidate.provenance.audienceLabel.length === 0) {
    errors.push('Provenance audience label is missing.');
  }

  if (candidate.provenance.readOnly !== true) {
    errors.push('Shared bundles must be explicitly marked read-only.');
  }

  if (candidate.encryption.scheme !== 'aes-256-gcm') {
    errors.push('Unsupported encryption scheme.');
  }

  if (candidate.encryption.keyDerivation !== 'pbkdf2-sha256') {
    errors.push('Unsupported key derivation scheme.');
  }

  if (
    typeof candidate.encryption.ciphertextBase64 !== 'string' ||
    candidate.encryption.ciphertextBase64.length === 0
  ) {
    errors.push('Encrypted payload ciphertext is missing.');
  }

  if (typeof candidate.encryption.ivBase64 !== 'string' || candidate.encryption.ivBase64.length === 0) {
    errors.push('Encrypted payload IV is missing.');
  }

  if (typeof candidate.encryption.saltBase64 !== 'string' || candidate.encryption.saltBase64.length === 0) {
    errors.push('Encrypted payload salt is missing.');
  }

  if (
    typeof candidate.encryption.iterations !== 'number' ||
    !Number.isFinite(candidate.encryption.iterations) ||
    candidate.encryption.iterations < 100000
  ) {
    errors.push('Encrypted payload iterations must be a number greater than or equal to 100000.');
  }

  const contents = candidate.contents;
  const itemPreviews = normalizeShareBundleItems(
    Array.isArray(contents.items) ? contents.items : [],
    errors,
  );

  if (
    typeof contents.primaryRecordType !== 'string' ||
    !itemPreviews.some((item) => item.recordType === contents.primaryRecordType)
  ) {
    errors.push('Primary record type must match one of the shared items.');
  }

  if (errors.length > 0) {
    return { ok: false, errorKind: 'malformed', errors };
  }

  const normalized = candidate as HomeVaultItemShareBundle;
  const preview = buildItemShareBundlePreview(normalized, itemPreviews);

  return {
    ok: true,
    bundle: normalized,
    preview,
    summary: `${preview.itemCount} shared item${preview.itemCount === 1 ? '' : 's'} · ${preview.audienceLabel} · ${preview.linkedRecordCount} linked record${preview.linkedRecordCount === 1 ? '' : 's'}`,
  };
}

export function validateHomeVaultOfflineCompanionPack(
  candidate: unknown,
): HomeVaultOfflineCompanionPackValidation {
  const errors: string[] = [];

  if (!isRecord(candidate)) {
    return { ok: false, errorKind: 'not_homevault', errors: ['The pack must be a JSON object.'] };
  }

  if (candidate.app !== 'HomeVault' || candidate.kind !== 'offline_companion_pack') {
    return {
      ok: false,
      errorKind: 'not_homevault',
      errors: ['This file does not appear to be a HomeVault offline companion pack.'],
    };
  }

  if (candidate.version !== 1) {
    const versionLabel =
      typeof candidate.version === 'number' ? `version ${candidate.version}` : 'an unknown version';

    return {
      ok: false,
      errorKind: 'version_unsupported',
      errors: [
        `This offline companion pack uses ${versionLabel} of the HomeVault format. Only version 1 is supported by this app.`,
      ],
    };
  }

  if (!isRecord(candidate.property)) {
    errors.push('Missing property object.');
  }

  if (!isRecord(candidate.target)) {
    errors.push('Missing target object.');
  }

  if (!isRecord(candidate.unlock)) {
    errors.push('Missing unlock object.');
  }

  if (!isRecord(candidate.warnings)) {
    errors.push('Missing warnings object.');
  }

  if (!isRecord(candidate.derivedFrom)) {
    errors.push('Missing derived-from object.');
  }

  if (!isRecord(candidate.summary)) {
    errors.push('Missing summary object.');
  }

  if (!Array.isArray(candidate.sections)) {
    errors.push('Missing sections array.');
  }

  if (!isRecord(candidate.records)) {
    errors.push('Missing records object.');
  }

  if (
    errors.length > 0 ||
    !isRecord(candidate.property) ||
    !isRecord(candidate.target) ||
    !isRecord(candidate.unlock) ||
    !isRecord(candidate.warnings) ||
    !isRecord(candidate.derivedFrom) ||
    !isRecord(candidate.summary) ||
    !Array.isArray(candidate.sections) ||
    !isRecord(candidate.records)
  ) {
    return { ok: false, errorKind: 'malformed', errors };
  }

  if (candidate.readOnly !== true) {
    errors.push('Offline companion packs must be explicitly marked read-only.');
  }

  if (
    candidate.target.key !== 'primary_user' &&
    candidate.target.key !== 'helper_device'
  ) {
    errors.push('Target key must be primary_user or helper_device.');
  }

  if (typeof candidate.target.label !== 'string' || candidate.target.label.length === 0) {
    errors.push('Target label is missing.');
  }

  if (
    typeof candidate.target.description !== 'string' ||
    candidate.target.description.length === 0
  ) {
    errors.push('Target description is missing.');
  }

  if (candidate.unlock.mode !== 'device_local_when_available') {
    errors.push('Unsupported unlock mode.');
  }

  if (typeof candidate.unlock.detail !== 'string' || candidate.unlock.detail.length === 0) {
    errors.push('Unlock detail is missing.');
  }

  if (
    typeof candidate.warnings.staleness !== 'string' ||
    candidate.warnings.staleness.length === 0
  ) {
    errors.push('Staleness warning is missing.');
  }

  if (
    typeof candidate.warnings.rotation !== 'string' ||
    candidate.warnings.rotation.length === 0
  ) {
    errors.push('Rotation warning is missing.');
  }

  if (
    typeof candidate.warnings.deviceLoss !== 'string' ||
    candidate.warnings.deviceLoss.length === 0
  ) {
    errors.push('Device-loss warning is missing.');
  }

  if (typeof candidate.derivedFrom.emergencyPacketVersion !== 'number') {
    errors.push('Emergency packet version is missing.');
  }

  if (typeof candidate.derivedFrom.trustedShareVersion !== 'number') {
    errors.push('Trusted-share version is missing.');
  }

  if (
    typeof candidate.derivedFrom.trustedShareAudienceKey !== 'string' ||
    candidate.derivedFrom.trustedShareAudienceKey.length === 0
  ) {
    errors.push('Trusted-share audience key is missing.');
  }

  const summaryChecks: Array<keyof HomeVaultOfflineCompanionPack['summary']> = [
    'contactCount',
    'documentCount',
    'incidentCount',
    'includedSectionCount',
    'omittedSectionCount',
    'missingSectionCount',
    'recordCount',
  ];

  if (typeof candidate.summary.containsSensitiveValues !== 'boolean') {
    errors.push('Sensitive-values summary is missing.');
  }

  for (const key of summaryChecks) {
    if (typeof candidate.summary[key] !== 'number') {
      errors.push(`Summary field ${key} is missing.`);
    }
  }

  const sections = normalizeOfflineCompanionSections(candidate.sections, errors);

  if (sections.length === 0) {
    errors.push('Offline companion pack must include at least one section summary.');
  }

  const records = candidate.records;
  const recordKeys = [
    'accessItems',
    'emergencyContacts',
    'importantAccounts',
    'keyDevices',
    'linkedAccessItems',
    'recoveryNotes',
    'continuityPlaybooks',
    'documents',
  ] as const;

  for (const key of recordKeys) {
    if (!Array.isArray(records[key])) {
      errors.push(`Records field ${key} must be an array.`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errorKind: 'malformed', errors };
  }

  const normalized = candidate as HomeVaultOfflineCompanionPack;
  const preview = buildOfflineCompanionPackPreview(normalized, sections);

  return {
    ok: true,
    pack: normalized,
    preview,
    summary: `${preview.target.label} · ${preview.summary.includedSectionCount} included section${preview.summary.includedSectionCount === 1 ? '' : 's'} · ${preview.summary.recordCount} emergency record${preview.summary.recordCount === 1 ? '' : 's'}`,
  };
}

export function formatHomeVaultExportPackage(exportPackage: HomeVaultExportPackage): string {
  return JSON.stringify(exportPackage, null, 2);
}

export function parseHomeVaultExportPackage(
  source: string,
): HomeVaultExportPackageValidation {
  let parsed: unknown;

  try {
    parsed = JSON.parse(source);
  } catch {
    return { ok: false, errorKind: 'not_json', errors: ['The selected file is not valid JSON.'] };
  }

  return validateHomeVaultExportPackage(parsed);
}

export function validateHomeVaultExportPackage(
  candidate: unknown,
): HomeVaultExportPackageValidation {
  const errors: string[] = [];

  if (!isRecord(candidate)) {
    return { ok: false, errorKind: 'not_homevault', errors: ['The package must be a JSON object.'] };
  }

  const manifest = candidate.manifest;
  const records = candidate.records;
  const attachments = candidate.attachments;

  if (!isRecord(manifest)) {
    errors.push('Missing manifest object.');
  }

  if (!isRecord(records)) {
    errors.push('Missing records object.');
  }

  if (!Array.isArray(attachments)) {
    errors.push('Missing attachments array.');
  }

  if (errors.length > 0 || !isRecord(manifest) || !isRecord(records) || !Array.isArray(attachments)) {
    return { ok: false, errorKind: 'not_homevault', errors };
  }

  if (manifest.app !== 'HomeVault') {
    return {
      ok: false,
      errorKind: 'not_homevault',
      errors: ['This file does not appear to be a HomeVault backup.'],
    };
  }

  if (manifest.version !== 1) {
    const versionLabel = typeof manifest.version === 'number' ? `version ${manifest.version}` : 'an unknown version';

    return {
      ok: false,
      errorKind: 'version_unsupported',
      errors: [
        `This backup uses ${versionLabel} of the HomeVault format. Only version 1 is supported by this app. Update HomeVault to restore from this backup.`,
      ],
    };
  }

  if (!isRecord(manifest.recordCounts)) {
    errors.push('Manifest record counts are missing.');
  }

  const roomCount = validateArrayCount(records.rooms, manifest.recordCounts, 'rooms', errors);
  const assetCount = validateArrayCount(records.assets, manifest.recordCounts, 'assets', errors);
  const documentCount = validateArrayCount(
    records.documents,
    manifest.recordCounts,
    'documents',
    errors,
  );
  normalizeOptionalArrayCount(records, manifest, 'accessItems');
  normalizeOptionalArrayCount(records, manifest, 'emergencyContacts');
  normalizeOptionalArrayCount(records, manifest, 'importantAccounts');
  normalizeOptionalArrayCount(records, manifest, 'continuityPlaybooks');
  validateArrayCount(records.accessItems, manifest.recordCounts, 'accessItems', errors);
  validateArrayCount(records.emergencyContacts, manifest.recordCounts, 'emergencyContacts', errors);
  validateArrayCount(records.importantAccounts, manifest.recordCounts, 'importantAccounts', errors);
  validateArrayCount(
    records.continuityPlaybooks,
    manifest.recordCounts,
    'continuityPlaybooks',
    errors,
  );
  const taskCount = validateArrayCount(records.tasks, manifest.recordCounts, 'tasks', errors);
  validateArrayCount(records.taskCompletions, manifest.recordCounts, 'taskCompletions', errors);
  validateArrayCount(records.repairEvents, manifest.recordCounts, 'repairEvents', errors);
  // parts is optional for backward compatibility with backups created before this field was added.
  normalizeOptionalArrayCount(records, manifest, 'parts');
  validateArrayCount(records.parts, manifest.recordCounts, 'parts', errors);

  if (!isRecord(records.property)) {
    errors.push('Property record is missing.');
  }

  if (errors.length > 0) {
    return { ok: false, errorKind: 'malformed', errors };
  }

  // Normalize for backward compatibility: old backups omit parts.
  const normalized = candidate as HomeVaultExportPackage;
  normalized.manifest.sensitiveData = summarizeSensitiveData({
    accessItems: normalized.records.accessItems,
    assets: normalized.records.assets,
    emergencyContacts: normalized.records.emergencyContacts,
    importantAccounts: normalized.records.importantAccounts,
  });

  return {
    ok: true,
    package: normalized,
    preview: buildImportPreview(normalized),
    summary: `${roomCount} areas, ${assetCount} assets, ${documentCount} documents, ${taskCount} tasks`,
  };
}

export function formatHomeVaultImportPreview(preview: HomeVaultImportPreview): string {
  return [
    preview.propertyLabel,
    `${preview.recordCounts.rooms} areas`,
    `${preview.recordCounts.assets} assets`,
    `${preview.recordCounts.documents} documents`,
    `${preview.attachmentCount} attachments`,
    `${preview.reviewItemCount} review items`,
  ].join(' · ');
}

export function formatSensitiveDataWarning(summary: HomeVaultSensitiveDataSummary): string {
  const parts: string[] = [];

  if (summary.accessItemCount > 0) {
    parts.push(`${summary.accessItemCount} access item${summary.accessItemCount === 1 ? '' : 's'}`);
  }
  if (summary.emergencyContactCount > 0) {
    parts.push(
      `${summary.emergencyContactCount} emergency contact${summary.emergencyContactCount === 1 ? '' : 's'}`,
    );
  }
  if (summary.importantAccountCount > 0) {
    parts.push(
      `${summary.importantAccountCount} important account${summary.importantAccountCount === 1 ? '' : 's'}`,
    );
  }
  if (summary.assetSerialCount > 0) {
    parts.push(`${summary.assetSerialCount} device serial${summary.assetSerialCount === 1 ? '' : 's'}`);
  }

  if (parts.length === 0) {
    return 'No sensitive household details were detected in this export.';
  }

  return `Sensitive household details included: ${parts.join(', ')}.`;
}

export function createHomeVaultExportFileName(manifest: HomeVaultExportManifest): string {
  const propertySlug = slugify(manifest.property.label || manifest.property.id);
  const generatedDate = manifest.generatedAt.slice(0, 10);

  return `homevault-${propertySlug}-${generatedDate}.json`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateArrayCount(
  recordsValue: unknown,
  countsValue: unknown,
  key: string,
  errors: string[],
) {
  if (!Array.isArray(recordsValue)) {
    errors.push(`Records.${key} must be an array.`);
    return 0;
  }

  if (!isRecord(countsValue) || countsValue[key] !== recordsValue.length) {
    errors.push(`Record count mismatch for ${key}.`);
  }

  return recordsValue.length;
}

function normalizeOptionalArrayCount(
  records: Record<string, unknown>,
  manifest: Record<string, unknown>,
  key: keyof HomeVaultExportManifest['recordCounts'],
) {
  const recordCounts = isRecord(manifest.recordCounts) ? manifest.recordCounts : null;

  if (!Array.isArray(records[key])) {
    records[key] = [];
  }

  if (recordCounts && typeof recordCounts[key] !== 'number') {
    recordCounts[key] = 0;
  }
}

function buildItemShareBundlePreview(
  bundle: HomeVaultItemShareBundle,
  items: HomeVaultItemShareBundleItem[],
): HomeVaultItemShareBundleImportPreview {
  return {
    senderLabel: bundle.provenance.senderLabel,
    householdLabel: bundle.provenance.householdLabel,
    audienceLabel: bundle.provenance.audienceLabel,
    audienceKey: bundle.provenance.audienceKey,
    generatedAt: bundle.provenance.generatedAt,
    expiresAt: bundle.provenance.expiresAt ?? null,
    readOnly: true,
    primaryRecordType: bundle.contents.primaryRecordType,
    itemCount: items.length,
    linkedRecordCount: sumUniqueLengths(items.map((item) => item.linkedRecordIds)),
    omittedFieldCount: sumUniqueLengths(items.map((item) => item.omittedFieldIds)),
    items,
  };
}

function buildOfflineCompanionPackPreview(
  pack: HomeVaultOfflineCompanionPack,
  sections: HomeVaultOfflineCompanionPackSection[],
): HomeVaultOfflineCompanionPackImportPreview {
  return {
    householdLabel: pack.property.label,
    generatedAt: pack.generatedAt,
    readOnly: true,
    target: { ...pack.target },
    unlock: { ...pack.unlock },
    warnings: { ...pack.warnings },
    derivedFrom: { ...pack.derivedFrom },
    summary: { ...pack.summary },
    sections: sections.map((section) => ({ ...section })),
  };
}

function normalizeShareBundleItems(
  items: unknown[],
  errors: string[],
): HomeVaultItemShareBundleItem[] {
  return items
    .map((item, index) => {
      if (!isRecord(item)) {
        errors.push(`Shared item ${index + 1} must be an object.`);
        return null;
      }

      if (typeof item.recordType !== 'string') {
        errors.push(`Shared item ${index + 1} is missing a record type.`);
      }

      if (typeof item.recordId !== 'string' || item.recordId.length === 0) {
        errors.push(`Shared item ${index + 1} is missing a record id.`);
      }

      if (typeof item.label !== 'string' || item.label.length === 0) {
        errors.push(`Shared item ${index + 1} is missing a label.`);
      }

      if (!Array.isArray(item.linkedRecordIds)) {
        errors.push(`Shared item ${index + 1} is missing linked record ids.`);
      }

      if (!Array.isArray(item.includedFieldIds)) {
        errors.push(`Shared item ${index + 1} is missing included field ids.`);
      }

      if (!Array.isArray(item.omittedFieldIds)) {
        errors.push(`Shared item ${index + 1} is missing omitted field ids.`);
      }

      if (
        typeof item.recordType !== 'string' ||
        typeof item.recordId !== 'string' ||
        typeof item.label !== 'string' ||
        !Array.isArray(item.linkedRecordIds) ||
        !Array.isArray(item.includedFieldIds) ||
        !Array.isArray(item.omittedFieldIds)
      ) {
        return null;
      }

      return {
        recordType: item.recordType as HomeVaultItemShareRecordType,
        recordId: item.recordId,
        label: item.label,
        linkedRecordIds: item.linkedRecordIds.filter((value): value is string => typeof value === 'string'),
        includedFieldIds: item.includedFieldIds.filter((value): value is string => typeof value === 'string'),
        omittedFieldIds: item.omittedFieldIds.filter((value): value is string => typeof value === 'string'),
      };
    })
    .filter((item): item is HomeVaultItemShareBundleItem => Boolean(item));
}

function normalizeOfflineCompanionSections(
  sections: unknown[],
  errors: string[],
): HomeVaultOfflineCompanionPackSection[] {
  return sections
    .map((section, index) => {
      if (!isRecord(section)) {
        errors.push(`Offline section ${index + 1} must be an object.`);
        return null;
      }

      if (typeof section.key !== 'string') {
        errors.push(`Offline section ${index + 1} is missing a key.`);
      }

      if (typeof section.title !== 'string' || section.title.length === 0) {
        errors.push(`Offline section ${index + 1} is missing a title.`);
      }

      if (
        section.state !== 'included' &&
        section.state !== 'omitted' &&
        section.state !== 'missing'
      ) {
        errors.push(`Offline section ${index + 1} has an unsupported state.`);
      }

      if (
        section.source !== 'emergency_packet' &&
        section.source !== 'trusted_share'
      ) {
        errors.push(`Offline section ${index + 1} has an unsupported source.`);
      }

      if (typeof section.itemCount !== 'number') {
        errors.push(`Offline section ${index + 1} is missing an item count.`);
      }

      if (typeof section.documentCount !== 'number') {
        errors.push(`Offline section ${index + 1} is missing a document count.`);
      }

      if (typeof section.rationale !== 'string' || section.rationale.length === 0) {
        errors.push(`Offline section ${index + 1} is missing a rationale.`);
      }

      if (
        typeof section.key !== 'string' ||
        typeof section.title !== 'string' ||
        typeof section.itemCount !== 'number' ||
        typeof section.documentCount !== 'number' ||
        typeof section.rationale !== 'string' ||
        (section.state !== 'included' &&
          section.state !== 'omitted' &&
          section.state !== 'missing') ||
        (section.source !== 'emergency_packet' &&
          section.source !== 'trusted_share')
      ) {
        return null;
      }

      return {
        key: section.key as HomeVaultEmergencyPacketSectionKey,
        title: section.title,
        state: section.state,
        source: section.source,
        itemCount: section.itemCount,
        documentCount: section.documentCount,
        rationale: section.rationale,
      } satisfies HomeVaultOfflineCompanionPackSection;
    })
    .filter((section): section is HomeVaultOfflineCompanionPackSection => Boolean(section));
}

function sumUniqueLengths(values: string[][]) {
  const set = new Set(values.flat());
  return set.size;
}

function summarizeSensitiveData({
  accessItems,
  assets,
  emergencyContacts,
  importantAccounts,
}: {
  accessItems: AccessItem[];
  assets: Asset[];
  emergencyContacts: EmergencyContact[];
  importantAccounts: ImportantAccount[];
}): HomeVaultSensitiveDataSummary {
  const accessItemCount = accessItems.filter(
    (accessItem) =>
      Boolean(
        accessItem.accessCode ||
          accessItem.instructions ||
          accessItem.location ||
          accessItem.notes ||
          accessItem.username,
      ),
  ).length;
  const importantAccountCount = importantAccounts.filter(
    (account) =>
      Boolean(
        account.accountNumber ||
          account.recoveryNotes ||
          account.phone ||
          account.email,
      ),
  ).length;
  const assetSerialCount = assets.filter((asset) => Boolean(asset.serial)).length;

  return {
    includesSensitiveData:
      accessItemCount > 0 ||
      emergencyContacts.length > 0 ||
      importantAccountCount > 0 ||
      assetSerialCount > 0,
    accessItemCount,
    emergencyContactCount: emergencyContacts.length,
    importantAccountCount,
    assetSerialCount,
  };
}

function buildImportPreview(exportPackage: HomeVaultExportPackage): HomeVaultImportPreview {
  return {
    attachmentCount: exportPackage.attachments.length,
    generatedAt: exportPackage.manifest.generatedAt,
    propertyLabel: exportPackage.manifest.property.label,
    includesSensitiveData: exportPackage.manifest.sensitiveData.includesSensitiveData,
    recordCounts: { ...exportPackage.manifest.recordCounts },
    reviewItemCount: exportPackage.manifest.checklist.filter((item) => item.state === 'review')
      .length,
  };
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'export';
}

function maskAccountNumber(accountNumber?: string) {
  if (!accountNumber) {
    return undefined;
  }

  const visible = accountNumber.replace(/\s+/g, '').slice(-4);

  return visible ? `••••${visible}` : undefined;
}

function buildEmergencyPacketDevices(
  input: BuildExportManifestInput,
  roomById: Map<string, RoomArea>,
) {
  const accessByAssetId = new Map<string, string[]>();
  const documentIdsByAssetId = new Map<string, string[]>();

  for (const accessItem of input.accessItems) {
    if (
      !accessItem.linkedAssetId ||
      (accessItem.category !== 'wifi' && accessItem.category !== 'router')
    ) {
      continue;
    }

    const linkedAccessIds = accessByAssetId.get(accessItem.linkedAssetId) ?? [];
    linkedAccessIds.push(accessItem.id);
    accessByAssetId.set(accessItem.linkedAssetId, linkedAccessIds);

    const linkedDocumentIds = documentIdsByAssetId.get(accessItem.linkedAssetId) ?? [];
    linkedDocumentIds.push(...accessItem.linkedDocumentIds);
    documentIdsByAssetId.set(accessItem.linkedAssetId, linkedDocumentIds);
  }

  return input.assets
    .filter((asset) => {
      const linkedAccessIds = accessByAssetId.get(asset.id) ?? [];

      return (
        isDeviceAsset(asset) ||
        linkedAccessIds.length > 0 ||
        Boolean(
          asset.networkName ||
            asset.internetProvider ||
            asset.networkAdminUrl ||
            asset.findMyDeviceEnabled ||
            asset.backupEnabled ||
            asset.screenLockEnabled,
        )
      );
    })
    .map((asset) => ({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      brand: asset.brand,
      model: asset.model,
      serial: asset.serial,
      networkName: asset.networkName,
      internetProvider: asset.internetProvider,
      networkAdminUrl: asset.networkAdminUrl,
      backupEnabled: asset.backupEnabled,
      screenLockEnabled: asset.screenLockEnabled,
      findMyDeviceEnabled: asset.findMyDeviceEnabled,
      notes: asset.notes,
      roomName: asset.roomId ? roomById.get(asset.roomId)?.name : undefined,
      linkedAccessItemIds: [...new Set(accessByAssetId.get(asset.id) ?? [])],
      linkedDocumentIds: [...new Set(documentIdsByAssetId.get(asset.id) ?? [])],
    }));
}

function buildEmergencyPacketRecoveryNotes(
  importantAccounts: HomeVaultEmergencyPacketImportantAccount[],
  continuityPlaybooks: ContinuityPlaybook[],
) {
  const accountNotes = importantAccounts
    .filter(
      (account) =>
        Boolean(account.recoveryNotes) ||
        account.mfaEnabled === true ||
        account.recoveryCodesStored === true ||
        account.managedInPasswordManager === true,
    )
    .map((account) => ({
      id: account.id,
      label: `${account.providerName} — ${account.label}`,
      detail: formatRecoveryAccountDetail(account),
      source: 'important_account' as const,
    }));
  const playbookNotes = continuityPlaybooks
    .filter((playbook) => Boolean(playbook.notes))
    .map((playbook) => ({
      id: playbook.id,
      label: playbook.title,
      detail: playbook.notes ?? '',
      source: 'playbook' as const,
    }));

  return [...accountNotes, ...playbookNotes];
}

function formatRecoveryAccountDetail(account: HomeVaultEmergencyPacketImportantAccount) {
  const details: string[] = [];

  if (account.recoveryNotes) {
    details.push(account.recoveryNotes);
  }
  if (account.managedInPasswordManager) {
    details.push('Managed in password manager');
  }
  if (account.mfaEnabled) {
    details.push('MFA enabled');
  }
  if (account.recoveryCodesStored) {
    details.push('Recovery codes stored');
  }

  return details.join(' · ') || 'Recovery steps saved';
}

function buildEmergencyPacketSectionSummaries(
  sections: HomeVaultEmergencyPacket['sections'],
): HomeVaultEmergencyPacketSectionSummary[] {
  const recoveryItemCount = sections.recoveryNotes.notes.length + sections.recoveryNotes.playbooks.length;

  return [
    {
      key: 'accessInfo',
      title: sections.accessInfo.title,
      itemCount: sections.accessInfo.items.length,
      documentCount: sections.accessInfo.supportingDocuments.length,
      status: sections.accessInfo.items.length > 0 ? 'ready' : 'missing',
      includes: 'Door codes, Wi-Fi details, shutoffs, and entry notes.',
      emptyState: sections.accessInfo.emptyState,
    },
    {
      key: 'emergencyContacts',
      title: sections.emergencyContacts.title,
      itemCount: sections.emergencyContacts.items.length,
      documentCount: 0,
      status: sections.emergencyContacts.items.length > 0 ? 'ready' : 'missing',
      includes: 'Neighbors, family, and service providers to contact first.',
      emptyState: sections.emergencyContacts.emptyState,
    },
    {
      key: 'insurance',
      title: sections.insurance.title,
      itemCount: sections.insurance.items.length,
      documentCount: sections.insurance.supportingDocuments.length,
      status: sections.insurance.items.length > 0 ? 'ready' : 'missing',
      includes: 'Policy references, claims contacts, and related paperwork.',
      emptyState: sections.insurance.emptyState,
    },
    {
      key: 'keyDevices',
      title: sections.keyDevices.title,
      itemCount: sections.keyDevices.items.length,
      documentCount: sections.keyDevices.supportingDocuments.length,
      status: sections.keyDevices.items.length > 0 ? 'ready' : 'missing',
      includes: 'Routers, phones, and critical connectivity devices.',
      emptyState: sections.keyDevices.emptyState,
    },
    {
      key: 'recoveryNotes',
      title: sections.recoveryNotes.title,
      itemCount: recoveryItemCount,
      documentCount: sections.recoveryNotes.supportingDocuments.length,
      status: recoveryItemCount > 0 ? 'ready' : 'missing',
      includes: 'Account recovery guidance and continuity playbooks.',
      emptyState: sections.recoveryNotes.emptyState,
    },
  ];
}

function getTrustedShareAudience(
  audienceKey: HomeVaultTrustedShareAudienceKey,
): HomeVaultTrustedShareAudience {
  return (
    HOMEVAULT_TRUSTED_SHARE_AUDIENCES.find((audience) => audience.key === audienceKey) ??
    HOMEVAULT_TRUSTED_SHARE_AUDIENCES[0]
  );
}

function getOfflineCompanionTarget(
  targetKey: HomeVaultOfflineCompanionPackTargetKey,
): HomeVaultOfflineCompanionPack['target'] {
  switch (targetKey) {
    case 'helper_device':
      return {
        key: 'helper_device',
        label: 'Helper device',
        description:
          'A narrower offline handoff for a trusted helper who may need to act during a real incident.',
      };
    case 'primary_user':
    default:
      return {
        key: 'primary_user',
        label: 'Primary user device',
        description:
          'A broader offline copy for the main household organizer when installs, logins, or connectivity are unreliable.',
      };
  }
}

function getCareCardTemplate(
  templateKey: HomeVaultCareCardTemplateKey,
) {
  return (
    HOMEVAULT_CARE_CARD_TEMPLATES.find((template) => template.key === templateKey) ??
    HOMEVAULT_CARE_CARD_TEMPLATES[0]
  );
}

function getCaregiverPlanAudience(
  audienceKey: HomeVaultCaregiverAudienceKey,
) {
  return (
    HOMEVAULT_CAREGIVER_PLAN_AUDIENCES.find((audience) => audience.key === audienceKey) ??
    HOMEVAULT_CAREGIVER_PLAN_AUDIENCES[0]
  );
}

function buildCareCardMissingPrompts({
  criticalNotes,
  emergencyContacts,
  medications,
  pickupRules,
  providerContacts,
  routines,
  schoolDetails,
  template,
}: {
  criticalNotes: string[];
  emergencyContacts: EmergencyContact[];
  medications: HomeVaultCareCardMedication[];
  pickupRules: string[];
  providerContacts: HomeVaultCareCardProviderContact[];
  routines: HomeVaultCareCardRoutine[];
  schoolDetails: string[];
  template: HomeVaultCareCardTemplateKey;
}): HomeVaultCareCardMissingPrompt[] {
  const prompts: HomeVaultCareCardMissingPrompt[] = [];

  if (routines.length === 0) {
    prompts.push({
      id: 'routines_missing',
      label: 'Add at least one routine',
      detail: 'A helper needs the basic daily flow before they can step in confidently.',
      severity: 'medium',
    });
  }

  if (emergencyContacts.length === 0) {
    prompts.push({
      id: 'emergency_contacts_missing',
      label: 'Add an emergency contact',
      detail: 'Care cards should point a helper to a trusted adult or backup contact immediately.',
      severity: 'high',
    });
  }

  if (template === 'child' && pickupRules.length === 0) {
    prompts.push({
      id: 'pickup_rules_missing',
      label: 'Add pickup or release rules',
      detail: 'Children need explicit pickup permissions, school rules, or adult handoff boundaries.',
      severity: 'high',
    });
  }

  if (template === 'child' && schoolDetails.length === 0) {
    prompts.push({
      id: 'school_details_missing',
      label: 'Add school or activity details',
      detail: 'A child handoff should note school, aftercare, activity, or dismissal instructions.',
      severity: 'high',
    });
  }

  if ((template === 'elder' || template === 'medical_dependent') && providerContacts.length === 0) {
    prompts.push({
      id: 'provider_contacts_missing',
      label: 'Add provider contacts',
      detail: 'Medical or elder support handoffs should include a clinician, pharmacy, or provider contact path.',
      severity: 'high',
    });
  }

  if ((template === 'pet' || template === 'medical_dependent') && medications.length === 0) {
    prompts.push({
      id: 'medications_missing',
      label: 'Add medication details',
      detail: 'This care scenario should include medication timing, dose, or a clear note that none are needed.',
      severity: 'high',
    });
  }

  if (criticalNotes.length === 0) {
    prompts.push({
      id: 'critical_notes_missing',
      label: 'Add a critical note',
      detail: 'Use critical notes for allergies, escalation rules, or the detail a stressed helper must not miss.',
      severity: template === 'medical_dependent' ? 'high' : 'medium',
    });
  }

  return prompts;
}

function summarizeCareCardSensitivity({
  criticalNotes,
  medications,
  missingPrompts,
  template,
}: {
  criticalNotes: string[];
  medications: HomeVaultCareCardMedication[];
  missingPrompts: HomeVaultCareCardMissingPrompt[];
  template: HomeVaultCareCardTemplateKey;
}): HomeVaultCareCard['sensitivity'] {
  const hasCriticalMedication = medications.some((item) => item.isCritical);
  const hasHighRiskGap = missingPrompts.some((prompt) => prompt.severity === 'high');
  const highRisk =
    template === 'medical_dependent' ||
    hasCriticalMedication ||
    criticalNotes.length > 0 ||
    hasHighRiskGap;

  return highRisk
    ? {
        level: 'high',
        label: 'High sensitivity',
        detail:
          'Care details can include medication timing, pickup rules, medical contacts, or escalation notes and should stay in tightly scoped caregiver handoffs.',
      }
    : {
        level: 'medium',
        label: 'Medium sensitivity',
        detail:
          'This care card is still personal, but it does not currently include the highest-risk medical or escalation details.',
      };
}

function buildTrustedShareSelections(
  audience: HomeVaultTrustedShareAudience,
  selectedKeys?: HomeVaultTrustedShareSectionKey[],
) {
  const includedKeys = new Set(selectedKeys ?? audience.recommendedSectionKeys);

  return {
    accessInfo: includedKeys.has('accessInfo'),
    emergencyContacts: includedKeys.has('emergencyContacts'),
    insurance: includedKeys.has('insurance'),
    keyDevices: includedKeys.has('keyDevices'),
    recoveryNotes: includedKeys.has('recoveryNotes'),
  } satisfies Record<HomeVaultTrustedShareSectionKey, boolean>;
}

function buildTrustedShareStandardSection<TItem>(
  section: HomeVaultEmergencyPacketSection<TItem>,
  summary: HomeVaultEmergencyPacketSectionSummary | undefined,
  included: boolean,
): HomeVaultTrustedShareSection<TItem> {
  const state = getTrustedShareSectionState(included, section.items.length);

  return {
    ...section,
    included: state === 'included',
    state,
    rationale: buildTrustedShareSectionRationale(state, summary?.emptyState),
  };
}

function buildTrustedShareDeviceSection(
  section: HomeVaultEmergencyPacketDeviceSection,
  summary: HomeVaultEmergencyPacketSectionSummary | undefined,
  included: boolean,
): HomeVaultTrustedShareDeviceSection {
  const state = getTrustedShareSectionState(included, section.items.length);

  return {
    ...section,
    included: state === 'included',
    state,
    rationale: buildTrustedShareSectionRationale(state, summary?.emptyState),
  };
}

function buildTrustedShareRecoverySection(
  section: HomeVaultEmergencyPacketRecoverySection,
  summary: HomeVaultEmergencyPacketSectionSummary | undefined,
  included: boolean,
): HomeVaultTrustedShareRecoverySection {
  const itemCount = section.notes.length + section.playbooks.length;
  const state = getTrustedShareSectionState(included, itemCount);

  return {
    ...section,
    included: state === 'included',
    state,
    rationale: buildTrustedShareSectionRationale(state, summary?.emptyState),
  };
}

function getTrustedShareSectionState(
  included: boolean,
  itemCount: number,
): HomeVaultTrustedShareSectionState {
  if (!included) {
    return 'excluded';
  }

  return itemCount > 0 ? 'included' : 'empty';
}

function buildTrustedShareSectionRationale(
  state: HomeVaultTrustedShareSectionState,
  emptyState?: string,
) {
  switch (state) {
    case 'included':
      return 'Included in this handoff.';
    case 'empty':
      return emptyState ?? 'No saved records are available for this section yet.';
    case 'excluded':
    default:
      return 'Left out to avoid sharing unrelated household details.';
  }
}

function buildTrustedShareSectionSummaries(
  sections: HomeVaultTrustedShareArtifact['sections'],
): HomeVaultTrustedShareSectionSummary[] {
  return HOMEVAULT_TRUSTED_SHARE_SECTION_OPTIONS.map((option) => {
    if (option.key === 'recoveryNotes') {
      const section = sections.recoveryNotes;

      return {
        key: option.key,
        title: option.title,
        itemCount: section.notes.length + section.playbooks.length,
        documentCount: section.supportingDocuments.length,
        state: section.state,
        includes: option.includes,
        rationale: section.rationale,
      };
    }

    const section = sections[option.key];
    const itemCount =
      option.key === 'keyDevices' || option.key === 'accessInfo' || option.key === 'emergencyContacts' || option.key === 'insurance'
        ? section.items.length
        : 0;

    return {
      key: option.key,
      title: option.title,
      itemCount,
      documentCount: section.supportingDocuments.length,
      state: section.state,
      includes: option.includes,
      rationale: section.rationale,
    };
  });
}

function collectDocumentIds(...groups: Array<ReadonlyArray<ReadonlyArray<string> | string[]>>) {
  const ids = new Set<string>();

  for (const group of groups) {
    for (const value of group) {
      for (const id of value) {
        ids.add(id);
      }
    }
  }

  return ids;
}

function toDocumentsById(
  documentById: Map<string, DocumentRecord>,
  documentIds: ReadonlySet<string>,
) {
  return [...documentIds]
    .map((documentId) => documentById.get(documentId))
    .filter((document): document is DocumentRecord => Boolean(document))
    .map((document) => ({
      id: document.id,
      title: document.title,
      type: document.type,
      date: document.date,
      vendor: document.vendor,
    }));
}

function toEmergencyPacketDocuments(documents: DocumentRecord[]) {
  return documents.map((document) => ({
    id: document.id,
    title: document.title,
    type: document.type,
    date: document.date,
    vendor: document.vendor,
  }));
}

function buildExportChecklist({
  activeTaskCount,
  attachedDocumentCount,
  assetCount,
  documentCount,
  documentedAssetCount,
  linkedDocumentCount,
  repairEventCount,
  repairEventsWithCostCount,
  roomCount,
  taskCompletionCount,
}: {
  activeTaskCount: number;
  attachedDocumentCount: number;
  assetCount: number;
  documentCount: number;
  documentedAssetCount: number;
  linkedDocumentCount: number;
  repairEventCount: number;
  repairEventsWithCostCount: number;
  roomCount: number;
  taskCompletionCount: number;
}) {
  return [
    {
      id: 'rooms',
      label: 'Rooms and areas',
      state: roomCount > 0 ? 'ready' : 'review',
      detail:
        roomCount > 0
          ? `${roomCount} area${roomCount === 1 ? '' : 's'} included`
          : 'Add at least one room or area before exporting',
      action:
        roomCount > 0
          ? 'Review room list for missing outdoor areas or systems'
          : 'Add rooms, exterior zones, or home systems from Household',
    },
    {
      id: 'assets',
      label: 'Asset inventory',
      state: assetCount > 0 ? 'ready' : 'review',
      detail:
        assetCount > 0
          ? `${assetCount} asset${assetCount === 1 ? '' : 's'} included`
          : 'Add appliances, systems, fixtures, or exterior items',
      action:
        assetCount > 0
          ? 'Check that major appliances and systems are represented'
          : 'Add appliances, systems, fixtures, or exterior items from Inventory',
    },
    {
      id: 'documents',
      label: 'Linked documents',
      state: documentCount > 0 && linkedDocumentCount === documentCount ? 'ready' : 'review',
      detail:
        documentCount > 0
          ? `${linkedDocumentCount} of ${documentCount} document${documentCount === 1 ? '' : 's'} linked`
          : 'Add receipts, manuals, warranties, invoices, or reports',
      action:
        documentCount > 0 && linkedDocumentCount === documentCount
          ? 'Review document links for accuracy'
          : 'Link each document to an asset, room, or property record',
    },
    {
      id: 'attachments',
      label: 'File attachments',
      state:
        documentCount === 0 || attachedDocumentCount === documentCount ? 'ready' : 'review',
      detail:
        documentCount > 0
          ? `${attachedDocumentCount} of ${documentCount} document${documentCount === 1 ? '' : 's'} ${
              documentCount === 1 ? 'includes' : 'include'
            } file references`
          : 'No documents require file references yet',
      action:
        documentCount === 0 || attachedDocumentCount === documentCount
          ? 'Confirm file references still point to the right documents'
          : 'Open document records and attach the missing source files',
    },
    {
      id: 'history',
      label: 'Service history',
      state: taskCompletionCount > 0 || repairEventCount > 0 ? 'ready' : 'review',
      detail:
        taskCompletionCount > 0 || repairEventCount > 0
          ? `${taskCompletionCount} completion${taskCompletionCount === 1 ? '' : 's'} and ${repairEventsWithCostCount} costed repair${repairEventsWithCostCount === 1 ? '' : 's'}`
          : 'Complete a task or record a repair to build history',
      action:
        taskCompletionCount > 0 || repairEventCount > 0
          ? 'Review service history for missing costs or providers'
          : 'Complete a maintenance task or add a repair event',
    },
    {
      id: 'tasks',
      label: 'Open maintenance',
      state: activeTaskCount === 0 ? 'ready' : 'review',
      detail:
        activeTaskCount === 0
          ? 'No open tasks need attention'
          : `${activeTaskCount} open task${activeTaskCount === 1 ? '' : 's'} to review`,
      action:
        activeTaskCount === 0
          ? 'Export is clear of open maintenance tasks'
          : 'Complete, snooze, or update open maintenance tasks',
    },
    {
      id: 'assetDocumentation',
      label: 'Asset documentation',
      state: assetCount > 0 && documentedAssetCount === assetCount ? 'ready' : 'review',
      detail:
        assetCount > 0
          ? `${documentedAssetCount} of ${assetCount} asset${assetCount === 1 ? '' : 's'} ${
              assetCount === 1 ? 'has' : 'have'
            } documents`
          : 'Add assets before tracking documentation coverage',
      action:
        assetCount > 0 && documentedAssetCount === assetCount
          ? 'Confirm each asset has its most useful document attached'
          : 'Link receipts, manuals, warranties, or invoices to undocumented assets',
    },
  ] satisfies HomeVaultExportChecklistItem[];
}

function buildExportAttachments(documents: DocumentRecord[]): HomeVaultExportAttachment[] {
  return documents
    .filter((document) => getDocumentAttachmentUri(document))
    .map((document) => ({
      attachedAt: document.attachment?.attachedAt,
      documentId: document.id,
      fileName: document.attachment?.fileName,
      filePath: getDocumentAttachmentUri(document) as string,
      title: document.title,
      linkedRecordIds: [...document.linkedRecordIds],
      mimeType: document.attachment?.mimeType,
      sizeBytes: document.attachment?.sizeBytes,
      storageKind: document.attachment?.storageKind,
      type: document.type,
    }));
}

function getDocumentAttachmentUri(document: DocumentRecord) {
  return document.attachment?.storedUri ?? document.filePath;
}
