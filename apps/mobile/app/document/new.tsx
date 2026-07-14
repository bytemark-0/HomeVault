import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DocumentRecord } from '@homevault/domain';
import { useHomeVault } from '../../src/context/HomeVaultContext';
import { AddDocumentScreen } from '../../src/screens/AddDocumentScreen';
import { getHomeVaultRepository } from '../../src/data/localHomeVaultRepository';
import { navigateBackOrReplace } from '../../src/utils/navigation';
import type { CreateDocumentInput } from '@homevault/database';
import { colors } from '../../src/theme/colors';

export default function NewDocumentRoute() {
  const { linkedRecordId, type } = useLocalSearchParams<{
    linkedRecordId?: string;
    type?: DocumentRecord['type'];
  }>();
  const { appData, reload, showToast } = useHomeVault();

  if (!appData) return null;

  async function handleSave(input: CreateDocumentInput) {
    try {
      const repo = await getHomeVaultRepository();
      const document = await repo.createDocument(input);
      await reload();
      showToast('Document saved');
      navigateBackOrReplace(`/document/${document.id}`);
    } catch {
      showToast('Could not save document. Please try again.', 'error');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AddDocumentScreen
        propertyId={appData.property.id}
        assets={appData.assets}
        rooms={appData.rooms}
        initialLinkedRecordId={linkedRecordId}
        initialType={type}
        onCancel={() => navigateBackOrReplace('/(tabs)/documents')}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
