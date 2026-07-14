import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type {
  AccessItem,
  Asset,
  DocumentRecord,
  EmergencyContact,
  ImportantAccount,
  Property,
} from '@homevault/domain';
import {
  buildHomeVaultItemShareBundle,
  formatHomeVaultItemShareBundle,
  HOMEVAULT_ITEM_SHARE_AUDIENCES,
  type HomeVaultItemShareAudienceKey,
  type HomeVaultItemShareBundleItem,
  type HomeVaultItemShareBundlePayload,
  type HomeVaultItemShareRecordType,
} from '@homevault/export';

import { getAccessItemSensitivity, getImportantAccountSensitivity } from './sensitivity';

export type SupportedItemShareRecordType =
  | 'access_item'
  | 'emergency_contact'
  | 'important_account'
  | 'asset'
  | 'document';

export type ItemShareFieldOption = {
  id: string;
  label: string;
  value: string;
  audienceKeys: HomeVaultItemShareAudienceKey[];
};

export type ItemShareDraft = {
  defaultAudienceKey: HomeVaultItemShareAudienceKey;
  fieldOptions: ItemShareFieldOption[];
  linkedRecordIds: string[];
  recordId: string;
  recordType: SupportedItemShareRecordType;
  sensitivityLevel: 'low' | 'medium' | 'high';
  subtitle: string;
  title: string;
  warning: string;
};

export type ItemShareExportInput = {
  audienceKey: HomeVaultItemShareAudienceKey;
  draft: ItemShareDraft;
  expiresInDays?: number;
  passphrase: string;
  property: Pick<Property, 'id' | 'label' | 'type'>;
  senderLabel: string;
  target:
    | { recordType: 'access_item'; record: AccessItem }
    | { recordType: 'emergency_contact'; record: EmergencyContact }
    | { recordType: 'important_account'; record: ImportantAccount }
    | { recordType: 'asset'; record: Asset }
    | { recordType: 'document'; record: DocumentRecord };
  selectedFieldIds: string[];
};

export function buildItemShareDraft(input: ItemShareExportInput['target']): ItemShareDraft {
  switch (input.recordType) {
    case 'document':
      return buildDocumentDraft(input.record);
    case 'asset':
      return buildAssetDraft(input.record);
    case 'emergency_contact':
      return buildEmergencyContactDraft(input.record);
    case 'important_account':
      return buildImportantAccountDraft(input.record);
    case 'access_item':
    default:
      return buildAccessItemDraft(input.record);
  }
}

export function getDefaultItemShareFieldIds(draft: ItemShareDraft, audienceKey: HomeVaultItemShareAudienceKey) {
  return draft.fieldOptions
    .filter((field) => field.audienceKeys.includes(audienceKey))
    .map((field) => field.id);
}

export function getItemShareSupportMessage() {
  if (typeof globalThis.crypto?.subtle?.encrypt !== 'function') {
    return 'Encrypted item sharing needs a browser runtime with Web Crypto support in this preview.';
  }

  if (typeof globalThis.crypto?.getRandomValues !== 'function') {
    return 'Encrypted item sharing needs secure random number support in this preview.';
  }

  if (typeof globalThis.TextEncoder === 'undefined') {
    return 'Encrypted item sharing needs text encoding support in this preview.';
  }

  if (typeof globalThis.btoa !== 'function') {
    return 'Encrypted item sharing needs base64 encoding support in this preview.';
  }

  return null;
}

export async function createEncryptedItemShareBundle(input: ItemShareExportInput) {
  const sharePayload = buildItemSharePayload(input);
  const ciphertext = await encryptItemSharePayload(sharePayload.payload, input.passphrase);
  const expiresAt = input.expiresInDays
    ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : undefined;

  return buildHomeVaultItemShareBundle({
    property: input.property,
    senderLabel: input.senderLabel.trim(),
    audience: getItemShareAudience(input.audienceKey),
    expiresAt,
    items: sharePayload.items,
    encryption: ciphertext,
  });
}

