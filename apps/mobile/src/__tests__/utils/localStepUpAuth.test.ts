import { Alert } from 'react-native';

const baseOptions = {
  alertTitle: 'Reveal sensitive access details?',
  alertMessage: 'Confirm locally before revealing them on this device.',
  confirmLabel: 'Reveal details',
  authPromptMessage: 'Authenticate to reveal access details',
};

describe('confirmLocalStepUp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('falls back to a local confirmation prompt when native auth is unavailable', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      if (Array.isArray(buttons)) {
        const confirm = buttons[1];
        if (confirm && 'onPress' in confirm && typeof confirm.onPress === 'function') {
          confirm.onPress();
        }
      }
    });

    let confirmLocalStepUp: typeof import('../../utils/localStepUpAuth').confirmLocalStepUp;
    await jest.isolateModulesAsync(async () => {
      ({ confirmLocalStepUp } = require('../../utils/localStepUpAuth'));
    });

    await expect(confirmLocalStepUp(baseOptions)).resolves.toBe(true);
    expect(alert).toHaveBeenCalledWith(
      'Reveal sensitive access details?',
      'Confirm locally before revealing them on this device.',
      expect.any(Array),
    );
  });

  it('uses device authentication when the Expo local-auth module is available', async () => {
    const authenticateAsync = jest.fn().mockResolvedValue({ success: true });
    const hasHardwareAsync = jest.fn().mockResolvedValue(true);
    const isEnrolledAsync = jest.fn().mockResolvedValue(true);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

    jest.doMock(
      'expo-local-authentication',
      () => ({
        authenticateAsync,
        hasHardwareAsync,
        isEnrolledAsync,
      }),
      { virtual: true },
    );

    let confirmLocalStepUp: typeof import('../../utils/localStepUpAuth').confirmLocalStepUp;
    await jest.isolateModulesAsync(async () => {
      ({ confirmLocalStepUp } = require('../../utils/localStepUpAuth'));
    });

    await expect(confirmLocalStepUp(baseOptions)).resolves.toBe(true);
    expect(hasHardwareAsync).toHaveBeenCalled();
    expect(isEnrolledAsync).toHaveBeenCalled();
    expect(authenticateAsync).toHaveBeenCalledWith({
      promptMessage: 'Authenticate to reveal access details',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use device passcode',
      disableDeviceFallback: false,
    });
    expect(alert).not.toHaveBeenCalled();
  });

  it('returns false when the local confirmation prompt is cancelled', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      if (Array.isArray(buttons)) {
        const cancel = buttons[0];
        if (cancel && 'onPress' in cancel && typeof cancel.onPress === 'function') {
          cancel.onPress();
        }
      }
    });

    jest.doMock(
      'expo-local-authentication',
      () => ({
        hasHardwareAsync: jest.fn().mockResolvedValue(false),
      }),
      { virtual: true },
    );

    let confirmLocalStepUp: typeof import('../../utils/localStepUpAuth').confirmLocalStepUp;
    await jest.isolateModulesAsync(async () => {
      ({ confirmLocalStepUp } = require('../../utils/localStepUpAuth'));
    });

    await expect(confirmLocalStepUp(baseOptions)).resolves.toBe(false);
    expect(alert).toHaveBeenCalled();
  });

  it('returns false when device authentication is cancelled', async () => {
    const authenticateAsync = jest.fn().mockResolvedValue({ success: false });
    const hasHardwareAsync = jest.fn().mockResolvedValue(true);
    const isEnrolledAsync = jest.fn().mockResolvedValue(true);

    jest.doMock(
      'expo-local-authentication',
      () => ({
        authenticateAsync,
        hasHardwareAsync,
        isEnrolledAsync,
      }),
      { virtual: true },
    );

    let confirmLocalStepUp: typeof import('../../utils/localStepUpAuth').confirmLocalStepUp;
    await jest.isolateModulesAsync(async () => {
      ({ confirmLocalStepUp } = require('../../utils/localStepUpAuth'));
    });

    await expect(confirmLocalStepUp(baseOptions)).resolves.toBe(false);
    expect(authenticateAsync).toHaveBeenCalled();
  });
});
