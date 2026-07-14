import {
  isDeviceAsset,
  isRouterAsset,
  type Asset,
  type EmergencyContact,
  type ImportantAccount,
} from '@homevault/domain';

import { formatImportantAccountManagerRole } from './digitalSafety';

const SCHOOL_CONTACT_KEYWORDS = ['school', 'teacher', 'daycare', 'pickup', 'nurse', 'attendance', 'camp'];
const PET_CONTACT_KEYWORDS = ['pet', 'vet', 'veterinarian', 'dog', 'cat', 'walker', 'boarding', 'groomer'];
const HOME_SERVICE_KEYWORDS = ['plumber', 'electrician', 'hvac', 'handyman', 'locksmith', 'roofer', 'service'];

export type HomeVaultOwnershipResponsibilityKey =
  | 'insurance'
  | 'utilities'
  | 'devices'
  | 'school_contacts'
  | 'pets'
  | 'home_services';

export type HomeVaultOwnershipResponsibilityStatus =
  | 'ready'
  | 'needs_attention'
  | 'missing'
  | 'not_applicable';

export type HomeVaultOwnershipResponsibility = {
  detail: string;
  handoffPrompt: string;
  isRequired: boolean;
  key: HomeVaultOwnershipResponsibilityKey;
  linkedRecordIds: string[];
  ownerLabel: string | null;
  backupLabel: string | null;
  status: HomeVaultOwnershipResponsibilityStatus;
  title: string;
};

export type HomeVaultOwnershipSummary = {
  backupGapCount: number;
  detail: string;
  ownerGapCount: number;
  readyCount: number;
  status: 'ready' | 'needs_attention' | 'missing';
  total: number;
};

export function buildOwnershipResponsibilities({
  assets,
  emergencyContacts,
  importantAccounts,
}: {
  assets: Asset[];
  emergencyContacts: EmergencyContact[];
  importantAccounts: ImportantAccount[];
}): HomeVaultOwnershipResponsibility[] {
  const householdOwnerLabel = deriveHouseholdOwnerLabel(importantAccounts);
  const householdBackupContact = pickHouseholdBackupContact(emergencyContacts);
  const insuranceAccounts = importantAccounts.filter((account) => account.kind === 'insurance');
  const utilityAccounts = importantAccounts.filter((account) =>
    account.kind === 'utility' ||
    account.kind === 'internet' ||
    account.kind === 'smart_home' ||
    account.kind === 'security',
  );
  const criticalDevices = assets.filter((asset) => isDeviceAsset(asset) || isRouterAsset(asset));
  const schoolContacts = emergencyContacts.filter(
    (contact) =>
      contact.responsibilityCategory === 'school' ||
      matchesAnyKeyword(contact, SCHOOL_CONTACT_KEYWORDS),
  );
  const petContacts = emergencyContacts.filter(
    (contact) =>
      contact.responsibilityCategory === 'pet' ||
      matchesAnyKeyword(contact, PET_CONTACT_KEYWORDS),
  );
  const homeServiceContacts = emergencyContacts.filter(
    (contact) =>
      contact.responsibilityCategory === 'home_service' ||
      contact.priority === 'service_provider' ||
      matchesAnyKeyword(contact, HOME_SERVICE_KEYWORDS),
  );

  return [
    buildAccountResponsibility({
      accounts: insuranceAccounts,
      backupContact: householdBackupContact,
      fallbackOwnerLabel: householdOwnerLabel,
      handoffPrompt: 'Claims, policy questions, and insurer callbacks',
      key: 'insurance',
      missingDetail: 'No insurance account is mapped yet.',
      title: 'Insurance claims',
    }),
    buildAccountResponsibility({
      accounts: utilityAccounts,
      backupContact: householdBackupContact,
      fallbackOwnerLabel: householdOwnerLabel,
      handoffPrompt: 'Outages, shutoff warnings, alarms, and utility billing confusion',
      key: 'utilities',
      missingDetail: 'No utility, internet, or smart-home account is mapped yet.',
      title: 'Utilities and home systems',
    }),
    buildDeviceResponsibility({
      assets: criticalDevices,
      backupContact: householdBackupContact,
      fallbackOwnerLabel:
        deriveManagerRoleLabel(
          importantAccounts.find(
            (account) => account.kind === 'platform' || account.kind === 'carrier',
          ),
        ) ?? householdOwnerLabel,
    }),
    buildContactResponsibility({
      backupContact: householdBackupContact,
      contacts: schoolContacts,
      fallbackOwnerLabel: deriveManagerRoleLabel(
        importantAccounts.find((account) => account.kind === 'email'),
      ) ?? householdOwnerLabel,
      handoffPrompt: 'Pickup changes, school nurse calls, and attendance escalations',
      key: 'school_contacts',
      notApplicableDetail:
        'No school or daycare dependency is mapped right now. Add this when your household relies on pickup or attendance contacts.',
      title: 'School and daycare',
    }),
    buildContactResponsibility({
      backupContact: householdBackupContact,
      contacts: petContacts,
      fallbackOwnerLabel: householdOwnerLabel,
      handoffPrompt: 'Pet pickup, medication, boarding, and emergency vet decisions',
      key: 'pets',
      notApplicableDetail:
        'No pet-care responsibility is mapped right now. Add this when the household depends on a sitter, walker, or vet path.',
      title: 'Pet care',
    }),
    buildContactResponsibility({
      backupContact: homeServiceContacts[0] ?? householdBackupContact,
      contacts: homeServiceContacts,
      fallbackOwnerLabel:
        deriveManagerRoleLabel(utilityAccounts[0]) ?? householdOwnerLabel,
      handoffPrompt: 'Plumbers, locksmiths, HVAC, and other urgent home-service calls',
      key: 'home_services',
      notApplicableDetail:
        'No urgent home-service path is mapped right now. Add at least one provider when the household depends on outside help.',
      title: 'Home services',
    }),
  ];
}

