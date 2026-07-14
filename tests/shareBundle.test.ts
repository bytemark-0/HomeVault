import assert from 'node:assert/strict';

import {
  buildHomeVaultItemShareBundle,
  formatHomeVaultItemShareBundle,
  parseHomeVaultItemShareBundle,
  validateHomeVaultItemShareBundle,
} from '../packages/export/src';

test('round-trips an encrypted item-share bundle with provenance and omitted fields', () => {
  const bundle = buildHomeVaultItemShareBundle({
    property: {
      id: 'property-1',
      label: 'Oak Street home',
      type: 'single_family',
    },
    senderLabel: 'Jordan',
    audience: {
      key: 'house_sitter',
      label: 'House sitter',
    },
    expiresAt: '2026-07-16T12:00:00.000Z',
    generatedAt: '2026-07-09T12:00:00.000Z',
    items: [
      {
        recordType: 'access_item',
        recordId: 'access-1',
        label: 'Main water shutoff',
        linkedRecordIds: ['document-1', 'asset-1'],
        includedFieldIds: ['label', 'location', 'instructions'],
        omittedFieldIds: ['notes', 'lastVerifiedAt'],
      },
    ],
    encryption: {
      scheme: 'aes-256-gcm',
      keyDerivation: 'pbkdf2-sha256',
      iterations: 150000,
      saltBase64: 'c2FsdA==',
      ivBase64: 'aXY=',
      ciphertextBase64: 'Y2lwaGVydGV4dA==',
    },
  });

  const result = parseHomeVaultItemShareBundle(formatHomeVaultItemShareBundle(bundle));

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error('Expected item-share bundle validation to succeed.');
  }

  assert.equal(result.bundle.kind, 'item_share_bundle');
  assert.equal(result.preview.senderLabel, 'Jordan');
  assert.equal(result.preview.householdLabel, 'Oak Street home');
  assert.equal(result.preview.audienceLabel, 'House sitter');
  assert.equal(result.preview.itemCount, 1);
  assert.equal(result.preview.linkedRecordCount, 2);
  assert.equal(result.preview.omittedFieldCount, 2);
  assert.equal(result.preview.primaryRecordType, 'access_item');
  assert.equal(result.preview.expiresAt, '2026-07-16T12:00:00.000Z');
  assert.equal(result.preview.readOnly, true);
  assert.deepEqual(result.preview.items[0]?.omittedFieldIds, ['notes', 'lastVerifiedAt']);
  assert.equal(result.summary, '1 shared item · House sitter · 2 linked records');
});

test('rejects item-share bundles with unsupported versions', () => {
  const result = validateHomeVaultItemShareBundle({
    app: 'HomeVault',
    kind: 'item_share_bundle',
    version: 2,
    provenance: {},
    contents: {},
    encryption: {},
  });

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error('Expected item-share bundle validation to fail.');
  }

  assert.equal(result.errorKind, 'version_unsupported');
});

test('rejects malformed item-share bundles without encryption metadata', () => {
  const bundle = buildHomeVaultItemShareBundle({
    property: {
      id: 'property-1',
      label: 'Oak Street home',
      type: 'single_family',
    },
    senderLabel: 'Jordan',
    audience: {
      key: 'spouse',
      label: 'Spouse or partner',
    },
    items: [
      {
        recordType: 'important_account',
        recordId: 'account-1',
        label: 'Home policy',
        linkedRecordIds: ['document-1'],
        includedFieldIds: ['providerName', 'phone'],
        omittedFieldIds: ['recoveryNotes'],
      },
    ],
    encryption: {
      scheme: 'aes-256-gcm',
      keyDerivation: 'pbkdf2-sha256',
      iterations: 150000,
      saltBase64: 'c2FsdA==',
      ivBase64: 'aXY=',
      ciphertextBase64: 'Y2lwaGVydGV4dA==',
    },
  });

  const malformed = JSON.parse(formatHomeVaultItemShareBundle(bundle)) as Record<string, unknown>;
  malformed.encryption = {
    scheme: 'aes-256-gcm',
    keyDerivation: 'pbkdf2-sha256',
    iterations: 5000,
    saltBase64: '',
    ivBase64: '',
    ciphertextBase64: '',
  };

  const result = validateHomeVaultItemShareBundle(malformed);

  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error('Expected malformed item-share bundle validation to fail.');
  }

  assert.equal(result.errorKind, 'malformed');
  assert.ok(
    result.errors.includes(
      'Encrypted payload iterations must be a number greater than or equal to 100000.',
    ),
  );
  assert.ok(result.errors.includes('Encrypted payload salt is missing.'));
  assert.ok(result.errors.includes('Encrypted payload IV is missing.'));
  assert.ok(result.errors.includes('Encrypted payload ciphertext is missing.'));
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
