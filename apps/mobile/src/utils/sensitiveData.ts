const REDACTED = '[redacted]';

const GENERIC_SENSITIVE_KEYS = new Set([
  'accessCode',
  'accountNumber',
  'recoveryNotes',
  'serial',
  'phone',
  'email',
  'address',
]);

export function sanitizeTelemetryContext(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeTelemetryContext(entry));
  }

  if (!isRecord(value)) {
    return value;
  }

  const sanitized = Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      GENERIC_SENSITIVE_KEYS.has(key) ? REDACTED : sanitizeTelemetryContext(entry),
    ]),
  );

  if (looksLikeAccessItem(sanitized)) {
    redactFields(sanitized, ['username', 'accessCode', 'location', 'instructions', 'notes']);
  }

  if (looksLikeEmergencyContact(sanitized)) {
    redactFields(sanitized, ['name', 'phone', 'email', 'address', 'notes']);
  }

  if (looksLikeImportantAccount(sanitized)) {
    redactFields(sanitized, ['accountNumber', 'phone', 'email', 'recoveryNotes']);
  }

  if (looksLikeAsset(sanitized)) {
    redactFields(sanitized, ['serial']);
  }

  return sanitized;
}

function redactFields(record: Record<string, unknown>, fields: string[]) {
  for (const field of fields) {
    if (field in record && record[field] != null) {
      record[field] = REDACTED;
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function looksLikeAccessItem(value: Record<string, unknown>) {
  return typeof value.category === 'string' && typeof value.label === 'string';
}

function looksLikeEmergencyContact(value: Record<string, unknown>) {
  return typeof value.role === 'string' && typeof value.priority === 'string';
}

function looksLikeImportantAccount(value: Record<string, unknown>) {
  return typeof value.providerName === 'string' && typeof value.kind === 'string';
}

function looksLikeAsset(value: Record<string, unknown>) {
  return typeof value.category === 'string' && typeof value.status === 'string';
}
