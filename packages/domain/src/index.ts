export type EntityId = string;

export type HouseholdRole = 'owner' | 'editor' | 'viewer';

export type AssetStatus = 'ready' | 'needs_attention' | 'warranty_soon' | 'retired';

export type MaintenanceTaskState = 'overdue' | 'due_today' | 'upcoming' | 'snoozed' | 'completed';

export type DocumentType =
  | 'receipt'
  | 'warranty'
  | 'manual'
  | 'invoice'
  | 'report'
  | 'photo'
  | 'other';
export type DocumentAttachmentStorageKind = 'external_reference' | 'app_copy';

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
};

export type Asset = {
  id: EntityId;
  propertyId: EntityId;
  roomId?: EntityId;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  serial?: string;
  installDate?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  costCents?: number;
  status: AssetStatus;
  notes?: string;
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
