import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { HomeVaultProvider, useHomeVault } from '../src/context/HomeVaultContext';
import { WelcomeScreen } from '../src/screens/onboarding/WelcomeScreen';
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
  const { isNewUser, loadError } = useHomeVault();

  if (loadError) return <LoadErrorView />;
  if (isNewUser) return <WelcomeScreen />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.page } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="search" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="quick-add" options={{ presentation: 'modal' }} />
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

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <HomeVaultProvider>
          <StatusBar style="dark" />
          <ToastOverlay />
          <AppContent />
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
