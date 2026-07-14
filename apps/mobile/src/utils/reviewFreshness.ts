import {
  isDeviceAsset,
  type AccessItem,
  type Asset,
  type EmergencyContact,
  type ImportantAccount,
} from '@homevault/domain';

export type ReviewFreshnessStatus = 'current' | 'stale' | 'missing';
export type ReviewableCriticalRecordType =
  | 'access_item'
  | 'emergency_contact'
  | 'important_account'
  | 'asset';
export type CriticalReviewArea =
  | 'access'
  | 'contacts'
  | 'insurance'
  | 'digital_safety'
  | 'devices';

export type CriticalReviewQueueItem = {
  key: string;
  recordType: ReviewableCriticalRecordType;
  recordId: string;
  area: CriticalReviewArea;
  label: string;
  subtitle: string;
  status: ReviewFreshnessStatus;
  detail: string;
  lastReviewedAt?: string;
  thresholdDays: number;
  priority: number;
};

type ReviewFreshnessSummary = {
  status: ReviewFreshnessStatus;
  label: string;
  detail: string;
  lastReviewedAt?: string;
  thresholdDays: number;
};

const REVIEW_THRESHOLD_DAYS = {
  access_item: 180,
  emergency_contact: 180,
  important_account: 120,
  asset: 180,
} satisfies Record<ReviewableCriticalRecordType, number>;