export function buildOwnershipSummary(
  responsibilities: HomeVaultOwnershipResponsibility[],
): HomeVaultOwnershipSummary {
  const applicable = responsibilities.filter((item) => item.status !== 'not_applicable');
  const readyCount = applicable.filter((item) => item.status === 'ready').length;
  const ownerGapCount = applicable.filter((item) => item.ownerLabel == null).length;
  const backupGapCount = applicable.filter((item) => item.backupLabel == null).length;
  const total = applicable.length;

  if (total === 0) {
    return {
      backupGapCount: 0,
      detail:
        'Map who handles claims, outages, devices, and helper tasks so a handoff still works when the main organizer is unavailable.',
      ownerGapCount: 0,
      readyCount: 0,
      status: 'missing',
      total: 0,
    };
  }

  if (readyCount === total) {
    return {
      backupGapCount,
      detail: 'Every mapped responsibility has both an owner and a backup path.',
      ownerGapCount,
      readyCount,
      status: 'ready',
      total,
    };
  }

  return {
    backupGapCount,
    detail: `${ownerGapCount} owner gap${ownerGapCount === 1 ? '' : 's'} and ${backupGapCount} backup gap${
      backupGapCount === 1 ? '' : 's'
    } could slow a real handoff.`,
    ownerGapCount,
    readyCount,
    status: ownerGapCount + backupGapCount >= 3 ? 'missing' : 'needs_attention',
    total,
  };
}

export function formatOwnershipResponsibilityStatus(
  status: HomeVaultOwnershipResponsibilityStatus,
) {
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'needs_attention':
      return 'Needs review';
    case 'missing':
      return 'Missing';
    case 'not_applicable':
    default:
      return 'Optional';
  }
}

export function formatOwnershipHandoffSummary({
  propertyLabel,
  responsibilities,
}: {
  propertyLabel: string;
  responsibilities: HomeVaultOwnershipResponsibility[];
}) {
  const summary = buildOwnershipSummary(responsibilities);
  const applicable = responsibilities.filter((item) => item.status !== 'not_applicable');

  return [
    'HomeVault Responsibility Handoff',
    `Property   : ${propertyLabel}`,
    `Generated  : ${new Date().toISOString()}`,
    `Coverage   : ${summary.readyCount} of ${summary.total} responsibilities ready`,
    `Owner gaps : ${summary.ownerGapCount}`,
    `Backup gaps: ${summary.backupGapCount}`,
    '',
    ...applicable.flatMap((item) => [
      item.title,
      `Status     : ${formatOwnershipResponsibilityStatus(item.status)}`,
      `Owner      : ${item.ownerLabel ?? 'Not assigned'}`,
      `Backup     : ${item.backupLabel ?? 'Not assigned'}`,
      `Use this for: ${item.handoffPrompt}`,
      `Notes      : ${item.detail}`,
      '',
    ]),
  ].join('\n').trim();
}

