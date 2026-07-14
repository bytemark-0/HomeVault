import assert from 'node:assert/strict';

import { sanitizeTelemetryContext } from '../apps/mobile/src/utils/sensitiveData';

test('redacts access items, emergency contacts, important accounts, and asset serials', () => {
  const sanitized = sanitizeTelemetryContext({
    accessItem: {
      category: 'wifi',
      label: 'Main Wi-Fi',
      accessCode: '9274',
      instructions: 'Printed on the router',
    },
    emergencyContact: {
      name: 'Jamie Lee',
      role: 'Neighbor',
      priority: 'primary',
      phone: '555-0101',
      email: 'jamie@example.com',
    },
    importantAccount: {
      kind: 'insurance',
      providerName: 'Prairie Mutual',
      accountNumber: 'POL-1234',
      recoveryNotes: 'Claim docs are in the safe.',
    },
    asset: {
      category: 'Network',
      status: 'ready',
      serial: 'SN-7788',
    },
  }) as Record<string, Record<string, unknown>>;

  assert.equal(sanitized.accessItem?.accessCode, '[redacted]');
  assert.equal(sanitized.accessItem?.instructions, '[redacted]');
  assert.equal(sanitized.emergencyContact?.name, '[redacted]');
  assert.equal(sanitized.emergencyContact?.phone, '[redacted]');
  assert.equal(sanitized.importantAccount?.accountNumber, '[redacted]');
  assert.equal(sanitized.importantAccount?.recoveryNotes, '[redacted]');
  assert.equal(sanitized.asset?.serial, '[redacted]');
});

test('redacts generic sensitive keys inside nested arrays', () => {
  const sanitized = sanitizeTelemetryContext([
    { phone: '555-0101' },
    { email: 'jamie@example.com' },
  ]) as Array<Record<string, unknown>>;

  assert.equal(sanitized[0]?.phone, '[redacted]');
  assert.equal(sanitized[1]?.email, '[redacted]');
});

async function test(name: string, run: () => void | Promise<void>) {
  try {
    await run();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}
