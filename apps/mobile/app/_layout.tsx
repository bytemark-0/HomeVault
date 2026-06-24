import { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import type { Property } from '@homevault/domain';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { HomeVaultProvider, useHomeVault } from '../src/context/HomeVaultContext';
import { WelcomeScreen } from '../src/screens/onboarding/WelcomeScreen';
import { CreatePropertyScreen } from '../src/screens/onboarding/CreatePropertyScreen';
import { PropertyPhotoScreen } from '../src/screens/onboarding/PropertyPhotoScreen';
import { QuickStartScreen } from '../src/screens/onboarding/QuickStartScreen';
import { BetaSupportScreen } from '../src/screens/BetaSupportScreen';
import {
  type OnboardingStep,
  clearOnboardingState,
  readCreatePropertyDraft,
  readOnboardingState,
  writeOnboardingState,
} from '../src/utils/onboardingStorage';
import { Toast } from '../src/components/Toast';
import { colors } from '../src/theme/colors';

function ToastOverlay() {
  const { toast, dismissToast } = useHomeVault();
  return <Toast message={toast?.message ?? null} kind={toast?.kind} onDismiss={dismissToast} />;
}

function LoadErrorView() {
  const { reload } = useHomeVault();

  return (
    <SafeAreaView style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Could not load your home</Text>
      <Text style={styles.errorBody}>
        HomeVault could not open its database. This can happen after an app update.
        Your data is safe — tap below to try again.
      </Text>
      <Pressable style={styles.errorButton} onPress={() => void reload()}>
        <Text style={styles.errorButtonText}>Try Again</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function AppContent() {
  const { isNewUser, loadError, finishOnboarding, appData } = useHomeVault();
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [postCreateStep, setPostCreateStep] = useState<'add-photo' | 'quick-start' | null>(null);
  const [onboardingProperty, setOnboardingProperty] = useState<Property | null>(null);
  const [showOnboardingSupport, setShowOnboardingSupport] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const reconciledRef = useRef(false);

  // Restore persisted step so kills during setup resume at the right screen.
  useEffect(() => {
    if (reconciledRef.current) return;
    // For pre-property steps isNewUser=true is known immediately.
    // For post-property steps we need appData to arrive first.
    if (!isNewUser && appData === null) return;

    reconciledRef.current = true;

    async function reconcile() {
      const [state, propertyDraft] = await Promise.all([
        readOnboardingState(),
        readCreatePropertyDraft(),
      ]);

      if (isNewUser) {
        // If onboarding was interrupted before a property existed, always
        // return to the first incomplete step instead of bouncing back to welcome.
        if (state.step !== 'welcome' || propertyDraft) {
          setOnboardingStep('create-property');
        }
      } else if (
        appData &&
        (state.step === 'property-photo' || state.step === 'quick-start') &&
        state.propertyId === appData.property.id
      ) {
        setOnboardingProperty(appData.property);
        setPostCreateStep(state.step === 'property-photo' ? 'add-photo' : 'quick-start');
      }

      setInitializing(false);
    }

    void reconcile();
  }, [isNewUser, appData]);

  function goToStep(step: 'welcome' | 'create-property') {
    setOnboardingStep(step);
    void writeOnboardingState({ step });
  }

  async function handleQuickStartDone() {
    await clearOnboardingState();
    setOnboardingProperty(null);
    setPostCreateStep(null);
    await finishOnboarding();
  }

  if (loadError) return <LoadErrorView />;
  if (initializing) return null;
  if (isNewUser || postCreateStep !== null) {
    if (showOnboardingSupport) {
      return <BetaSupportScreen onBack={() => setShowOnboardingSupport(false)} />;
    }
    if (postCreateStep === 'add-photo' && onboardingProperty) {
      const propertyId = onboardingProperty.id;

      return (
        <PropertyPhotoScreen
          property={onboardingProperty}
          onDone={(updated) => {
            void writeOnboardingState({ step: 'quick-start', propertyId: updated.id });
            setOnboardingProperty(updated);
            setPostCreateStep('quick-start');
          }}
          onSkip={() => {
            void writeOnboardingState({ step: 'quick-start', propertyId });
            setPostCreateStep('quick-start');
          }}
        />
      );
    }
    if (postCreateStep === 'quick-start' && onboardingProperty) {
      return (
        <QuickStartScreen
          property={onboardingProperty}
          onDone={handleQuickStartDone}
        />
      );
    }
    if (onboardingStep === 'create-property') {
      return (
        <CreatePropertyScreen
          onBack={() => goToStep('welcome')}
          onCreated={(property) => {
            void writeOnboardingState({ step: 'property-photo', propertyId: property.id });
            setOnboardingProperty(property);
            setPostCreateStep('add-photo');
          }}
        />
      );
    }
    return (
      <WelcomeScreen
        onSetUp={() => goToStep('create-property')}
        onSupport={() => setShowOnboardingSupport(true)}
      />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.page } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="search" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="quick-add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="support" />
      <Stack.Screen name="export" />
      <Stack.Screen name="service-history" />
      <Stack.Screen name="cost-summary" />
      <Stack.Screen name="property/edit" />
      <Stack.Screen name="room/new" />
      <Stack.Screen name="room/[id]" />
      <Stack.Screen name="room/[id]/edit" />
      <Stack.Screen name="room/[id]/add-asset" />
      <Stack.Screen name="room/[id]/add-document" />
      <Stack.Screen name="room/[id]/add-task" />
      <Stack.Screen name="asset/new" />
      <Stack.Screen name="asset/[id]" />
      <Stack.Screen name="asset/[id]/edit" />
      <Stack.Screen name="asset/[id]/add-document" />
      <Stack.Screen name="asset/[id]/add-task" />
      <Stack.Screen name="asset/[id]/add-repair" />
      <Stack.Screen name="asset/[id]/add-part" />
      <Stack.Screen name="asset/[id]/repair/[repairId]/edit" />
      <Stack.Screen name="asset/[id]/part/[partId]/edit" />
      <Stack.Screen name="document/new" />
      <Stack.Screen name="document/[id]" />
      <Stack.Screen name="document/[id]/edit" />
      <Stack.Screen name="task/new" />
      <Stack.Screen name="task/[id]" />
      <Stack.Screen name="task/[id]/edit" />
      <Stack.Screen name="task/[id]/complete" />
      <Stack.Screen name="task/[id]/snooze" />
      <Stack.Screen name="task/[id]/completion/[completionId]/edit" />
    </Stack>
  );
}

function AppContentWrapper() {
  const { isNewUser } = useHomeVault();
  // Re-mount AppContent whenever isNewUser changes so onboardingStep resets to 'welcome'.
  return <AppContent key={String(isNewUser)} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <HomeVaultProvider>
          <StatusBar style="dark" />
          <ToastOverlay />
          <AppContentWrapper />
        </HomeVaultProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: colors.page,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  errorButton: {
    backgroundColor: colors.green,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