export function getReviewDateLabel(value?: string | null) {
  if (!value) {
    return 'Not reviewed';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
}

export function getReviewFreshnessSummary(
  recordType: ReviewableCriticalRecordType,
  lastReviewedAt?: string | null,
): ReviewFreshnessSummary {
  const thresholdDays = REVIEW_THRESHOLD_DAYS[recordType];

  if (!lastReviewedAt) {
    return {
      status: 'missing',
      label: 'Needs first review',
      detail: `No review has been recorded in the last ${thresholdDays} days.`,
      thresholdDays,
    };
  }

  const ageDays = getAgeInDays(lastReviewedAt);

  if (ageDays == null) {
    return {
      status: 'stale',
      label: 'Needs review',
      detail: 'The saved review date could not be read. Mark this record reviewed again.',
      lastReviewedAt,
      thresholdDays,
    };
  }

  if (ageDays > thresholdDays) {
    return {
      status: 'stale',
      label: 'Needs review',
      detail: `Last reviewed ${ageDays} days ago. Refresh this record at least every ${thresholdDays} days.`,
      lastReviewedAt,
      thresholdDays,
    };
  }

  return {
    status: 'current',
    label: 'Current',
    detail: `Reviewed ${ageDays} day${ageDays === 1 ? '' : 's'} ago.`,
    lastReviewedAt,
    thresholdDays,
  };
}

export function getAccessItemReviewDate(accessItem: AccessItem) {
  return accessItem.lastReviewedAt ?? accessItem.lastVerifiedAt;
}

export function getAccessItemReviewSummary(accessItem: AccessItem) {
  return getReviewFreshnessSummary('access_item', getAccessItemReviewDate(accessItem));
}

export function getEmergencyContactReviewSummary(contact: EmergencyContact) {
  return getReviewFreshnessSummary('emergency_contact', contact.lastReviewedAt);
}

export function getImportantAccountReviewSummary(account: ImportantAccount) {
  return getReviewFreshnessSummary('important_account', account.lastReviewedAt);
}

export function getCriticalDeviceReviewSummary(asset: Asset) {
  return getReviewFreshnessSummary('asset', asset.lastReviewedAt);
}

export function isCriticalDevice(asset: Pick<Asset, 'category' | 'name'>) {
  return isDeviceAsset(asset);
}

export function createReviewedOnDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function buildCriticalReviewQueue({
  accessItems,
  assets,
  emergencyContacts,
  importantAccounts,
}: {
  accessItems: AccessItem[];
  assets: Asset[];
  emergencyContacts: EmergencyContact[];
  importantAccounts: ImportantAccount[];
}) {
  const items: CriticalReviewQueueItem[] = [
    ...accessItems.map((accessItem) => {
      const summary = getAccessItemReviewSummary(accessItem);

      return {
        key: `access:${accessItem.id}`,
        recordType: 'access_item' as const,
        recordId: accessItem.id,
        area: 'access' as const,
        label: accessItem.label,
        subtitle: `${formatAccessCategoryLabel(accessItem.category)} access`,
        status: summary.status,
        detail: summary.detail,
        lastReviewedAt: summary.lastReviewedAt,
        thresholdDays: summary.thresholdDays,
        priority: getAccessItemPriority(accessItem, summary.status),
      };
    }),
    ...emergencyContacts.map((contact) => {
      const summary = getEmergencyContactReviewSummary(contact);

      return {
        key: `contact:${contact.id}`,
        recordType: 'emergency_contact' as const,
        recordId: contact.id,
        area: 'contacts' as const,
        label: contact.name,
        subtitle: `${formatContactPriorityLabel(contact.priority)} contact`,
        status: summary.status,
        detail: summary.detail,
        lastReviewedAt: summary.lastReviewedAt,
        thresholdDays: summary.thresholdDays,
        priority: getEmergencyContactPriority(contact, summary.status),
      };
    }),
    ...importantAccounts.map((account) => {
      const summary = getImportantAccountReviewSummary(account);
      const area: CriticalReviewArea =
        account.kind === 'insurance' ? 'insurance' : 'digital_safety';

      return {
        key: `account:${account.id}`,
        recordType: 'important_account' as const,
        recordId: account.id,
        area,
        label: account.label,
        subtitle: `${formatAccountKindLabel(account.kind)} account`,
        status: summary.status,
        detail: summary.detail,
        lastReviewedAt: summary.lastReviewedAt,
        thresholdDays: summary.thresholdDays,
        priority: getImportantAccountPriority(account, summary.status),
      };
    }),
    ...assets.filter((asset) => isCriticalDevice(asset)).map((asset) => {
      const summary = getCriticalDeviceReviewSummary(asset);

      return {
        key: `asset:${asset.id}`,
        recordType: 'asset' as const,
        recordId: asset.id,
        area: 'devices' as const,
        label: asset.name,
        subtitle: 'Critical device',
        status: summary.status,
        detail: summary.detail,
        lastReviewedAt: summary.lastReviewedAt,
        thresholdDays: summary.thresholdDays,
        priority: getCriticalDevicePriority(asset, summary.status),
      };
    }),
  ];

  return items.sort((left, right) => {
    const statusOrder = getStatusSortWeight(right.status) - getStatusSortWeight(left.status);
    if (statusOrder !== 0) {
      return statusOrder;
    }

    return right.priority - left.priority || left.label.localeCompare(right.label);
  });
}

function getAgeInDays(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const ageMs = Date.now() - parsed.getTime();

  return Math.max(0, Math.floor(ageMs / (24 * 60 * 60 * 1000)));
}

function getStatusSortWeight(status: ReviewFreshnessStatus) {
  switch (status) {
    case 'missing':
      return 2;
    case 'stale':
      return 1;
    default:
      return 0;
  }
}

function getStatusPriorityBoost(status: ReviewFreshnessStatus) {
  switch (status) {
    case 'missing':
      return 18;
    case 'stale':
      return 10;
    default:
      return 0;
  }
}

function getAccessItemPriority(
  accessItem: Pick<AccessItem, 'category'>,
  status: ReviewFreshnessStatus,
) {
  const basePriority = {
    wifi: 92,
    router: 90,
    utility_shutoff: 88,
    alarm: 86,
    lockbox: 84,
    garage: 80,
    safe: 78,
    entry_note: 72,
    other: 68,
  }[accessItem.category];

  return basePriority + getStatusPriorityBoost(status);
}

function getEmergencyContactPriority(
  contact: Pick<EmergencyContact, 'priority'>,
  status: ReviewFreshnessStatus,
) {
  const basePriority = {
    primary: 90,
    secondary: 80,
    service_provider: 74,
    other: 68,
  }[contact.priority];

  return basePriority + getStatusPriorityBoost(status);
}

function getImportantAccountPriority(
  account: Pick<ImportantAccount, 'kind'>,
  status: ReviewFreshnessStatus,
) {
  const basePriority = {
    email: 94,
    carrier: 91,
    platform: 90,
    insurance: 92,
    internet: 86,
    utility: 84,
    security: 82,
    smart_home: 81,
    banking: 80,
    government: 76,
    warranty: 68,
    other: 66,
  }[account.kind];

  return basePriority + getStatusPriorityBoost(status);
}

function getCriticalDevicePriority(
  asset: Pick<Asset, 'category' | 'name'>,
  status: ReviewFreshnessStatus,
) {
  const label = `${asset.category} ${asset.name}`.toLowerCase();
  let basePriority = 72;

  if (label.includes('router') || label.includes('network')) {
    basePriority = 90;
  } else if (label.includes('phone') || label.includes('iphone')) {
    basePriority = 88;
  } else if (
    label.includes('tablet') ||
    label.includes('ipad') ||
    label.includes('laptop') ||
    label.includes('computer')
  ) {
    basePriority = 80;
  }

  return basePriority + getStatusPriorityBoost(status);
}

function formatAccessCategoryLabel(category: AccessItem['category']) {
  switch (category) {
    case 'wifi':
      return 'Wi-Fi';
    case 'router':
      return 'Router';
    case 'utility_shutoff':
      return 'Utility shutoff';
    case 'entry_note':
      return 'Entry note';
    case 'lockbox':
      return 'Lockbox';
    default:
      return category.replaceAll('_', ' ');
  }
}

function formatContactPriorityLabel(priority: EmergencyContact['priority']) {
  switch (priority) {
    case 'primary':
      return 'Primary';
    case 'secondary':
      return 'Backup';
    case 'service_provider':
      return 'Service provider';
    default:
      return 'Household';
  }
}

function formatAccountKindLabel(kind: ImportantAccount['kind']) {
  switch (kind) {
    case 'email':
      return 'Email';
    case 'carrier':
      return 'Carrier';
    case 'platform':
      return 'Apple / Google';
    case 'internet':
      return 'Internet';
    case 'utility':
      return 'Utility';
    case 'smart_home':
      return 'Smart home';
    default:
      return kind.charAt(0).toUpperCase() + kind.slice(1);
  }
}