export async function shareItemShareBundle(bundleText: string, fileName: string) {
  if (Platform.OS === 'web') {
    if (typeof document === 'undefined' || typeof URL === 'undefined') {
      throw new Error('Downloading item-share bundles is not supported in this preview.');
    }

    const blob = new Blob([bundleText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    return 'downloaded' as const;
  }

  const isAvailable = await Sharing.isAvailableAsync();

  if (!isAvailable) {
    throw new Error('Sharing is not available on this device.');
  }

  const file = new File(Paths.cache, fileName);
  file.write(bundleText);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Share encrypted HomeVault item bundle',
    UTI: 'public.json',
  });
  return 'shared' as const;
}

export function createItemShareFileName(draft: ItemShareDraft) {
  const labelSlug = slugify(draft.title);
  const date = new Date().toISOString().slice(0, 10);
  return `homevault-item-share-${draft.recordType}-${labelSlug}-${date}.json`;
}

function buildAccessItemDraft(accessItem: AccessItem): ItemShareDraft {
  return {
    recordType: 'access_item',
    recordId: accessItem.id,
    title: accessItem.label,
    subtitle: 'Share one access record without exporting unrelated household details.',
    warning:
      'Access records can include codes, locations, and entry instructions. Share the bundle file and passphrase separately.',
    sensitivityLevel: getAccessItemSensitivity(accessItem).level,
    defaultAudienceKey: 'emergency_helper',
    linkedRecordIds: [
      ...(accessItem.linkedAssetId ? [accessItem.linkedAssetId] : []),
      ...accessItem.linkedDocumentIds,
    ],
    fieldOptions: [
      { id: 'username', label: 'Login', value: accessItem.username ?? 'Not recorded', audienceKeys: ['spouse', 'house_sitter', 'emergency_helper'] },
      { id: 'accessCode', label: 'Code', value: accessItem.accessCode ?? 'Not recorded', audienceKeys: ['spouse', 'house_sitter', 'emergency_helper'] },
      { id: 'location', label: 'Location', value: accessItem.location ?? 'Not recorded', audienceKeys: ['spouse', 'house_sitter', 'emergency_helper', 'contractor', 'other'] },
      { id: 'instructions', label: 'Instructions', value: accessItem.instructions ?? 'Not recorded', audienceKeys: ['spouse', 'house_sitter', 'emergency_helper', 'contractor', 'other'] },
      { id: 'notes', label: 'Notes', value: accessItem.notes ?? 'No notes yet.', audienceKeys: ['spouse', 'house_sitter', 'other'] },
    ],
  };
}

function buildEmergencyContactDraft(contact: EmergencyContact): ItemShareDraft {
  return {
    recordType: 'emergency_contact',
    recordId: contact.id,
    title: contact.name,
    subtitle: 'Share one trusted contact directly from the emergency plan.',
    warning:
      'This bundle is read-only and may include direct contact details. Share the file and passphrase separately.',
    sensitivityLevel: contact.notes || contact.address ? 'medium' : 'low',
    defaultAudienceKey: 'emergency_helper',
    linkedRecordIds: [],
    fieldOptions: [
      { id: 'phone', label: 'Phone', value: contact.phone ?? 'Not recorded', audienceKeys: ['spouse', 'house_sitter', 'emergency_helper', 'contractor', 'other'] },
      { id: 'email', label: 'Email', value: contact.email ?? 'Not recorded', audienceKeys: ['spouse', 'emergency_helper', 'contractor', 'other'] },
      { id: 'address', label: 'Address', value: contact.address ?? 'Not recorded', audienceKeys: ['spouse', 'house_sitter', 'other'] },
      { id: 'notes', label: 'Notes', value: contact.notes ?? 'No notes yet.', audienceKeys: ['spouse', 'emergency_helper', 'other'] },
    ],
  };
}

