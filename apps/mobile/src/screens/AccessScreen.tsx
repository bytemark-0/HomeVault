import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AccessItem } from '@homevault/domain';
import type { AssetListItem, DocumentListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';
import { getAccessPreviewDisclosure } from '../utils/accessSensitivity';
import { formatDateLabel } from '../utils/taskUtils';

type AccessScreenProps = {
  accessItems: AccessItem[];
  assets: AssetListItem[];
  documents: DocumentListItem[];
  onAddAccess: (category?: AccessItem['category']) => void;
  onAccessItemPress: (accessItemId: string) => void;
  onShareAccessItem?: (accessItemId: string) => void;
  onViewDevices: () => void;
  onViewDocuments: () => void;
};

const categoryFilters: Array<{ value: AccessItem['category'] | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'router', label: 'Router' },
  { value: 'garage', label: 'Garage' },
  { value: 'alarm', label: 'Alarm' },
  { value: 'safe', label: 'Safe' },
  { value: 'utility_shutoff', label: 'Shutoff' },
  { value: 'lockbox', label: 'Lockbox' },
  { value: 'entry_note', label: 'Entry note' },
];

export function AccessScreen({
  accessItems,
  assets,
  documents,
  onAddAccess,
  onAccessItemPress,
  onShareAccessItem,
  onViewDevices,
  onViewDocuments,
}: AccessScreenProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<AccessItem['category'] | 'all'>('all');

  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  const documentById = new Map(documents.map((document) => [document.id, document]));
  const filteredAccessItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return accessItems.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const searchableText = [
        item.label,
        item.username ?? '',
        item.accessCode ?? '',
        item.location ?? '',
        item.instructions ?? '',
        item.notes ?? '',
        formatAccessCategory(item.category),
      ]
        .join(' ')
        .toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [accessItems, activeCategory, query]);

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Access</Text>
        <Text style={styles.title}>Codes, logins, and entry notes</Text>
        <Text style={styles.subtitle}>
          Save the details someone needs to get inside, get online, or get systems back up fast.
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{accessItems.length}</Text>
          <Text style={styles.summaryLabel}>access records</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {accessItems.filter((item) => item.lastVerifiedAt).length}
          </Text>
          <Text style={styles.summaryLabel}>recently verified</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={() => onAddAccess('wifi')}
          style={[styles.actionCard, styles.actionCardPrimary]}
          accessibilityRole="button"
        >
          <Text style={styles.actionTitlePrimary}>Save Wi-Fi</Text>
          <Text style={styles.actionDetailPrimary}>Network name, password, and router location.</Text>
        </Pressable>
        <Pressable
          onPress={() => onAddAccess('garage')}
          style={styles.actionCard}
          accessibilityRole="button"
        >
          <Text style={styles.actionTitle}>Add access code</Text>
          <Text style={styles.actionDetail}>Garage, alarm, lockbox, safe, or entry instructions.</Text>
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          accessibilityLabel="Search access records"
          placeholder="Search labels, codes, locations, or notes"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {categoryFilters.map((filter) => {
          const isActive = filter.value === activeCategory;

          return (
            <Pressable
              key={filter.value}
              onPress={() => setActiveCategory(filter.value)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              accessibilityRole="button"
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Access records</Text>
        <Pressable onPress={() => onAddAccess()} accessibilityRole="button">
          <Text style={styles.sectionAction}>Add record</Text>
        </Pressable>
      </View>

      {accessItems.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>Save the first access record</Text>
          <Text style={styles.emptyText}>
            This is where Wi-Fi details, router logins, garage codes, alarm steps, and anything
            else a backup helper needs should live.
          </Text>
          <View style={styles.emptyActions}>
            <Pressable onPress={() => onAddAccess('wifi')} style={styles.emptyAction} accessibilityRole="button">
              <Text style={styles.emptyActionText}>Save Wi-Fi</Text>
            </Pressable>
            <Pressable onPress={() => onAddAccess('alarm')} style={styles.emptySecondaryAction} accessibilityRole="button">
              <Text style={styles.emptySecondaryActionText}>Add alarm code</Text>
            </Pressable>
          </View>
        </View>
      ) : filteredAccessItems.length > 0 ? (
        filteredAccessItems.map((item) => {
          const linkedAsset = item.linkedAssetId ? assetById.get(item.linkedAssetId) : null;
          const linkedDocumentCount = item.linkedDocumentIds.filter((id) => documentById.has(id)).length;
          const previewDisclosure = getAccessPreviewDisclosure(item);

          return (
            <View key={item.id} style={styles.recordCard}>
              <Pressable
                onPress={() => onAccessItemPress(item.id)}
                style={styles.recordMainButton}
                accessibilityRole="button"
              >
                <View style={styles.recordHeader}>
                  <Text style={styles.recordTitle}>{item.label}</Text>
                  <Text style={styles.recordCategory}>{formatAccessCategory(item.category)}</Text>
                </View>
                {previewDisclosure ? (
                  <View style={styles.sensitiveNotice}>
                    <Text style={styles.sensitiveNoticeTitle}>{previewDisclosure.summary}</Text>
                    <Text style={styles.sensitiveNoticeDetail}>{previewDisclosure.detail}</Text>
                  </View>
                ) : (
                  <Text style={styles.recordNote}>No sensitive details stored in this record.</Text>
                )}
                <View style={styles.recordFooter}>
                  <Text style={styles.recordMeta}>
                    {item.lastVerifiedAt
                      ? `Last checked ${formatDateLabel(item.lastVerifiedAt.slice(0, 10))}`
                      : 'Needs verification'}
                  </Text>
                  <Text style={styles.recordMeta}>
                    {linkedAsset
                      ? `Linked device: ${linkedAsset.name}`
                      : linkedDocumentCount > 0
                        ? `${linkedDocumentCount} linked record${linkedDocumentCount === 1 ? '' : 's'}`
                        : 'Standalone record'}
                  </Text>
                </View>
              </Pressable>
              {onShareAccessItem ? (
                <View style={styles.recordActionRow}>
                  <Pressable
                    onPress={() => onShareAccessItem(item.id)}
                    style={styles.shareButton}
                    accessibilityRole="button"
                  >
                    <Text style={styles.shareButtonText}>Share item</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>No access records found</Text>
          <Text style={styles.emptyText}>Try another search or category filter.</Text>
        </View>
      )}

      <View style={styles.supportRow}>
        <Pressable onPress={onViewDevices} style={styles.supportCard} accessibilityRole="button">
          <Text style={styles.supportTitle}>Review devices</Text>
          <Text style={styles.supportDetail}>Link access notes to routers, alarms, and key hardware.</Text>
        </Pressable>
        <Pressable onPress={onViewDocuments} style={styles.supportCard} accessibilityRole="button">
          <Text style={styles.supportTitle}>Open documents</Text>
          <Text style={styles.supportDetail}>Attach manuals, policies, and printed instructions.</Text>
        </Pressable>
      </View>
    </View>
  );
}

function formatAccessCategory(category: AccessItem['category']) {
  switch (category) {
    case 'wifi':
      return 'Wi-Fi';
    case 'router':
      return 'Router';
    case 'utility_shutoff':
      return 'Utility shutoff';
    case 'entry_note':
      return 'Entry note';
    case 'lockbox':
      return 'Lockbox';
    default:
      return category.replaceAll('_', ' ');
  }
}

const styles = StyleSheet.create({
  screen: {
    gap: 14,
  },
  hero: {
    gap: 6,
  },
  kicker: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 2,
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  actionsRow: {
    gap: 10,
  },
  actionCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 4,
  },
  actionCardPrimary: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  actionTitle: {
    color: colors.blue,
    fontSize: 15,
    fontWeight: '900',
  },
  actionDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  actionTitlePrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  actionDetailPrimary: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  searchBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 8,
  },
  searchInput: {
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.page,
    paddingHorizontal: 12,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  filterRow: {
    gap: 8,
  },
  filterPill: {
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  filterText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  filterTextActive: {
    color: colors.green,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionAction: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  recordCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 6,
  },
  recordMainButton: {
    gap: 6,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  recordTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
  },
  recordCategory: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  recordDetail: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  sensitiveNotice: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.page,
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 3,
  },
  sensitiveNoticeTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  sensitiveNoticeDetail: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  recordNote: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  recordFooter: {
    gap: 2,
    marginTop: 2,
  },
  recordMeta: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  recordActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  shareButton: {
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  emptyPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 8,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  emptyActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  emptyAction: {
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: colors.green,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  emptySecondaryAction: {
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySecondaryActionText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  supportRow: {
    gap: 10,
  },
  supportCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 4,
  },
  supportTitle: {
    color: colors.blue,
    fontSize: 15,
    fontWeight: '900',
  },
  supportDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
});
