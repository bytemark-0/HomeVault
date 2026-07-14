export type EntityId = string;

export type HouseholdRole = 'owner' | 'editor' | 'viewer';

export type AssetStatus = 'ready' | 'needs_attention' | 'warranty_soon' | 'retired';

export type MaintenanceTaskState = 'overdue' | 'due_today' | 'upcoming' | 'snoozed' | 'completed';

export type DocumentType =
  | 'receipt'
  | 'warranty'
  | 'manual'
  | 'insurance'
  | 'policy'
  | 'emergency'
  | 'home_file'
  | 'invoice'
  | 'report'
  | 'photo'
  | 'other';
export type DocumentAttachmentStorageKind = 'external_reference' | 'app_copy';
export type AccessItemCategory =
  | 'wifi'
  | 'router'
  | 'garage'
  | 'alarm'
  | 'safe'
  | 'utility_shutoff'
  | 'lockbox'
  | 'entry_note'
  | 'other';
export type ImportantAccountKind =
  | 'insurance'
  | 'utility'
  | 'internet'
  | 'email'
  | 'carrier'
  | 'platform'
  | 'security'
  | 'smart_home'
  | 'banking'
  | 'government'
  | 'warranty'
  | 'other';
export type ImportantAccountManagerRole =
  | 'self'
  | 'partner'
  | 'shared_household'
  | 'helper'
  | 'service_provider'
  | 'other';
export type EmergencyContactPriority = 'primary' | 'secondary' | 'service_provider' | 'other';
export type EmergencyContactResponsibilityCategory =
  | 'school'
  | 'pet'
  | 'home_service'
  | 'trusted_helper'
  | 'other';
export type ContinuityPlaybookCategory =
  | 'emergency'
  | 'digital_safety'
  | 'travel'
  | 'storm'
  | 'handoff'
  | 'other';
export type ContinuityPlaybookState = 'not_started' | 'in_progress' | 'ready';

export type DocumentAttachment = {
  storageKind: DocumentAttachmentStorageKind;
  storedUri: string;
  attachedAt: string;
  fileName?: string;
  mimeType?: string;
  originalUri?: string;
  sizeBytes?: number;
};

export type MaintenanceScope = 'asset' | 'room' | 'property';

export type RecurrenceKind = 'one_time' | 'interval' | 'seasonal' | 'date_based' | 'usage_based';

export type User = {
  id: EntityId;
  name: string;
  email: string;
  locale: string;
  timezone: string;
};

export type Household = {
  id: EntityId;
  name: string;
  ownerId: EntityId;
  subscriptionPlan: 'free' | 'plus' | 'lifetime' | 'multi_property';
};

export type HouseholdMember = {
  householdId: EntityId;
  userId: EntityId;
  role: HouseholdRole;
};

export type Property = {
  id: EntityId;
  householdId: EntityId;
  label: string;
  addressLabel?: string;
  type: 'single_family' | 'townhome' | 'condo' | 'multi_unit' | 'other';
  yearBuilt?: number;
  purchaseDate?: string;
  photoUri?: string;
};

export type RoomArea = {
  id: EntityId;
  propertyId: EntityId;
  name: string;
  type: 'room' | 'area' | 'exterior' | 'system';
  floor?: string;
  photoUri?: string;
};

export type Asset = {
  id: EntityId;
  propertyId: EntityId;
  roomId?: EntityId;
  name: string;
  category: string;
  ownerName?: string;
  backupHelperName?: string;
  brand?: string;
  model?: string;
  serial?: string;
  installDate?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  backupEnabled?: boolean;
  screenLockEnabled?: boolean;
  findMyDeviceEnabled?: boolean;
  networkName?: string;
  internetProvider?: string;
  networkAdminUrl?: string;
  photoUri?: string;
  costCents?: number;
  status: AssetStatus;
  notes?: string;
  lastReviewedAt?: string;
};

export type DocumentRecord = {
  id: EntityId;
  propertyId: EntityId;
  title: string;
  type: DocumentType;
  filePath?: string;
  attachment?: DocumentAttachment;
  date?: string;
  vendor?: string;
  amountCents?: number;
  ocrText?: string;
  linkedRecordIds: EntityId[];
};

export type MaintenanceTask = {
  id: EntityId;
  propertyId: EntityId;
  scope: MaintenanceScope;
  scopeId: EntityId;
  title: string;
  dueDate: string;
  recurrenceKind: RecurrenceKind;
  recurrenceLabel: string;
  assigneeId?: EntityId;
  state: MaintenanceTaskState;
  instructions?: string;
};

export type TaskCompletion = {
  id: EntityId;
  taskId: EntityId;
  completedAt: string;
  completedByUserId?: EntityId;
  costCents?: number;
  notes?: string;
  photoUri?: string;
  kind?: 'completed' | 'skipped';
};

