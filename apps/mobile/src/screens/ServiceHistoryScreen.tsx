import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type {
  AssetListItem,
  RepairEventListItem,
  TaskCompletionListItem,
  TaskListItem,
} from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type ServiceHistoryScreenProps = {
  repairEvents: RepairEventListItem[];
  taskCompletions: TaskCompletionListItem[];
  tasks: TaskListItem[];
  assets: AssetListItem[];
  onBack: () => void;
  onAssetPress: (assetId: string) => void;
};

type ServiceItem = {
  id: string;
  kind: 'maintenance' | 'repair';
  title: string;
  scopeLabel: string;
  assetId: string | null;
  costLabel: string;
  dateLabel: string;
  dateSort: string;
};

const kindFilters = ['All', 'Maintenance', 'Repairs'] as const;
type KindFilter = (typeof kindFilters)[number];

export function ServiceHistoryScreen({
  repairEvents,
  taskCompletions,
  tasks,
  assets,
  onBack,
  onAssetPress,
}: ServiceHistoryScreenProps) {
  const [activeKind, setActiveKind] = useState<KindFilter>('All');

  const items = useMemo<ServiceItem[]>(() => {
    const taskById = new Map(tasks.map((t) => [t.id, t]));
    const assetById = new Map(assets.map((a) => [a.id, a]));

    const completionItems: ServiceItem[] = taskCompletions.map((c) => {
      const task = taskById.get(c.taskId);
      const assetId = task?.scope === 'asset' ? task.scopeId : null;
      const assetName = assetId ? (assetById.get(assetId)?.name ?? 'Unknown asset') : null;

      return {
        id: `c-${c.id}`,
        kind: 'maintenance',
        title: task?.title ?? 'Maintenance completed',
        scopeLabel: assetName ?? task?.scopeLabel ?? 'Household',
        assetId,
        costLabel: c.costLabel,
        dateLabel: c.completedAtLabel,
        dateSort: c.completedAt,
      };
    });

    const repairItems: ServiceItem[] = repairEvents.map((r) => {
      const asset = assetById.get(r.assetId);

      return {
        id: `r-${r.id}`,
        kind: 'repair',
        title: r.issue,
        scopeLabel: asset?.name ?? 'Unknown asset',
        assetId: r.assetId,
        costLabel: r.costLabel,
        dateLabel: r.dateLabel,
        dateSort: r.date,
      };
    });

    return [...completionItems, ...repairItems].sort((a, b) =>
      b.dateSort.localeCompare(a.dateSort),
    );
  }, [assets, repairEvents, taskCompletions, tasks]);

  const filteredItems = useMemo(() => {
    if (activeKind === 'All') return items;
    if (activeKind === 'Maintenance') return items.filter((i) => i.kind === 'maintenance');
    return items.filter((i) => i.kind === 'repair');
  }, [activeKind, items]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.secondaryButton} accessibilityRole="button">
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <View style={styles.headerTitle}>
          <Text style={styles.kicker}>Household</Text>
          <Text style={styles.title}>Service history</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {kindFilters.map((kind) => (
          <Pressable
            key={kind}
            onPress={() => setActiveKind(kind)}
            style={[styles.filterPill, activeKind === kind && styles.filterPillActive]}
            accessibilityRole="button"
          >
            <Text style={[styles.filterText, activeKind === kind && styles.filterTextActive]}>
              {kind}
            </Text>
          </Pressable>
        ))}
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>No service history</Text>
          <Text style={styles.emptyText}>
            Completed tasks and recorded repairs will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredItems.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                if (item.assetId) {
                  onAssetPress(item.assetId);
                }
              }}
              style={styles.itemRow}
              accessibilityRole={item.assetId ? 'button' : 'text'}
            >
              <View
                style={[
                  styles.kindBadge,
                  item.kind === 'repair' ? styles.repairBadge : styles.maintenanceBadge,
                ]}
              >
                <Text
                  style={[
                    styles.kindText,
                    item.kind === 'repair' ? styles.repairText : styles.maintenanceText,
                  ]}
                >
                  {item.kind === 'repair' ? 'Repair' : 'Maintenance'}
                </Text>
              </View>
              <View style={styles.itemBody}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemDate}>{item.dateLabel}</Text>
                </View>
                <Text style={styles.itemMeta}>
                  {item.scopeLabel}
                  {item.costLabel !== '$0' ? ` · ${item.costLabel}` : ''}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.page,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 14,
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    flex: 1,
  },
  secondaryButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  kicker: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
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
    gap: 6,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  list: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  kindBadge: {
    minWidth: 84,
    minHeight: 26,
    paddingHorizontal: 8,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 1,
  },
  maintenanceBadge: {
    backgroundColor: colors.greenSoft,
  },
  repairBadge: {
    backgroundColor: colors.amberSoft,
  },
  kindText: {
    fontSize: 11,
    fontWeight: '900',
  },
  maintenanceText: {
    color: colors.green,
  },
  repairText: {
    color: colors.amber,
  },
  itemBody: {
    flex: 1,
    gap: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  itemTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
  },
  itemDate: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 19,
    textAlign: 'right',
  },
  itemMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
});
