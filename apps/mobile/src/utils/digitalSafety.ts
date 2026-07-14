import type { Asset, ContinuityPlaybook, ImportantAccount, Property } from '@homevault/domain';

import { getImportantAccountReviewSummary } from './reviewFreshness';

const PRIMARY_DEVICE_KEYWORDS = ['phone', 'iphone', 'ipad', 'tablet', 'laptop', 'computer'];
const PHONE_KEYWORDS = ['phone', 'iphone'];

const PRIMARY_RECOVERY_ACCOUNT_SLOTS = [
  {
    key: 'primary_email',
    kind: 'email',
    title: 'Primary email',
    detail: 'The inbox that receives password resets and household alerts.',
  },
  {
    key: 'carrier',
    kind: 'carrier',
    title: 'Mobile carrier',
    detail: 'The phone provider that can restore SIM access or block takeover.',
  },
  {
    key: 'platform',
    kind: 'platform',
    title: 'Apple or Google',
    detail: 'The platform account behind app installs, backups, and find-my-device.',
  },
  {
    key: 'utility',
    kind: 'utility',
    title: 'Utility provider',
    detail: 'The account someone may need during shutoffs, outages, or billing confusion.',
  },
  {
    key: 'smart_home',
    kind: 'smart_home',
    title: 'Smart-home or alarm',
    detail: 'The login controlling entry, cameras, alarm monitoring, or connected home gear.',
  },
] as const;

export type DigitalSafetyChecklistItem = {
  key:
    | 'mfa'
    | 'recovery_codes'
    | 'password_manager'
    | 'device_backups'
    | 'phone_lock'
    | 'find_my_device';
  title: string;
  detail: string;
  helper: string;
  status: 'ready' | 'needs_attention' | 'not_started';
  routeTarget: 'accounts' | 'devices';
  linkedRecordIds: string[];
  supportingLabels: string[];
};

export type PrimaryRecoveryAccountCoverageItem = {
  key: (typeof PRIMARY_RECOVERY_ACCOUNT_SLOTS)[number]['key'];
  title: string;
  detail: string;
  status: 'ready' | 'needs_attention' | 'missing';
  account?: ImportantAccount;
};

export function buildDigitalSafetyChecklist(
  importantAccounts: ImportantAccount[],
  assets: Asset[],
): DigitalSafetyChecklistItem[] {
  const primaryDevices = assets.filter(isPrimaryDevice);
  const phoneDevices = assets.filter(isPhoneDevice);

  return [
    buildAccountChecklistItem({
      key: 'mfa',
      title: 'Turn on multi-factor authentication',
      detail: 'Important accounts should use MFA whenever the provider offers it.',
      helper: 'Track whether each account has MFA enabled, not the codes themselves.',
      importantAccounts,
      field: 'mfaEnabled',
    }),
    buildAccountChecklistItem({
      key: 'recovery_codes',
      title: 'Store recovery codes somewhere trusted',
      detail: 'Keep recovery codes outside HomeVault so you can regain access during lockouts.',
      helper: 'Record where the codes live in recovery notes, but never paste the codes here.',
      importantAccounts,
      field: 'recoveryCodesStored',
    }),
    buildAccountChecklistItem({
      key: 'password_manager',
      title: 'Use a password manager',
      detail:
        'Important accounts are easier to recover when they are already in a trusted password manager.',
      helper: 'HomeVault tracks readiness only. It does not store, autofill, or reveal passwords.',
      importantAccounts,
      field: 'managedInPasswordManager',
    }),
    buildDeviceChecklistItem({
      key: 'device_backups',
      title: 'Back up primary devices',
      detail: 'Phones, tablets, and laptops should have backup turned on before something breaks.',
      helper: 'Check the backup status on the devices you rely on most.',
      assets: primaryDevices,
      field: 'backupEnabled',
    }),
    buildDeviceChecklistItem({
      key: 'phone_lock',
      title: 'Protect your phone with a screen lock',
      detail: 'A screen lock protects access to email, banking, and recovery messages.',
      helper: 'Review the main household phone first.',
      assets: phoneDevices,
      field: 'screenLockEnabled',
    }),
    buildDeviceChecklistItem({
      key: 'find_my_device',
      title: 'Enable find-my-device',
      detail:
        'Lost-device recovery is much easier when location and remote-lock tools are already on.',
      helper: 'Check the main phone, tablet, and laptop records.',
      assets: primaryDevices,
      field: 'findMyDeviceEnabled',
    }),
  ];
}