function buildAccountResponsibility({
  accounts,
  backupContact,
  fallbackOwnerLabel,
  handoffPrompt,
  key,
  missingDetail,
  title,
}: {
  accounts: ImportantAccount[];
  backupContact: EmergencyContact | null;
  fallbackOwnerLabel: string | null;
  handoffPrompt: string;
  key: 'insurance' | 'utilities';
  missingDetail: string;
  title: string;
}): HomeVaultOwnershipResponsibility {
  const ownerLabel = deriveManagerRoleLabel(accounts[0]) ?? fallbackOwnerLabel;
  const backupLabel = deriveAccountBackupLabel(accounts, backupContact);
  const linkedRecordIds = accounts.map((account) => account.id);

  if (accounts.length === 0) {
    return {
      detail: missingDetail,
      handoffPrompt,
      isRequired: true,
      key,
      linkedRecordIds,
      ownerLabel: null,
      backupLabel: null,
      status: 'missing',
      title,
    };
  }

  return {
    detail: buildCoverageDetail({
      ownerLabel,
      backupLabel,
      readyDetail: `${accounts[0].label} has a clear owner and fallback path.`,
      missingOwnerDetail: `Clarify who manages ${accounts[0].label} so someone knows whose approval or login path to use first.`,
      missingBackupDetail: `Add a backup helper who can step in for ${accounts[0].label} if the main organizer is unavailable.`,
    }),
    handoffPrompt,
    isRequired: true,
    key,
    linkedRecordIds,
    ownerLabel,
    backupLabel,
    status: buildCoverageStatus(ownerLabel, backupLabel),
    title,
  };
}

function buildDeviceResponsibility({
  assets,
  backupContact,
  fallbackOwnerLabel,
}: {
  assets: Asset[];
  backupContact: EmergencyContact | null;
  fallbackOwnerLabel: string | null;
}): HomeVaultOwnershipResponsibility {
  const ownerLabel = deriveDeviceOwnerLabel(assets) ?? fallbackOwnerLabel;
  const backupLabel = deriveDeviceBackupLabel(assets) ?? (backupContact ? formatContactLabel(backupContact) : null);
  const linkedRecordIds = assets.map((asset) => asset.id);

  if (assets.length === 0) {
    return {
      detail: 'No critical phone, router, or other recovery device is mapped yet.',
      handoffPrompt: 'Stolen-device recovery, router restarts, and device restore decisions',
      isRequired: true,
      key: 'devices',
      linkedRecordIds,
      ownerLabel: null,
      backupLabel: null,
      status: 'missing',
      title: 'Critical devices',
    };
  }

  return {
    detail: buildCoverageDetail({
      ownerLabel,
      backupLabel,
      readyDetail: `${assets[0].name} and the household recovery devices have a clear owner and backup helper.`,
      missingOwnerDetail: `Clarify who owns the main phone, router, or restore device path before a lockout or outage.`,
      missingBackupDetail: 'Add a backup helper who can restart, locate, or replace the critical device path.',
    }),
    handoffPrompt: 'Stolen-device recovery, router restarts, and device restore decisions',
    isRequired: true,
    key: 'devices',
    linkedRecordIds,
    ownerLabel,
    backupLabel,
    status: buildCoverageStatus(ownerLabel, backupLabel),
    title: 'Critical devices',
  };
}

function buildContactResponsibility({
  backupContact,
  contacts,
  fallbackOwnerLabel,
  handoffPrompt,
  key,
  notApplicableDetail,
  title,
}: {
  backupContact: EmergencyContact | null;
  contacts: EmergencyContact[];
  fallbackOwnerLabel: string | null;
  handoffPrompt: string;
  key: 'school_contacts' | 'pets' | 'home_services';
  notApplicableDetail: string;
  title: string;
}): HomeVaultOwnershipResponsibility {
  if (contacts.length === 0) {
    return {
      detail: notApplicableDetail,
      handoffPrompt,
      isRequired: false,
      key,
      linkedRecordIds: [],
      ownerLabel: null,
      backupLabel: null,
      status: 'not_applicable',
      title,
    };
  }

  const ownerLabel = deriveContactOwnerLabel(contacts) ?? fallbackOwnerLabel;
  const backupLabel = deriveContactBackupLabel(contacts) ?? (backupContact ? formatContactLabel(backupContact) : null);
  const linkedRecordIds = contacts.map((contact) => contact.id);

  return {
    detail: buildCoverageDetail({
      ownerLabel,
      backupLabel,
      readyDetail: `${title} has a mapped owner and fallback path.`,
      missingOwnerDetail: `Clarify who should take the lead for ${title.toLowerCase()} before someone has to improvise.`,
      missingBackupDetail: `Add a backup helper or provider for ${title.toLowerCase()} in case the main organizer cannot respond.`,
    }),
    handoffPrompt,
    isRequired: false,
    key,
    linkedRecordIds,
    ownerLabel,
    backupLabel,
    status: buildCoverageStatus(ownerLabel, backupLabel),
    title,
  };
}

