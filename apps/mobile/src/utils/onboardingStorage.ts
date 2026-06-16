import * as FileSystem from 'expo-file-system/legacy';

export type OnboardingStep = 'welcome' | 'create-property';

type StoredState = { step: OnboardingStep };

const FILE = `${FileSystem.documentDirectory ?? ''}onboarding_state.json`;

export async function readOnboardingStep(): Promise<OnboardingStep> {
  try {
    const info = await FileSystem.getInfoAsync(FILE);
    if (!info.exists) return 'welcome';
    const raw = await FileSystem.readAsStringAsync(FILE);
    const parsed = JSON.parse(raw) as StoredState;
    if (parsed.step === 'create-property') return 'create-property';
    return 'welcome';
  } catch {
    // Corrupt or unreadable file — fall back to welcome safely.
    return 'welcome';
  }
}

export async function writeOnboardingStep(step: OnboardingStep): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(FILE, JSON.stringify({ step }));
  } catch {
    // Non-fatal — user may see welcome on next launch instead of resuming.
  }
}

export async function clearOnboardingState(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(FILE);
    if (info.exists) await FileSystem.deleteAsync(FILE);
  } catch {
    // Non-fatal.
  }
}