function buildImportantAccountDraft(account: ImportantAccount): ItemShareDraft {
  return {
    recordType: 'important_account',
    recordId: account.id,
    title: account.label,
    subtitle: 'Share one important account record with field-level control.',
    warning:
      'Account bundles can include recovery details or account IDs. Keep the bundle file and passphrase separate.',
    sensitivityLevel: getImportantAccountSensitivity(account).level,
    defaultAudienceKey: 'spouse',
    linkedRecordIds: [...account.linkedDocumentIds],
    fieldOptions: [
      { id: 'website', label: 'Website', value: account.website ?? 'Not recorded', audienceKeys: ['spouse', 'emergency_helper', 'contractor', 'other'] },
      { id: 'phone', label: 'Phone', value: account.phone ?? 'Not recorded', audienceKeys: ['spouse', 'emergency_helper', 'contractor', 'other'] },
      { id: 'email', label: 'Email', value: account.email ?? 'Not recorded', audienceKeys: ['spouse', 'emergency_helper', 'other'] },
      { id: 'accountNumber', label: 'Account ID', value: account.accountNumber ?? 'Not recorded', audienceKeys: ['spouse', 'emergency_helper', 'other'] },
      { id: 'mfaEnabled', label: 'MFA status', value: formatBooleanLabel(account.mfaEnabled), audienceKeys: ['spouse', 'emergency_helper', 'other'] },
      { id: 'recoveryCodesStored', label: 'Recovery codes', value: formatBooleanLabel(account.recoveryCodesStored), audienceKeys: ['spouse', 'emergency_helper', 'other'] },
      { id: 'managedInPasswordManager', label: 'Password manager', value: formatBooleanLabel(account.managedInPasswordManager), audienceKeys: ['spouse', 'emergency_helper', 'other'] },
      { id: 'recoveryNotes', label: 'Recovery notes', value: account.recoveryNotes ?? 'No notes yet.', audienceKeys: ['spouse', 'emergency_helper', 'other'] },
      { id: 'notes', label: 'Notes', value: account.notes ?? 'No notes yet.', audienceKeys: ['spouse', 'other'] },
    ],
  };
}

function buildAssetDraft(asset: Asset): ItemShareDraft {
  return {
    recordType: 'asset',
    recordId: asset.id,
    title: asset.name,
    subtitle: 'Share one key device without exposing unrelated household records.',
    warning:
      'Device bundles can include recovery and network details. Share the encrypted file and passphrase separately.',
    sensitivityLevel:
      asset.serial || asset.networkName || asset.networkAdminUrl || asset.internetProvider
        ? 'medium'
        : 'low',
    defaultAudienceKey: 'emergency_helper',
    linkedRecordIds: [],
    fieldOptions: [
      { id: 'ownerName', label: 'Owner', value: asset.ownerName ?? 'Not recorded', audienceKeys: ['spouse', 'house_sitter', 'emergency_helper', 'other'] },
      { id: 'brand', label: 'Brand', value: asset.brand ?? 'Not recorded', audienceKeys: ['spouse', 'house_sitter', 'emergency_helper', 'contractor', 'other'] },
      { id: 'model', label: 'Model', value: asset.model ?? 'Not recorded', audienceKeys: ['spouse', 'house_sitter', 'emergency_helper', 'contractor', 'other'] },
      { id: 'serial', label: 'Serial', value: asset.serial ?? 'Not recorded', audienceKeys: ['spouse', 'emergency_helper', 'contractor', 'other'] },
      { id: 'networkName', label: 'Network name', value: asset.networkName ?? 'Not recorded', audienceKeys: ['spouse', 'house_sitter', 'emergency_helper', 'other'] },
      { id: 'internetProvider', label: 'Internet provider', value: asset.internetProvider ?? 'Not recorded', audienceKeys: ['spouse', 'house_sitter', 'emergency_helper', 'contractor', 'other'] },
      { id: 'networkAdminUrl', label: 'Admin address', value: asset.networkAdminUrl ?? 'Not recorded', audienceKeys: ['spouse', 'emergency_helper', 'contractor', 'other'] },
      { id: 'backupEnabled', label: 'Backup', value: formatBooleanLabel(asset.backupEnabled), audienceKeys: ['spouse', 'emergency_helper', 'other'] },
      { id: 'screenLockEnabled', label: 'Screen lock', value: formatBooleanLabel(asset.screenLockEnabled), audienceKeys: ['spouse', 'emergency_helper', 'other'] },
      { id: 'findMyDeviceEnabled', label: 'Find my device', value: formatBooleanLabel(asset.findMyDeviceEnabled), audienceKeys: ['spouse', 'emergency_helper', 'other'] },
      { id: 'notes', label: 'Notes', value: asset.notes ?? 'No notes yet.', audienceKeys: ['spouse', 'house_sitter', 'emergency_helper', 'other'] },
    ],
  };
}

