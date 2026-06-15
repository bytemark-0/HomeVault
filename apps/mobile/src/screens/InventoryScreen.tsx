import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AssetRow } from '../components/AssetRow';
import { SectionTitle } from '../components/SectionTitle';
import type { AssetListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type InventoryScreenProps = {
  assets: AssetListItem[];
  onAddAsset: () => void;
  onAssetPress: (assetId: string) => void;
};

export function InventoryScreen({ assets, onAddAsset, onAssetPress }: InventoryScreenProps) {
  const [query, setQuery] = useState('');
  const [activeRoom, setActiveRoom] = useState('All');

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
          placeholder="Search model, serial, room, document"
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

      <SectionTitle title="Inventory" action="Add asset" onActionPress={onAddAsset} />
      {assets.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>Start with one asset</Text>
          <Text style={styles.emptyText}>
            Add an appliance, system, fixture, or exterior item so documents and tasks have a home.
          </Text>
          <Pressable onPress={onAddAsset} style={styles.emptyAction} accessibilityRole="button">
            <Text style={styles.emptyActionText}>Add asset</Text>
          </Pressable>
        </View>
      ) : filteredAssets.length > 0 ? (
        filteredAssets.map((asset) => (
          <AssetRow key={asset.id} asset={asset} onPress={() => onAssetPress(asset.id)} />
        ))
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>No assets found</Text>
          <Text style={styles.emptyText}>Try another search or room filter.</Text>
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
});
