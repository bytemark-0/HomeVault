import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabIcon } from '../../src/components/TabIcon';
import { colors } from '../../src/theme/colors';
import { useHomeVault } from '../../src/context/HomeVaultContext';

export default function TabLayout() {
  const { appData, isSampleMode, exitSampleMode } = useHomeVault();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: 8 + insets.top }]}>
        <View>
          <Text style={styles.appName}>HomeVault</Text>
          <Text style={styles.homeLabel}>{appData?.property.label ?? 'Loading home'}</Text>
        </View>
        <View style={styles.topBarActions}>
          <Pressable
            style={styles.searchButton}
            accessibilityLabel="Search"
            accessibilityRole="button"
            onPress={() => appData && router.push('/search')}
          >
            <Text style={styles.searchButtonText}>⌕</Text>
          </Pressable>
          <Pressable
            style={styles.addButton}
            accessibilityLabel="Add record"
            accessibilityRole="button"
            onPress={() => router.push('/quick-add')}
          >
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      {isSampleMode && (
        <Pressable
          style={styles.sampleBanner}
          onPress={() => void exitSampleMode()}
          accessibilityRole="button"
          accessibilityLabel="Sample home — tap to exit"
        >
          <Text style={styles.sampleBannerText}>Sample home · Tap to create your own</Text>
        </Pressable>
      )}

      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <HomeVaultTabBar {...props} />}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="inventory" options={{ title: 'Inventory' }} />
        <Tabs.Screen name="maintenance" options={{ title: 'Tasks' }} />
        <Tabs.Screen name="documents" options={{ title: 'Docs' }} />
        <Tabs.Screen name="household" options={{ title: 'Household' }} />
      </Tabs>
    </View>
  );
}

function HomeVaultTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const tabKeys: Array<{ name: string; label: string; key: 'home' | 'inventory' | 'maintenance' | 'documents' | 'household' }> = [
    { name: 'index', label: 'Home', key: 'home' },
    { name: 'inventory', label: 'Inventory', key: 'inventory' },
    { name: 'maintenance', label: 'Tasks', key: 'maintenance' },
    { name: 'documents', label: 'Docs', key: 'documents' },
    { name: 'household', label: 'Household', key: 'household' },
  ];

  return (
    <View style={[styles.tabBar, { paddingBottom: 10 + insets.bottom }]}>
      {tabKeys.map((tab, index) => {
        const isActive = state.index === index;
        const route = state.routes[index];

        return (
          <Pressable
            key={tab.name}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route?.key ?? '',
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) {
                navigation.navigate(tab.name);
              }
            }}
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
          >
            <TabIcon tabKey={tab.key} color={isActive ? colors.green : colors.muted} />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.page,
  },
  topBar: {
    minHeight: 76,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appName: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '800',
  },
  homeLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: colors.ink,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '400',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '500',
  },
  sampleBanner: {
    backgroundColor: colors.amberSoft,
    borderBottomColor: colors.amber,
    borderBottomWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  sampleBannerText: {
    color: colors.amber,
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    minHeight: 74,
    paddingHorizontal: 10,
    paddingTop: 8,
    backgroundColor: colors.panel,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 6,
  },
  tabButton: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabButtonActive: {
    backgroundColor: colors.greenSoft,
  },
  tabLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
  },
  tabLabelActive: {
    color: colors.green,
  },
});
