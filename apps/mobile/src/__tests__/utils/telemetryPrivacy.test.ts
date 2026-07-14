import { logUxEvent } from '../../utils/analytics';
import { logDiagnostic } from '../../utils/diagnosticLog';
import { sanitizeTelemetryContext } from '../../utils/sensitiveData';

describe('telemetry privacy', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('redacts sensitive household fields before telemetry context is serialized', () => {
    const sanitized = sanitizeTelemetryContext({
      accessItem: {
        id: 'access-1',
        category: 'wifi',
        label: 'Main Wi-Fi',
        username: 'OakStreet-5G',
        accessCode: '9274',
        location: 'Office shelf',
        instructions: 'Use the sticker under the router.',
        notes: 'Guest network is disabled.',
      },
      emergencyContact: {
        id: 'contact-1',
        role: 'Neighbor with spare key',
        priority: 'primary',
        name: 'Jamie Lee',
        phone: '555-0101',
        email: 'jamie@example.test',
        address: '1 Oak Street',
        notes: 'Can help with the pets.',
      },
      importantAccount: {
        id: 'account-1',
        kind: 'email',
        providerName: 'Google',
        label: 'Primary email',
        accountNumber: 'acct-123',
        phone: '555-0119',
        email: 'family@example.test',
        recoveryNotes: 'Backup codes are in the fire safe.',
      },
      nested: [{ serial: 'router-serial-1' }],
    }) as Record<string, unknown>;

    expect(sanitized).toEqual({
      accessItem: {
        id: 'access-1',
        category: 'wifi',
        label: 'Main Wi-Fi',
        username: '[redacted]',
        accessCode: '[redacted]',
        location: '[redacted]',
        instructions: '[redacted]',
        notes: '[redacted]',
      },
      emergencyContact: {
        id: 'contact-1',
        role: 'Neighbor with spare key',
        priority: 'primary',
        name: '[redacted]',
        phone: '[redacted]',
        email: '[redacted]',
        address: '[redacted]',
        notes: '[redacted]',
      },
      importantAccount: {
        id: 'account-1',
        kind: 'email',
        providerName: 'Google',
        label: 'Primary email',
        accountNumber: '[redacted]',
        phone: '[redacted]',
        email: '[redacted]',
        recoveryNotes: '[redacted]',
      },
      nested: [{ serial: '[redacted]' }],
    });
  });

  it('logs diagnostics without emitting raw access or recovery details', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    logDiagnostic('export_failure', new Error('boom'), {
      accessItem: {
        category: 'wifi',
        label: 'Main Wi-Fi',
        username: 'OakStreet-5G',
        accessCode: '9274',
      },
      importantAccount: {
        kind: 'email',
        providerName: 'Google',
        label: 'Primary email',
        recoveryNotes: 'Backup codes are in the fire safe.',
      },
    });

    expect(warn).toHaveBeenCalledTimes(1);
    const [, payload] = warn.mock.calls[0] ?? [];
    expect(String(payload)).toContain('[redacted]');
    expect(String(payload)).not.toContain('9274');
    expect(String(payload)).not.toContain('OakStreet-5G');
    expect(String(payload)).not.toContain('Backup codes are in the fire safe.');
    expect(String(payload)).toContain('"category":"export_failure"');
  });

  it('logs UX events without emitting raw contact details', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    logUxEvent('sample_selected', {
      emergencyContact: {
        role: 'Neighbor with spare key',
        priority: 'primary',
        name: 'Jamie Lee',
        phone: '555-0101',
        email: 'jamie@example.test',
      },
    });

    expect(log).toHaveBeenCalledTimes(1);
    const [, payload] = log.mock.calls[0] ?? [];
    expect(String(payload)).toContain('[redacted]');
    expect(String(payload)).not.toContain('Jamie Lee');
    expect(String(payload)).not.toContain('555-0101');
    expect(String(payload)).not.toContain('jamie@example.test');
    expect(String(payload)).toContain('"eventName":"sample_selected"');
  });
});
