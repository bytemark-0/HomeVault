import type { AccessItem } from '@homevault/domain';

const HIDDEN_VALUE = 'Hidden until revealed';
const HIDDEN_PREVIEW = 'Sensitive details hidden until opened';

export const SENSITIVE_ACCESS_FIELDS = [
  'username',
  'accessCode',
  'location',
  'instructions',
  'notes',
] as const;

type SensitiveAccessField = (typeof SENSITIVE_ACCESS_FIELDS)[number];

export function hasSensitiveAccessValue(
  accessItem: AccessItem,
  field: SensitiveAccessField,
) {
  return typeof accessItem[field] === 'string' && accessItem[field]!.trim().length > 0;
}

export function getSensitiveAccessFields(accessItem: AccessItem) {
  return SENSITIVE_ACCESS_FIELDS.filter((field) => hasSensitiveAccessValue(accessItem, field));
}

export function hasSensitiveAccessDetails(accessItem: AccessItem) {
  return getSensitiveAccessFields(accessItem).length > 0;
}

export function getAccessPreviewDisclosure(accessItem: AccessItem) {
  const fields = getSensitiveAccessFields(accessItem);

  if (fields.length === 0) {
    return null;
  }

  return {
    summary: HIDDEN_PREVIEW,
    detail: `Includes ${fields.map(formatSensitiveFieldLabel).join(', ')}`,
  };
}

export function formatAccessFieldValue(value: string | undefined, isRevealed: boolean) {
  if (!value || value.trim().length === 0) {
    return 'Not recorded';
  }

  return isRevealed ? value : HIDDEN_VALUE;
}

export function formatSensitiveFieldLabel(field: SensitiveAccessField) {
  switch (field) {
    case 'username':
      return 'login';
    case 'accessCode':
      return 'code';
    case 'location':
      return 'location';
    case 'instructions':
      return 'instructions';
    case 'notes':
      return 'notes';
    default:
      return field;
  }
}

export function getAccessVisibilityGuidance(accessItem: AccessItem) {
  const fields = getSensitiveAccessFields(accessItem);

  if (fields.length === 0) {
    return 'No sensitive access details are stored in this record.';
  }

  return `${fields
    .map(formatSensitiveFieldLabel)
    .join(', ')} stay hidden until you reveal them on this screen.`;
}
