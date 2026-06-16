import { router } from 'expo-router';
import { ScrollView, StyleSheet, View, Text, Pressable } from 'react-native';

import { useHomeVault } from '../../src/context/HomeVaultContext';
import { HomeScreen } from '../../src/screens/HomeScreen';
import { SetupChecklistCard } from '../../src/components/SetupChecklistCard';
import { colors } from '../../src/theme/colors';
import type { HomeActivityItem } from '../../src/data/homeVaultSampleData';

export default function HomeTab() {
  const { appData, loadError, reload } = useHomeVault();

  function handleActivityPress(activity: HomeActivityItem) {
    if (activity.kind === 'document') {
      router.push(`/document/${activity.targetId}`);
      return;
    }
    if (activity.kind === 'repair') {
      router.push(`/asset/${activity.targetId}`);
      return;
    }
    router.push(`/task/${activity.targetId}`);
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {appData ? (
        <>
          <SetupChecklistCard />
          <HomeScreen
            propertyLabel={appData.property.label}
            propertyPhotoUri={appData.property.photoUri}
            activeTasks={appData.activeTaskCount}
            assetCount={appData.assetCount}
            documentCount={appData.documentCount}
            healthScore={appData.healthScore}
            recentActivity={appData.recentActivity}
            dueTasks={appData.dueTasks}
            warrantyAlerts={appData.assets.filter((a) => a.warrantyExpiringSoon)}
            onActivityPress={handleActivityPress}
            onAssetPress={(id) => router.push(`/asset/${id}`)}
            onTaskPress={(id) => router.push(`/task/${id}`)}
            onViewCostSummary={() => router.push('/cost-summary')}
            onViewInventory={() => router.push('/(tabs)/inventory')}
            onViewMaintenance={() => router.push('/(tabs)/maintenance')}
            onViewServiceHistory={() => router.push('/service-history')}
            recentAssets={appData.recentAssets}
            roomCount={appData.roomCount}
            savedCostLabel={appData.savedCostLabel}
          />
        </>
      ) : loadError ? (
        <View style={styles.statusPanel}>
          <Text style={styles.statusTitle}>Could not load data</Text>
          <Text style={styles.statusText}>HomeVault could not read your local records.</Text>
          <Pressable
            onPress={() => reload().catch(() => {})}
            style={styles.retryButton}
            accessibilityRole="button"
            accessibilityLabel="Retry loading"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.statusPanel}>
          <Text style={styles.statusTitle}>Loading HomeVault</Text>
          <Text style={styles.statusText}>Preparing local household records.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 104 },
  statusPanel: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    gap: 6,
  },
  statusTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  statusText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  retryButton: {
    marginTop: 12,
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  retryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
});
