import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { HomeVaultProvider, useHomeVault } from '../src/context/HomeVaultContext';
import { Toast } from '../src/components/Toast';
import { colors } from '../src/theme/colors';

function ToastOverlay() {
  const { toast, dismissToast } = useHomeVault();
  return <Toast message={toast?.message ?? null} kind={toast?.kind} onDismiss={dismissToast} />;
}

export default function RootLayout() {
  return (
    <HomeVaultProvider>
      <StatusBar style="dark" />
      <ToastOverlay />
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
    </HomeVaultProvider>
  );
}