function buildDocumentDraft(document: DocumentRecord): ItemShareDraft {
  return {
    recordType: 'document',
    recordId: document.id,
    title: document.title,
    subtitle: 'Share one critical document summary without bundling the original file attachment.',
    warning:
      'Document bundles include metadata and captured text only. Attachments stay out of the encrypted bundle and must be shared separately.',
    sensitivityLevel:
      document.ocrText || document.amountCents !== undefined || document.vendor ? 'medium' : 'low',
    defaultAudienceKey: 'spouse',
    linkedRecordIds: [...document.linkedRecordIds],
    fieldOptions: [
      { id: 'date', label: 'Document date', value: document.date ?? 'Not recorded', audienceKeys: ['spouse', 'house_sitter', 'emergency_helper', 'contractor', 'other'] },
      { id: 'vendor', label: 'Vendor', value: document.vendor ?? 'Not recorded', audienceKeys: ['spouse', 'emergency_helper', 'contractor', 'other'] },
      { id: 'amount', label: 'Amount', value: formatCurrencyLabel(document.amountCents), audienceKeys: ['spouse', 'emergency_helper', 'other'] },
      { id: 'ocrText', label: 'Captured text', value: document.ocrText ?? 'No text captured yet.', audienceKeys: ['spouse', 'emergency_helper', 'other'] },
    ],
  };
}

function buildItemSharePayload(input: ItemShareExportInput) {
  const selectedFieldIds = new Set(input.selectedFieldIds);
  const recordId = input.draft.recordId;
  const includedFieldIds = [...selectedFieldIds];
  const omittedFieldIds = input.draft.fieldOptions
    .map((field) => field.id)
    .filter((fieldId) => !selectedFieldIds.has(fieldId));

  const item: HomeVaultItemShareBundleItem = {
    recordType: input.draft.recordType,
    recordId,
    label: input.draft.title,
    linkedRecordIds: [...input.draft.linkedRecordIds],
    includedFieldIds,
    omittedFieldIds,
  };

  switch (input.target.recordType) {
    case 'document':
      return {
        items: [item],
        payload: {
          property: input.property,
          records: {
            accessItems: [],
            emergencyContacts: [],
            importantAccounts: [],
            assets: [],
            documents: [buildSharedDocument(input.target.record, selectedFieldIds)],
            continuityPlaybooks: [],
          },
          omittedFieldIdsByRecordId: { [recordId]: omittedFieldIds },
          readOnly: true,
        } satisfies HomeVaultItemShareBundlePayload,
      };
    case 'asset':
      return {
        items: [item],
        payload: {
          property: input.property,
          records: {
            accessItems: [],
            emergencyContacts: [],
            importantAccounts: [],
            assets: [buildSharedAsset(input.target.record, selectedFieldIds)],
            documents: [],
            continuityPlaybooks: [],
          },
          omittedFieldIdsByRecordId: { [recordId]: omittedFieldIds },
          readOnly: true,
        } satisfies HomeVaultItemShareBundlePayload,
      };
    case 'emergency_contact':
      return {
        items: [item],
        payload: {
          property: input.property,
          records: {
            accessItems: [],
            emergencyContacts: [buildSharedEmergencyContact(input.target.record, selectedFieldIds)],
            importantAccounts: [],
            assets: [],
            documents: [],
            continuityPlaybooks: [],
          },
          omittedFieldIdsByRecordId: { [recordId]: omittedFieldIds },
          readOnly: true,
        } satisfies HomeVaultItemShareBundlePayload,
      };
    case 'important_account':
      return {
        items: [item],
        payload: {
          property: input.property,
          records: {
            accessItems: [],
            emergencyContacts: [],
            importantAccounts: [buildSharedImportantAccount(input.target.record, selectedFieldIds)],
            assets: [],
            documents: [],
            continuityPlaybooks: [],
          },
          omittedFieldIdsByRecordId: { [recordId]: omittedFieldIds },
          readOnly: true,
        } satisfies HomeVaultItemShareBundlePayload,
      };
    case 'access_item':
    default:
      return {
        items: [item],
        payload: {
          property: input.property,
          records: {
            accessItems: [buildSharedAccessItem(input.target.record, selectedFieldIds)],
            emergencyContacts: [],
            importantAccounts: [],
            assets: [],
            documents: [],
            continuityPlaybooks: [],
          },
          omittedFieldIdsByRecordId: { [recordId]: omittedFieldIds },
          readOnly: true,
        } satisfies HomeVaultItemShareBundlePayload,
      };
  }
}

