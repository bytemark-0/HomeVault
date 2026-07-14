import type { HomeVaultExportPackage } from '@homevault/export';
import type { AccessItem, ImportantAccount } from '@homevault/domain';

import { getSensitiveAccessFields } from './accessSensitivity';

export type SensitivityLevel = 'low' | 'medium' | 'high';

export type SensitivitySummary = {
  detail: string;
  level: SensitivityLevel;
  label: string;
};

export function getAccessItemSensitivity(accessItem: AccessItem): SensitivitySummary {
  const fields = getSensitiveAccessFields(accessItem);

  if (fields.length === 0) {
    return {
      detail: 'No sensitive details are stored in this record.',
      label: 'Low sensitivity',
      level: 'low',
    };
  }

  const level =
    accessItem.accessCode?.trim() ||
    accessItem.category === 'wifi' ||
    accessItem.category === 'lockbox' ||
    accessItem.category === 'garage' ||
    accessItem.category === 'safe'
      ? 'high'
      : 'medium';

  return {
    detail:
      level === 'high'
        ? 'Codes, entry details, or network access in this record should require step-up protection before reveal or share.'
        : 'Support details in this record should be reviewed before sharing outside the household.',
    label: formatSensitivityLabel(level),
    level,
  };
}

export function getImportantAccountSensitivity(account: ImportantAccount): SensitivitySummary {
  const hasRecoveryNotes = Boolean(account.recoveryNotes?.trim());
  const hasSupportMetadata = Boolean(
    account.accountNumber?.trim() ||
      account.phone?.trim() ||
      account.email?.trim() ||
      account.website?.trim() ||
      account.notes?.trim(),
  );

  if (hasRecoveryNotes) {
    return {
      detail: 'Recovery notes can help someone regain access quickly and should be protected like a high-risk handoff detail.',
      label: 'High sensitivity',
      level: 'high',
    };
  }

  if (hasSupportMetadata || account.kind === 'insurance') {
    return {
      detail: 'Provider and support details are useful in an incident, but they should still be reviewed before sharing broadly.',
      label: 'Medium sensitivity',
      level: 'medium',
    };
  }

  return {
    detail: 'This record mostly tracks readiness status and does not currently include high-risk recovery notes.',
    label: 'Low sensitivity',
    level: 'low',
  };
}

export function getExportSensitivity(
  target: 'backup' | 'packet' | 'trusted-share' | 'offline-pack',
  sensitiveData: HomeVaultExportPackage['manifest']['sensitiveData'],
): SensitivitySummary {
  if (target === 'packet') {
    return {
      detail: 'Emergency packets can reveal codes, contacts, and recovery notes in full so someone can act under stress.',
      label: 'High sensitivity',
      level: 'high',
    };
  }

  if (target === 'trusted-share') {
    return {
      detail: 'Trusted-share handoffs are static documents that may expose codes, contacts, and recovery notes to the chosen recipient.',
      label: 'High sensitivity',
      level: 'high',
    };
  }

  if (target === 'offline-pack') {
    return {
      detail: 'Offline companion packs are static local copies that can expose emergency contacts, codes, and recovery guidance if the device is lost.',
      label: 'High sensitivity',
      level: 'high',
    };
  }

  return sensitiveData.includesSensitiveData
    ? {
        detail: 'This backup includes sensitive household details and should be shared or stored with the same care as a full export archive.',
        label: 'High sensitivity',
        level: 'high',
      }
    : {
        detail: 'This backup does not currently include flagged household secrets, but it still represents a full local archive.',
        label: 'Medium sensitivity',
        level: 'medium',
      };
}

export function formatSensitivityLabel(level: SensitivityLevel) {
  switch (level) {
    case 'high':
      return 'High sensitivity';
    case 'medium':
      return 'Medium sensitivity';
    case 'low':
    default:
      return 'Low sensitivity';
  }
}
