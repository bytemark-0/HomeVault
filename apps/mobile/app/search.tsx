import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useHomeVault } from '../src/context/HomeVaultContext';
import { SearchScreen } from '../src/screens/SearchScreen';
import { colors } from '../src/theme/colors';

export default function SearchRoute() {
  const { appData } = useHomeVault();

  if (!appData) return null;

  return (
    <View style={styles.safe}>
      <SearchScreen
        assets={appData.assets}
        documents={appData.documents}
        rooms={appData.rooms}
        tasks={appData.tasks}
        onAssetPress={(id) => { router.back(); router.push(`/asset/${id}`); }}
        onDocumentPress={(id) => { router.back(); router.push(`/document/${id}`); }}
        onRoomPress={(id) => { router.back(); router.push(`/room/${id}`); }}
        onTaskPress={(id) => { router.back(); router.push(`/task/${id}`); }}
        onClose={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.page } });