async function encryptItemSharePayload(
  payload: HomeVaultItemShareBundlePayload,
  passphrase: string,
): Promise<{
  scheme: 'aes-256-gcm';
  keyDerivation: 'pbkdf2-sha256';
  iterations: number;
  saltBase64: string;
  ivBase64: string;
  ciphertextBase64: string;
}> {
  const supportMessage = getItemShareSupportMessage();

  if (supportMessage) {
    throw new Error(supportMessage);
  }

  const iterations = 150000;
  const encoder = new TextEncoder();
  const cryptoApi = globalThis.crypto;
  const subtle = cryptoApi.subtle;
  const salt = cryptoApi.getRandomValues(new Uint8Array(16));
  const iv = cryptoApi.getRandomValues(new Uint8Array(12));
  const keyMaterial = await subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, [
    'deriveKey',
  ]);
  const key = await subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );
  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(payload)),
  );

  return {
    scheme: 'aes-256-gcm',
    keyDerivation: 'pbkdf2-sha256',
    iterations,
    saltBase64: encodeBase64(salt),
    ivBase64: encodeBase64(iv),
    ciphertextBase64: encodeBase64(new Uint8Array(ciphertext)),
  };
}

function buildSharedAccessItem(accessItem: AccessItem, selectedFieldIds: Set<string>): AccessItem {
  return {
    id: accessItem.id,
    propertyId: accessItem.propertyId,
    category: accessItem.category,
    label: accessItem.label,
    ...(selectedFieldIds.has('username') && accessItem.username ? { username: accessItem.username } : {}),
    ...(selectedFieldIds.has('accessCode') && accessItem.accessCode ? { accessCode: accessItem.accessCode } : {}),
    ...(selectedFieldIds.has('location') && accessItem.location ? { location: accessItem.location } : {}),
    ...(selectedFieldIds.has('instructions') && accessItem.instructions
      ? { instructions: accessItem.instructions }
      : {}),
    ...(selectedFieldIds.has('notes') && accessItem.notes ? { notes: accessItem.notes } : {}),
    linkedDocumentIds: [],
  };
}

function buildSharedEmergencyContact(
  contact: EmergencyContact,
  selectedFieldIds: Set<string>,
): EmergencyContact {
  return {
    id: contact.id,
    propertyId: contact.propertyId,
    name: contact.name,
    role: contact.role,
    priority: contact.priority,
    ...(selectedFieldIds.has('phone') && contact.phone ? { phone: contact.phone } : {}),
    ...(selectedFieldIds.has('email') && contact.email ? { email: contact.email } : {}),
    ...(selectedFieldIds.has('address') && contact.address ? { address: contact.address } : {}),
    ...(selectedFieldIds.has('notes') && contact.notes ? { notes: contact.notes } : {}),
  };
}

function buildSharedImportantAccount(
  account: ImportantAccount,
  selectedFieldIds: Set<string>,
): ImportantAccount {
  return {
    id: account.id,
    propertyId: account.propertyId,
    kind: account.kind,
    providerName: account.providerName,
    label: account.label,
    ...(selectedFieldIds.has('website') && account.website ? { website: account.website } : {}),
    ...(selectedFieldIds.has('phone') && account.phone ? { phone: account.phone } : {}),
    ...(selectedFieldIds.has('email') && account.email ? { email: account.email } : {}),
    ...(selectedFieldIds.has('accountNumber') && account.accountNumber
      ? { accountNumber: account.accountNumber }
      : {}),
    ...(selectedFieldIds.has('mfaEnabled') && account.mfaEnabled !== undefined
      ? { mfaEnabled: account.mfaEnabled }
      : {}),
    ...(selectedFieldIds.has('recoveryCodesStored') && account.recoveryCodesStored !== undefined
      ? { recoveryCodesStored: account.recoveryCodesStored }
      : {}),
    ...(selectedFieldIds.has('managedInPasswordManager') &&
    account.managedInPasswordManager !== undefined
      ? { managedInPasswordManager: account.managedInPasswordManager }
      : {}),
    ...(selectedFieldIds.has('recoveryNotes') && account.recoveryNotes
      ? { recoveryNotes: account.recoveryNotes }
      : {}),
    ...(selectedFieldIds.has('notes') && account.notes ? { notes: account.notes } : {}),
    linkedDocumentIds: [],
  };
}

