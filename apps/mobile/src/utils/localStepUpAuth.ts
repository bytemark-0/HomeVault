import { Alert, Platform } from 'react-native';

type LocalStepUpOptions = {
  alertTitle: string;
  alertMessage: string;
  confirmLabel: string;
  authPromptMessage: string;
};

type LocalAuthenticationModule = {
  authenticateAsync?: (options: {
    promptMessage?: string;
    cancelLabel?: string;
    fallbackLabel?: string;
    disableDeviceFallback?: boolean;
  }) => Promise<{ success: boolean }>;
  hasHardwareAsync?: () => Promise<boolean>;
  isEnrolledAsync?: () => Promise<boolean>;
};

export async function confirmLocalStepUp({
  alertTitle,
  alertMessage,
  confirmLabel,
  authPromptMessage,
}: LocalStepUpOptions) {
  if (Platform.OS === 'web') {
    return true;
  }

  const localAuthentication = getLocalAuthenticationModule();

  if (localAuthentication) {
    try {
      const hasHardware = (await localAuthentication.hasHardwareAsync?.()) ?? false;
      const isEnrolled = hasHardware
        ? ((await localAuthentication.isEnrolledAsync?.()) ?? false)
        : false;

      if (hasHardware && isEnrolled && localAuthentication.authenticateAsync) {
        const result = await localAuthentication.authenticateAsync({
          promptMessage: authPromptMessage,
          cancelLabel: 'Cancel',
          fallbackLabel: 'Use device passcode',
          disableDeviceFallback: false,
        });

        return result.success;
      }
    } catch {
      // Fall back to an explicit local confirmation prompt if native auth is unavailable.
    }
  }

  return new Promise<boolean>((resolve) => {
    Alert.alert(alertTitle, alertMessage, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, onPress: () => resolve(true) },
    ]);
  });
}

function getLocalAuthenticationModule(): LocalAuthenticationModule | null {
  try {
    const module = require('expo-local-authentication') as LocalAuthenticationModule | undefined;
    return module ?? null;
  } catch {
    return null;
  }
}
