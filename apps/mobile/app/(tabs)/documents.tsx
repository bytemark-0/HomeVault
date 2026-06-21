import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { useHomeVault } from '../../src/context/HomeVaultContext';
import { SampleModeNotice } from '../../src/components/SampleModeNotice';
import { DocumentsScreen, type DocumentReviewFilter } from '../../src/screens/DocumentsScreen';

export default function DocumentsTab() {
  const { appData } = useHomeVault();
  const { reviewFilter } = useLocalSearchParams<{ reviewFilter?: DocumentReviewFilter }>();

  if (!appData) return null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SampleModeNotice />
      <DocumentsScreen
        assets={appData.assets}
        rooms={appData.rooms}
        propertyId={appData.property.id}
        documents={appData.documents}
        documentCount={appData.documentCount}
        reviewFilter={reviewFilter ?? null}
        onAddDocument={() => router.push('/document/new')}
        onAddDocumentForRecord={(recordId) =>
          router.push({ pathname: '/document/new', params: { linkedRecordId: recordId } })
        }
        onClearReviewFilter={() =>
          router.setParams({ reviewFilter: undefined })
        }
        onDocumentPress={(id) => router.push(`/document/${id}`)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 104 },
});
