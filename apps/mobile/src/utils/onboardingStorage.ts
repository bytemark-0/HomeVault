import * as FileSystem from 'expo-file-system/legacy';
import type { Property } from '@homevault/domain';

export type OnboardingStep = 'welcome' | 'create-property' | 'property-photo' | 'quick-start';
export type ReadinessSetupStep = 'wifi' | 'access' | 'insurance' | 'emergency' | 'device';
export type CreatePropertyDraft = {
  label: string;
  addressLabel: string;
  type: Property['type'];
  yearBuilt: string;
  purchaseDate: string;
};
export type ReadinessSetupState = {
  currentStep: ReadinessSetupStep | null;
  skippedSteps: ReadinessSetupStep[];
};

type StoredState = { step: OnboardingStep; propertyId?: string };

const VALID_STEPS: OnboardingStep[] = ['welcome', 'create-property', 'property-photo', 'quick-start'];
const VALID_READINESS_STEPS: ReadinessSetupStep[] = [
  'wifi',
  'access',
  'insurance',
  'emergency',
  'device',
];
const VALID_PROPERTY_TYPES: Property['type'][] = [
  'single_family',
  'townhome',
  'condo',
  'multi_unit',
  'other',
];

const FILE = `${FileSystem.documentDirectory ?? ''}onboarding_state.json`;
const CREATE_PROPERTY_DRAFT_FILE = `${FileSystem.documentDirectory ?? ''}create_property_draft.json`;
const READINESS_SETUP_FILE = `${FileSystem.documentDirectory ?? ''}readiness_setup_state.json`;

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

export async function readCreatePropertyDraft(): Promise<CreatePropertyDraft | null> {
  try {
    const info = await FileSystem.getInfoAsync(CREATE_PROPERTY_DRAFT_FILE);
    if (!info.exists) return null;

    const raw = await FileSystem.readAsStringAsync(CREATE_PROPERTY_DRAFT_FILE);
    const parsed = JSON.parse(raw) as Partial<CreatePropertyDraft>;

    if (
      typeof parsed.label !== 'string' ||
      typeof parsed.addressLabel !== 'string' ||
      typeof parsed.yearBuilt !== 'string' ||
      typeof parsed.purchaseDate !== 'string' ||
      !VALID_PROPERTY_TYPES.includes(parsed.type as Property['type'])
    ) {
      return null;
    }

    return {
      label: parsed.label,
      addressLabel: parsed.addressLabel,
      type: parsed.type as Property['type'],
      yearBuilt: parsed.yearBuilt,
      purchaseDate: parsed.purchaseDate,
    };
  } catch {
    return null;
  }
}

export async function writeCreatePropertyDraft(draft: CreatePropertyDraft): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(CREATE_PROPERTY_DRAFT_FILE, JSON.stringify(draft));
  } catch {
    // Non-fatal.
  }
}

export async function clearCreatePropertyDraft(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(CREATE_PROPERTY_DRAFT_FILE);
    if (info.exists) await FileSystem.deleteAsync(CREATE_PROPERTY_DRAFT_FILE);
  } catch {
    // Non-fatal.
  }
}

export async function readReadinessSetupState(): Promise<ReadinessSetupState> {
  try {
    const info = await FileSystem.getInfoAsync(READINESS_SETUP_FILE);
    if (!info.exists) {
      return { currentStep: null, skippedSteps: [] };
    }

    const raw = await FileSystem.readAsStringAsync(READINESS_SETUP_FILE);
    const parsed = JSON.parse(raw) as Partial<ReadinessSetupState>;
    const currentStep = VALID_READINESS_STEPS.includes(parsed.currentStep as ReadinessSetupStep)
      ? (parsed.currentStep as ReadinessSetupStep)
      : null;
    const skippedSteps = Array.isArray(parsed.skippedSteps)
      ? parsed.skippedSteps.filter((step): step is ReadinessSetupStep =>
          VALID_READINESS_STEPS.includes(step as ReadinessSetupStep),
        )
      : [];

    return {
      currentStep,
      skippedSteps: Array.from(new Set(skippedSteps)),
    };
  } catch {
    return { currentStep: null, skippedSteps: [] };
  }
}

export async function writeReadinessSetupState(state: ReadinessSetupState): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(READINESS_SETUP_FILE, JSON.stringify(state));
  } catch {
    // Non-fatal.
  }
}

export async function clearReadinessSetupState(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(READINESS_SETUP_FILE);
    if (info.exists) await FileSystem.deleteAsync(READINESS_SETUP_FILE);
  } catch {
    // Non-fatal.
  }
}
