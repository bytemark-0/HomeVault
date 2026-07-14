import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AssetRow } from '../components/AssetRow';
import { SectionTitle } from '../components/SectionTitle';
import type { AssetListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';
import { DEVICE_TEMPLATES, type DeviceTemplateKey } from '../utils/deviceMetadata';

type InventoryScreenProps = {
  assets: AssetListItem[];
  onAddAsset: () => void;
  onAssetPress: (assetId: string) => void;
  onShareAsset?: (assetId: string) => void;
  mode?: 'inventory' | 'device';
  onQuickAddTemplate?: (templateKey: DeviceTemplateKey) => void;
};

export function InventoryScreen({
  assets,
  onAddAsset,
  onAssetPress,
  onShareAsset,
  mode = 'inventory',
  onQuickAddTemplate,
}: InventoryScreenProps) {
  const [query, setQuery] = useState('');
  const [activeRoom, setActiveRoom] = useState('All');
  const isDeviceMode = mode === 'device';

  const roomFilters = useMemo(
    () => ['All', ...Array.from(new Set(assets.map((asset) => asset.roomName))).sort()],
    [assets],
  );

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return assets
      .filter((asset) => {
        const matchesRoom = activeRoom === 'All' || asset.roomName === activeRoom;
        const searchableText = [
          asset.name,
          asset.category,
          asset.roomName,
          asset.brand ?? '',
          asset.model ?? '',
          asset.serial ?? '',
          asset.ownerName ?? '',
          asset.networkName ?? '',
          asset.internetProvider ?? '',
          asset.notes ?? '',
          `${asset.documentCount} docs`,
        ]
          .join(' ')
          .toLowerCase();
        const matchesQuery = normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

        return matchesRoom && matchesQuery;
      })
      .sort((a, b) => {
        if (a.status !== 'ready' && b.status === 'ready') return -1;
        if (a.status === 'ready' && b.status !== 'ready') return 1;
        return a.name.localeCompare(b.name);
      });
  }, [activeRoom, assets, query]);

  return (
    <View style={styles.screen}>
      <View style={styles.searchBox}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={
            isDeviceMode
              ? 'Search device, owner, serial, network'
              : 'Search model, serial, room, document'
          }
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterRow}>
        {roomFilters.map((filter) => {
          const isActive = filter === activeRoom;

          return (
            <Pressable
              key={filter}
              onPress={() => setActiveRoom(filter)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              accessibilityRole="button"
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isDeviceMode && onQuickAddTemplate ? (
        <View style={styles.quickAddPanel}>
          <Text style={styles.quickAddTitle}>Quick add</Text>
          <Text style={styles.quickAddText}>
            Start with the router, primary phones, laptops, and smart-home gear someone would look
            for first during an outage or handoff.
          </Text>
          <View style={styles.filterRow}>
            {DEVICE_TEMPLATES.map((template) => (
              <Pressable
                key={template.key}
                onPress={() => onQuickAddTemplate(template.key)}
                style={styles.quickAddPill}
                accessibilityRole="button"
              >
                <Text style={styles.quickAddPillText}>{template.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <SectionTitle
        title={isDeviceMode ? 'Critical devices' : 'Home equipment'}
        action={isDeviceMode ? 'Add device' : 'Add asset'}
        onActionPress={onAddAsset}
      />
      {assets.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>
            {isDeviceMode ? 'Start with one essential device' : 'Start with one essential device or system'}
          </Text>
          <Text style={styles.emptyText}>
            {isDeviceMode
              ? 'Add the router, primary phone, laptop, tablet, or smart-home gear that someone would need to recover quickly.'
              : 'Add the router, HVAC, water heater, garage opener, or another critical item so the household guide can connect records to the right equipment.'}
          </Text>
          <Pressable onPress={onAddAsset} style={styles.emptyAction} accessibilityRole="button">
            <Text style={styles.emptyActionText}>{isDeviceMode ? 'Add device' : 'Add asset'}</Text>
          </Pressable>
        </View>
      ) : filteredAssets.length > 0 ? (
        filteredAssets.map((asset) => (
          <AssetRow
            key={asset.id}
            asset={asset}
            onPress={() => onAssetPress(asset.id)}
            onSecondaryAction={
              isDeviceMode && onShareAsset ? () => onShareAsset(asset.id) : undefined
            }
            secondaryActionLabel={isDeviceMode && onShareAsset ? 'Share device' : undefined}
            variant={isDeviceMode ? 'device' : 'inventory'}
          />
        ))
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>
            {isDeviceMode ? 'No devices found' : 'No assets found'}
          </Text>
          <Text style={styles.emptyText}>Try another search or area filter.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 14,
  },
  searchBox: {
    minHeight: 48,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  searchInput: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  filterText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  emptyPanel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 8,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  emptyAction: {
    alignSelf: 'flex-start',
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  quickAddPanel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 10,
  },
  quickAddTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  quickAddText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  quickAddPill: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddPillText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
});
