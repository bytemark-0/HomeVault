import * as FileSystem from 'expo-file-system/legacy';

export type OnboardingStep = 'welcome' | 'create-property' | 'property-photo' | 'quick-start';

type StoredState = { step: OnboardingStep; propertyId?: string };

const VALID_STEPS: OnboardingStep[] = ['welcome', 'create-property', 'property-photo', 'quick-start'];

const FILE = `${FileSystem.documentDirectory ?? ''}onboarding_state.json`;

export async function readOnboardingState(): Promise<StoredState> {
  try {
    const info = await FileSystem.getInfoAsync(FILE);
    if (!info.exists) return { step: 'welcome' };
    const raw = await FileSystem.readAsStringAsync(FILE);
    const parsed = JSON.parse(raw) as StoredState;
    if (!VALID_STEPS.includes(parsed.step)) return { step: 'welcome' };
    return parsed;
  } catch {
    return { step: 'welcome' };
  }
}

export async function writeOnboardingState(state: StoredState): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(FILE, JSON.stringify(state));
  } catch {
    // Non-fatal.
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
