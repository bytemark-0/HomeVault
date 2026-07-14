jest.mock('expo-file-system/legacy', () => {
  const files = new Map<string, string>();

  return {
    documentDirectory: 'file:///documents/',
    __resetFiles: () => files.clear(),
    __setFile: (path: string, value: string) => files.set(path, value),
    getInfoAsync: jest.fn(async (path: string) => ({ exists: files.has(path) })),
    readAsStringAsync: jest.fn(async (path: string) => {
      const value = files.get(path);
      if (value === undefined) throw new Error('missing file');
      return value;
    }),
    writeAsStringAsync: jest.fn(async (path: string, value: string) => {
      files.set(path, value);
    }),
    deleteAsync: jest.fn(async (path: string) => {
      files.delete(path);
    }),
  };
});

import {
  readReadinessSetupState,
  readCreatePropertyDraft,
  readOnboardingState,
  writeReadinessSetupState,
  writeCreatePropertyDraft,
} from '../../utils/onboardingStorage';

const FileSystem = require('expo-file-system/legacy');

describe('onboardingStorage', () => {
  beforeEach(() => {
    FileSystem.__resetFiles();
  });

  it('falls back to welcome when the saved onboarding step is invalid', async () => {
    FileSystem.__setFile(
      'file:///documents/onboarding_state.json',
      JSON.stringify({ step: 'not-a-real-step' }),
    );

    await expect(readOnboardingState()).resolves.toEqual({ step: 'welcome' });
  });

  it('falls back safely when the saved onboarding state is invalid JSON', async () => {
    FileSystem.__setFile('file:///documents/onboarding_state.json', '{bad json');

    await expect(readOnboardingState()).resolves.toEqual({ step: 'welcome' });
  });

  it('rejects a corrupt property draft with an invalid property type', async () => {
    FileSystem.__setFile(
      'file:///documents/create_property_draft.json',
      JSON.stringify({
        label: 'Oak Street home',
        addressLabel: 'Austin, TX',
        type: 'castle',
        yearBuilt: '1998',
        purchaseDate: '2023-08-15',
      }),
    );

    await expect(readCreatePropertyDraft()).resolves.toBeNull();
  });

  it('round-trips a valid property draft', async () => {
    const draft = {
      label: 'Oak Street home',
      addressLabel: 'Austin, TX',
      type: 'single_family' as const,
      yearBuilt: '1998',
      purchaseDate: '2023-08-15',
    };

    await writeCreatePropertyDraft(draft);

    await expect(readCreatePropertyDraft()).resolves.toEqual(draft);
  });

  it('falls back safely when readiness setup state is invalid', async () => {
    FileSystem.__setFile(
      'file:///documents/readiness_setup_state.json',
      JSON.stringify({
        currentStep: 'not-real',
        skippedSteps: ['wifi', 'broken-step'],
      }),
    );

    await expect(readReadinessSetupState()).resolves.toEqual({
      currentStep: null,
      skippedSteps: ['wifi'],
    });
  });

  it('round-trips readiness setup state', async () => {
    const state = {
      currentStep: 'emergency' as const,
      skippedSteps: ['wifi', 'access'] as const,
    };

    await writeReadinessSetupState({
      currentStep: state.currentStep,
      skippedSteps: [...state.skippedSteps],
    });

    await expect(readReadinessSetupState()).resolves.toEqual({
      currentStep: 'emergency',
      skippedSteps: ['wifi', 'access'],
    });
  });
});