export type RepairEvent = {
  id: EntityId;
  propertyId: EntityId;
  assetId: EntityId;
  issue: string;
  provider?: string;
  diagnosis?: string;
  resolution?: string;
  costCents?: number;
  date: string;
  documentIds: EntityId[];
};

export type PartSupply = {
  id: EntityId;
  propertyId: EntityId;
  assetId?: EntityId;
  maintenanceTaskId?: EntityId;
  name: string;
  partNumber?: string;
  size?: string;
  quantity?: number;
  link?: string;
};

export type ProjectImprovement = {
  id: EntityId;
  propertyId: EntityId;
  title: string;
  startDate?: string;
  endDate?: string;
  contractor?: string;
  costCents?: number;
  notes?: string;
  linkedRecordIds: EntityId[];
};

export type AccessItem = {
  id: EntityId;
  propertyId: EntityId;
  category: AccessItemCategory;
  label: string;
  username?: string;
  accessCode?: string;
  location?: string;
  instructions?: string;
  notes?: string;
  linkedAssetId?: EntityId;
  linkedDocumentIds: EntityId[];
  lastVerifiedAt?: string;
  lastReviewedAt?: string;
};

export type EmergencyContact = {
  id: EntityId;
  propertyId: EntityId;
  name: string;
  role: string;
  priority: EmergencyContactPriority;
  responsibilityCategory?: EmergencyContactResponsibilityCategory;
  ownerRole?: ImportantAccountManagerRole;
  backupHelperName?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  lastReviewedAt?: string;
};

export type ImportantAccount = {
  id: EntityId;
  propertyId: EntityId;
  kind: ImportantAccountKind;
  providerName: string;
  label: string;
  accountNumber?: string;
  website?: string;
  phone?: string;
  email?: string;
  managerRole?: ImportantAccountManagerRole;
  backupHelperName?: string;
  isSharedHouseholdAccount?: boolean;
  mfaEnabled?: boolean;
  recoveryCodesStored?: boolean;
  managedInPasswordManager?: boolean;
  recoveryNotes?: string;
  notes?: string;
  linkedDocumentIds: EntityId[];
  lastReviewedAt?: string;
};

export type ContinuityPlaybookStep = {
  id: EntityId;
  label: string;
  notes?: string;
  isRequired: boolean;
  isComplete: boolean;
};

export type ContinuityPlaybook = {
  id: EntityId;
  propertyId: EntityId;
  category: ContinuityPlaybookCategory;
  title: string;
  state: ContinuityPlaybookState;
  notes?: string;
  steps: ContinuityPlaybookStep[];
  linkedRecordIds: EntityId[];
};

export type ContinuityExperienceSection =
  | 'access'
  | 'documents'
  | 'devices'
  | 'emergency'
  | 'inventory';

const DEVICE_KEYWORDS = [
  'router',
  'modem',
  'network',
  'wifi',
  'wi-fi',
  'device',
  'camera',
  'sensor',
  'computer',
  'laptop',
  'desktop',
  'phone',
  'iphone',
  'ipad',
  'tablet',
  'watch',
  'thermostat',
  'doorbell',
  'garage opener',
  'alarm',
  'smart lock',
  'speaker',
];

export function isRouterAsset(asset: Pick<Asset, 'category' | 'name'>): boolean {
  const label = `${asset.category} ${asset.name}`.toLowerCase();

  return (
    label.includes('router') ||
    label.includes('modem') ||
    label.includes('wifi') ||
    label.includes('wi-fi') ||
    label.includes('mesh')
  );
}

export function isDeviceAsset(asset: Pick<Asset, 'category' | 'name'>): boolean {
  const label = `${asset.category} ${asset.name}`.toLowerCase();

  return DEVICE_KEYWORDS.some((keyword) => label.includes(keyword));
}

export function mapAssetToContinuitySection(
  asset: Pick<Asset, 'category' | 'name'>,
): ContinuityExperienceSection {
  if (isDeviceAsset(asset)) {
    return 'devices';
  }

  return 'inventory';
}

export function mapDocumentToContinuitySection(
  document: Pick<DocumentRecord, 'type' | 'title'>,
): ContinuityExperienceSection {
  const label = document.title.toLowerCase();

  if (
    document.type === 'insurance' ||
    document.type === 'policy' ||
    document.type === 'emergency' ||
    label.includes('insurance') ||
    label.includes('policy') ||
    label.includes('claim') ||
    label.includes('emergency')
  ) {
    return 'emergency';
  }

  if (document.type === 'manual' || label.includes('router') || label.includes('wifi')) {
    return 'devices';
  }

  return 'documents';
}
