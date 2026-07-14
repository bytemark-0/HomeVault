import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { MissingRecordView } from '../../src/components/MissingRecordView';
import { useHomeVault } from '../../src/context/HomeVaultContext';
import { CareCardsScreen } from '../../src/screens/CareCardsScreen';
import { colors } from '../../src/theme/colors';
import { navigateBackOrReplace } from '../../src/utils/navigation';

export default function CareCardsRoute() {
  const { appData, showToast } = useHomeVault();

  if (!appData) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissingRecordView
          title="Care-card details unavailable"
          detail="HomeVault needs a household before it can prepare a care card."
          actionLabel="Go back"
          onActionPress={() => navigateBackOrReplace('/share')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <CareCardsScreen
        emergencyContacts={appData.emergencyContacts}
        onBack={() => navigateBackOrReplace('/share')}
        onShared={(message) => showToast(message)}
        property={appData.property}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.page,
  },
});
