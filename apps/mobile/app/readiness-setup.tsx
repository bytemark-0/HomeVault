import { useLocalSearchParams } from 'expo-router';

import { useHomeVault } from '../src/context/HomeVaultContext';
import { QuickStartScreen } from '../src/screens/onboarding/QuickStartScreen';
import { navigateBackOrReplace } from '../src/utils/navigation';
import type { ReadinessSetupStep } from '../src/utils/onboardingStorage';

export default function ReadinessSetupRoute() {
  const { appData, reload } = useHomeVault();
  const { step } = useLocalSearchParams<{ step?: ReadinessSetupStep }>();

  if (!appData) return null;

  return (
    <QuickStartScreen
      property={appData.property}
      initialStep={step ?? null}
      onDone={async () => {
        await reload();
        navigateBackOrReplace('/(tabs)');
      }}
    />
  );
}