function buildCoverageStatus(ownerLabel: string | null, backupLabel: string | null) {
  if (!ownerLabel && !backupLabel) {
    return 'missing' as const;
  }

  if (!ownerLabel || !backupLabel) {
    return 'needs_attention' as const;
  }

  return 'ready' as const;
}

function buildCoverageDetail({
  ownerLabel,
  backupLabel,
  readyDetail,
  missingOwnerDetail,
  missingBackupDetail,
}: {
  ownerLabel: string | null;
  backupLabel: string | null;
  readyDetail: string;
  missingOwnerDetail: string;
  missingBackupDetail: string;
}) {
  if (!ownerLabel) {
    return missingOwnerDetail;
  }

  if (!backupLabel) {
    return missingBackupDetail;
  }

  return readyDetail;
}

function deriveDeviceOwnerLabel(assets: Asset[]) {
  const ownerNames = Array.from(
    new Set(
      assets
        .map((asset) => asset.ownerName?.trim())
        .filter((ownerName): ownerName is string => Boolean(ownerName)),
    ),
  );

  if (ownerNames.length === 0) {
    return null;
  }

  if (ownerNames.length === 1) {
    return ownerNames[0];
  }

  return 'Multiple household owners';
}

function deriveDeviceBackupLabel(assets: Asset[]) {
  const backupNames = Array.from(
    new Set(
      assets
        .map((asset) => asset.backupHelperName?.trim())
        .filter((backupName): backupName is string => Boolean(backupName)),
    ),
  );

  if (backupNames.length === 0) {
    return null;
  }

  if (backupNames.length === 1) {
    return backupNames[0];
  }

  return 'Multiple backup helpers';
}

function deriveHouseholdOwnerLabel(importantAccounts: ImportantAccount[]) {
  const roles = Array.from(
    new Set(
      importantAccounts
        .map((account) => account.managerRole)
        .filter((role): role is NonNullable<ImportantAccount['managerRole']> => Boolean(role)),
    ),
  );

  if (roles.includes('shared_household')) {
    return formatImportantAccountManagerRole('shared_household');
  }

  if (roles.includes('self') && roles.includes('partner')) {
    return 'You and partner';
  }

  if (roles.length > 0) {
    return formatImportantAccountManagerRole(roles[0]);
  }

  return null;
}

function deriveManagerRoleLabel(account?: ImportantAccount) {
  if (!account?.managerRole) {
    return null;
  }

  return formatImportantAccountManagerRole(account.managerRole);
}

function deriveAccountBackupLabel(
  accounts: ImportantAccount[],
  backupContact: EmergencyContact | null,
) {
  const explicitBackupName = accounts.find((account) => account.backupHelperName?.trim())?.backupHelperName?.trim();

  if (explicitBackupName) {
    return explicitBackupName;
  }

  if (
    accounts.some(
      (account) =>
        account.managerRole === 'shared_household' || account.isSharedHouseholdAccount === true,
    )
  ) {
    return 'Shared household access';
  }

  if (!backupContact) {
    return null;
  }

  return formatContactLabel(backupContact);
}

function deriveContactOwnerLabel(contacts: EmergencyContact[]) {
  const roles = Array.from(
    new Set(
      contacts
        .map((contact) => contact.ownerRole)
        .filter((role): role is NonNullable<EmergencyContact['ownerRole']> => Boolean(role)),
    ),
  );

  if (roles.length === 0) {
    return null;
  }

  if (roles.includes('shared_household')) {
    return formatImportantAccountManagerRole('shared_household');
  }

  if (roles.includes('self') && roles.includes('partner')) {
    return 'You and partner';
  }

  return formatImportantAccountManagerRole(roles[0]);
}

function deriveContactBackupLabel(contacts: EmergencyContact[]) {
  const backupNames = Array.from(
    new Set(
      contacts
        .map((contact) => contact.backupHelperName?.trim())
        .filter((backupName): backupName is string => Boolean(backupName)),
    ),
  );

  if (backupNames.length === 0) {
    return null;
  }

  if (backupNames.length === 1) {
    return backupNames[0];
  }

  return 'Multiple backup helpers';
}

function pickHouseholdBackupContact(contacts: EmergencyContact[]) {
  return (
    contacts.find((contact) => contact.priority === 'secondary') ??
    contacts.find((contact) => contact.priority === 'primary') ??
    contacts.find((contact) => contact.priority === 'other') ??
    null
  );
}

function formatContactLabel(contact: EmergencyContact) {
  return `${contact.name} (${contact.role})`;
}

function matchesAnyKeyword(contact: EmergencyContact, keywords: string[]) {
  const label = `${contact.name} ${contact.role} ${contact.notes ?? ''}`.toLowerCase();
  return keywords.some((keyword) => label.includes(keyword));
}