function buildSharedAsset(asset: Asset, selectedFieldIds: Set<string>): Asset {
  return {
    id: asset.id,
    propertyId: asset.propertyId,
    name: asset.name,
    category: asset.category,
    status: asset.status,
    ...(selectedFieldIds.has('ownerName') && asset.ownerName ? { ownerName: asset.ownerName } : {}),
    ...(selectedFieldIds.has('brand') && asset.brand ? { brand: asset.brand } : {}),
    ...(selectedFieldIds.has('model') && asset.model ? { model: asset.model } : {}),
    ...(selectedFieldIds.has('serial') && asset.serial ? { serial: asset.serial } : {}),
    ...(selectedFieldIds.has('networkName') && asset.networkName
      ? { networkName: asset.networkName }
      : {}),
    ...(selectedFieldIds.has('internetProvider') && asset.internetProvider
      ? { internetProvider: asset.internetProvider }
      : {}),
    ...(selectedFieldIds.has('networkAdminUrl') && asset.networkAdminUrl
      ? { networkAdminUrl: asset.networkAdminUrl }
      : {}),
    ...(selectedFieldIds.has('backupEnabled') && asset.backupEnabled !== undefined
      ? { backupEnabled: asset.backupEnabled }
      : {}),
    ...(selectedFieldIds.has('screenLockEnabled') && asset.screenLockEnabled !== undefined
      ? { screenLockEnabled: asset.screenLockEnabled }
      : {}),
    ...(selectedFieldIds.has('findMyDeviceEnabled') && asset.findMyDeviceEnabled !== undefined
      ? { findMyDeviceEnabled: asset.findMyDeviceEnabled }
      : {}),
    ...(selectedFieldIds.has('notes') && asset.notes ? { notes: asset.notes } : {}),
  };
}

function buildSharedDocument(
  document: DocumentRecord,
  selectedFieldIds: Set<string>,
): DocumentRecord {
  return {
    id: document.id,
    propertyId: document.propertyId,
    title: document.title,
    type: document.type,
    linkedRecordIds: [...document.linkedRecordIds],
    ...(selectedFieldIds.has('date') && document.date ? { date: document.date } : {}),
    ...(selectedFieldIds.has('vendor') && document.vendor ? { vendor: document.vendor } : {}),
    ...(selectedFieldIds.has('amount') && document.amountCents !== undefined
      ? { amountCents: document.amountCents }
      : {}),
    ...(selectedFieldIds.has('ocrText') && document.ocrText ? { ocrText: document.ocrText } : {}),
  };
}

function getItemShareAudience(audienceKey: HomeVaultItemShareAudienceKey) {
  return (
    HOMEVAULT_ITEM_SHARE_AUDIENCES.find((audience) => audience.key === audienceKey) ??
    HOMEVAULT_ITEM_SHARE_AUDIENCES[0]
  );
}

function encodeBase64(bytes: Uint8Array) {
  if (typeof globalThis.btoa !== 'function') {
    throw new Error('Base64 encoding is not available in this preview.');
  }

  let binary = '';

  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }

  return globalThis.btoa(binary);
}

function formatBooleanLabel(value: boolean | undefined) {
  if (value === true) {
    return 'Yes';
  }

  if (value === false) {
    return 'No';
  }

  return 'Not recorded';
}

function formatCurrencyLabel(value: number | undefined) {
  if (value === undefined) {
    return 'Not recorded';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value / 100);
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'item';
}