export function buildPrimaryRecoveryAccountCoverage(
  importantAccounts: ImportantAccount[],
): PrimaryRecoveryAccountCoverageItem[] {
  return PRIMARY_RECOVERY_ACCOUNT_SLOTS.map((slot) => {
    const account = importantAccounts.find((candidate) =>
      slot.key === 'smart_home'
        ? candidate.kind === 'smart_home' || candidate.kind === 'security'
        : candidate.kind === slot.kind,
    );

    if (!account) {
      return {
        key: slot.key,
        title: slot.title,
        detail: `No ${slot.title.toLowerCase()} account is saved yet.`,
        status: 'missing' as const,
      };
    }

    const reviewSummary = getImportantAccountReviewSummary(account);

    if (!hasRecoveryContactCoverage(account)) {
      return {
        key: slot.key,
        title: slot.title,
        detail: `Add a phone number, email, or recovery note so someone knows how to recover ${account.label}.`,
        status: 'needs_attention' as const,
        account,
      };
    }

    if (!account.managerRole) {
      return {
        key: slot.key,
        title: slot.title,
        detail: `Clarify who manages ${account.label} so a helper knows whether to call you, a partner, or a provider.`,
        status: 'needs_attention' as const,
        account,
      };
    }

    if (account.isSharedHouseholdAccount && reviewSummary.status !== 'current') {
      return {
        key: slot.key,
        title: slot.title,
        detail: `Shared household access for ${account.label} should be reviewed again to catch family-account drift.`,
        status: 'needs_attention' as const,
        account,
      };
    }

    if (reviewSummary.status !== 'current') {
      return {
        key: slot.key,
        title: slot.title,
        detail: `Recovery phone, email, or notes for ${account.label} may be stale until the account is reviewed again.`,
        status: 'needs_attention' as const,
        account,
      };
    }

    return {
      key: slot.key,
      title: slot.title,
      detail: `${account.label} is tracked with owner and recovery support details.`,
      status: 'ready' as const,
      account,
    };
  });
}

export function buildDigitalSafetyPlaybook(
  property: Property,
  importantAccounts: ImportantAccount[],
  assets: Asset[],
): ContinuityPlaybook {
  const checklist = buildDigitalSafetyChecklist(importantAccounts, assets);
  const completedCount = checklist.filter((item) => item.status === 'ready').length;

  return {
    id: 'playbook-digital-safety',
    propertyId: property.id,
    category: 'digital_safety',
    title: 'Digital safety readiness',
    state:
      completedCount === checklist.length
        ? 'ready'
        : completedCount > 0
          ? 'in_progress'
          : 'not_started',
    notes:
      'HomeVault tracks whether recovery protections are in place, but it never stores passwords or one-time codes.',
    steps: checklist.map((item) => ({
      id: `playbook-step-${item.key}`,
      label: item.title,
      notes: item.helper,
      isRequired: true,
      isComplete: item.status === 'ready',
    })),
    linkedRecordIds: Array.from(new Set(checklist.flatMap((item) => item.linkedRecordIds))),
  };
}

export function formatImportantAccountKind(kind: ImportantAccount['kind']) {
  switch (kind) {
    case 'insurance':
      return 'Insurance';
    case 'utility':
      return 'Utility';
    case 'internet':
      return 'Internet';
    case 'email':
      return 'Email';
    case 'carrier':
      return 'Carrier';
    case 'platform':
      return 'Apple / Google';
    case 'security':
      return 'Security';
    case 'smart_home':
      return 'Smart home';
    case 'banking':
      return 'Banking';
    case 'government':
      return 'Government';
    case 'warranty':
      return 'Warranty';
    case 'other':
    default:
      return 'Account';
  }
}

export function formatImportantAccountManagerRole(role?: ImportantAccount['managerRole']) {
  switch (role) {
    case 'self':
      return 'You';
    case 'partner':
      return 'Partner or spouse';
    case 'shared_household':
      return 'Shared household';
    case 'helper':
      return 'Trusted helper';
    case 'service_provider':
      return 'Service provider';
    case 'other':
      return 'Other';
    default:
      return 'Not assigned';
  }
}

