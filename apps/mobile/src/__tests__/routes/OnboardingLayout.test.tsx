import type { ReactNode } from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockUseHomeVault = jest.fn();
const mockReadOnboardingState = jest.fn();
const mockReadCreatePropertyDraft = jest.fn();
const mockWriteOnboardingState = jest.fn();
const mockClearOnboardingState = jest.fn();
let currentHomeVaultContext: ReturnType<typeof buildHomeVaultContext>;

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: ReactNode }) => children,
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const Stack = Object.assign(() => <Text>Main app stack</Text>, {
    Screen: () => null,
  });

  return { Stack };
});

jest.mock('../../context/HomeVaultContext', () => ({
  HomeVaultProvider: ({ children }: { children: ReactNode }) => children,
  useHomeVault: () => mockUseHomeVault(),
}));

jest.mock('../../components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('../../components/Toast', () => ({
  Toast: () => null,
}));

jest.mock('../../screens/onboarding/WelcomeScreen', () => ({
  WelcomeScreen: () => {
    const { Text } = require('react-native');
    return <Text>Welcome screen</Text>;
  },
}));

jest.mock('../../screens/onboarding/CreatePropertyScreen', () => ({
  CreatePropertyScreen: () => {
    const { Text } = require('react-native');
    return <Text>Create property screen</Text>;
  },
}));

jest.mock('../../screens/onboarding/PropertyPhotoScreen', () => ({
  PropertyPhotoScreen: () => {
    const { Text } = require('react-native');
    return <Text>Property photo screen</Text>;
  },
}));

jest.mock('../../screens/onboarding/QuickStartScreen', () => ({
  QuickStartScreen: ({ onDone }: { onDone: () => Promise<void> }) => {
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Text>Quick start screen</Text>
        <Pressable accessibilityRole="button" onPress={() => void onDone()}>
          <Text>Finish quick start</Text>
        </Pressable>
      </>
    );
  },
}));

jest.mock('../../screens/BetaSupportScreen', () => ({
  BetaSupportScreen: () => {
    const { Text } = require('react-native');
    return <Text>Beta support screen</Text>;
  },
}));

jest.mock('../../utils/onboardingStorage', () => ({
  clearOnboardingState: mockClearOnboardingState,
  readCreatePropertyDraft: mockReadCreatePropertyDraft,
  readOnboardingState: mockReadOnboardingState,
  writeOnboardingState: mockWriteOnboardingState,
}));

const RootLayout = require('../../../app/_layout').default;

function buildHomeVaultContext({
  isNewUser,
  propertyId = 'property-1',
}: {
  isNewUser: boolean;
  propertyId?: string;
}) {
  return {
    appData: isNewUser
      ? null
      : {
          property: {
            id: propertyId,
            householdId: 'household-1',
            label: 'Home',
            type: 'single_family' as const,
          },
        },
    isNewUser,
    isSampleMode: false,
    loadError: false,
    backupSummary: null,
    restoreSummary: null,
    toast: null,
    setBackupSummary: jest.fn(),
    setRestoreSummary: jest.fn(),
    reload: jest.fn(),
    enterSampleMode: jest.fn(),
    exitSampleMode: jest.fn(),
    finishOnboarding: jest.fn(),
    showToast: jest.fn(),
    dismissToast: jest.fn(),
  };
}

describe('onboarding layout recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentHomeVaultContext = buildHomeVaultContext({ isNewUser: true });
    mockUseHomeVault.mockImplementation(() => currentHomeVaultContext);
    mockReadOnboardingState.mockResolvedValue({ step: 'welcome' });
    mockReadCreatePropertyDraft.mockResolvedValue(null);
    mockWriteOnboardingState.mockResolvedValue(undefined);
    mockClearOnboardingState.mockResolvedValue(undefined);
  });

  it('shows the welcome screen for a clean new user state', async () => {
    const { getByText } = await render(<RootLayout />);

    await waitFor(() => expect(getByText('Welcome screen')).toBeTruthy());
  });

  it('resumes property creation after restart when setup had already started', async () => {
    mockReadOnboardingState.mockResolvedValue({ step: 'create-property' });

    const { getByText } = await render(<RootLayout />);

    await waitFor(() => expect(getByText('Create property screen')).toBeTruthy());
  });

  it('falls back to property creation when a stale post-create step exists without a property', async () => {
    mockReadOnboardingState.mockResolvedValue({ step: 'quick-start', propertyId: 'missing-property' });

    const { getByText } = await render(<RootLayout />);

    await waitFor(() => expect(getByText('Create property screen')).toBeTruthy());
  });

  it('resumes the property photo step for the current property after restart', async () => {
    currentHomeVaultContext = buildHomeVaultContext({ isNewUser: false, propertyId: 'property-1' });
    mockReadOnboardingState.mockResolvedValue({ step: 'property-photo', propertyId: 'property-1' });

    const { getByText } = await render(<RootLayout />);

    await waitFor(() => expect(getByText('Property photo screen')).toBeTruthy());
  });

  it('resumes the quick-start step for the current property after restart', async () => {
    currentHomeVaultContext = buildHomeVaultContext({ isNewUser: false, propertyId: 'property-1' });
    mockReadOnboardingState.mockResolvedValue({ step: 'quick-start', propertyId: 'property-1' });

    const { getByText } = await render(<RootLayout />);

    await waitFor(() => expect(getByText('Quick start screen')).toBeTruthy());
  });

  it('ignores stale onboarding state when a usable property already exists', async () => {
    currentHomeVaultContext = buildHomeVaultContext({ isNewUser: false, propertyId: 'property-1' });
    mockReadOnboardingState.mockResolvedValue({ step: 'create-property' });

    const { getByText } = await render(<RootLayout />);

    await waitFor(() => expect(getByText('Main app stack')).toBeTruthy());
  });

  it('leaves onboarding for the main app after quick start finishes', async () => {
    currentHomeVaultContext = buildHomeVaultContext({ isNewUser: false, propertyId: 'property-1' });
    const finishOnboarding = jest.fn(async () => {
      currentHomeVaultContext = buildHomeVaultContext({ isNewUser: false, propertyId: 'property-1' });
    });
    currentHomeVaultContext.finishOnboarding = finishOnboarding;
    mockReadOnboardingState.mockResolvedValue({ step: 'quick-start', propertyId: 'property-1' });

    const view = await render(<RootLayout />);

    await waitFor(() => expect(view.getByText('Quick start screen')).toBeTruthy());

    await act(async () => {
      fireEvent.press(view.getByText('Finish quick start'));
    });
    await waitFor(() => expect(mockClearOnboardingState).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(finishOnboarding).toHaveBeenCalledTimes(1));

    view.rerender(<RootLayout />);

    await waitFor(() => expect(view.getByText('Main app stack')).toBeTruthy());
  });
});