export function getImportantAccountRecoverySummary(account: ImportantAccount) {
  const labels = [
    account.mfaEnabled === true ? 'MFA on' : null,
    account.recoveryCodesStored === true ? 'Codes stored' : null,
    account.managedInPasswordManager === true ? 'In password manager' : null,
    account.managerRole ? `Managed by ${formatImportantAccountManagerRole(account.managerRole)}` : null,
    account.isSharedHouseholdAccount ? 'Shared household account' : null,
  ].filter(Boolean);

  if (labels.length > 0) {
    return labels.join(' · ');
  }

  if (
    account.mfaEnabled === false ||
    account.recoveryCodesStored === false ||
    account.managedInPasswordManager === false
  ) {
    return 'Needs digital safety review';
  }

  return 'Readiness not reviewed';
}

function buildAccountChecklistItem({
  key,
  title,
  detail,
  helper,
  importantAccounts,
  field,
}: {
  key: DigitalSafetyChecklistItem['key'];
  title: string;
  detail: string;
  helper: string;
  importantAccounts: ImportantAccount[];
  field: 'mfaEnabled' | 'recoveryCodesStored' | 'managedInPasswordManager';
}): DigitalSafetyChecklistItem {
  return {
    key,
    title,
    detail,
    helper,
    routeTarget: 'accounts',
    ...summarizeAccountStatus(importantAccounts, field),
  };
}

function buildDeviceChecklistItem({
  key,
  title,
  detail,
  helper,
  assets,
  field,
}: {
  key: DigitalSafetyChecklistItem['key'];
  title: string;
  detail: string;
  helper: string;
  assets: Asset[];
  field: 'backupEnabled' | 'screenLockEnabled' | 'findMyDeviceEnabled';
}): DigitalSafetyChecklistItem {
  return {
    key,
    title,
    detail,
    helper,
    routeTarget: 'devices',
    ...summarizeDeviceStatus(assets, field),
  };
}

function summarizeAccountStatus(
  importantAccounts: ImportantAccount[],
  field: 'mfaEnabled' | 'recoveryCodesStored' | 'managedInPasswordManager',
) {
  if (importantAccounts.length === 0) {
    return {
      status: 'not_started' as const,
      linkedRecordIds: [],
      supportingLabels: [],
    };
  }

  const enabled = importantAccounts.filter((account) => account[field] === true);

  return {
    status:
      enabled.length === importantAccounts.length
        ? ('ready' as const)
        : enabled.length > 0 || importantAccounts.some((account) => account[field] === false)
          ? ('needs_attention' as const)
          : ('not_started' as const),
    linkedRecordIds: importantAccounts.map((account) => account.id),
    supportingLabels: importantAccounts.map((account) => account.label),
  };
}

function summarizeDeviceStatus(
  assets: Asset[],
  field: 'backupEnabled' | 'screenLockEnabled' | 'findMyDeviceEnabled',
) {
  if (assets.length === 0) {
    return {
      status: 'not_started' as const,
      linkedRecordIds: [],
      supportingLabels: [],
    };
  }

  const enabled = assets.filter((asset) => asset[field] === true);

  return {
    status:
      enabled.length === assets.length
        ? ('ready' as const)
        : enabled.length > 0 || assets.some((asset) => asset[field] === false)
          ? ('needs_attention' as const)
          : ('not_started' as const),
    linkedRecordIds: assets.map((asset) => asset.id),
    supportingLabels: assets.map((asset) => asset.name),
  };
}

function hasRecoveryContactCoverage(account: ImportantAccount) {
  return Boolean(account.phone) || Boolean(account.email) || Boolean(account.recoveryNotes);
}

function isPrimaryDevice(asset: Asset) {
  const label = `${asset.category} ${asset.name}`.toLowerCase();
  return PRIMARY_DEVICE_KEYWORDS.some((keyword) => label.includes(keyword));
}

function isPhoneDevice(asset: Asset) {
  const label = `${asset.category} ${asset.name}`.toLowerCase();
  return PHONE_KEYWORDS.some((keyword) => label.includes(keyword));
}
