import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type {
  AssetListItem,
  RepairEventListItem,
  RoomListItem,
  TaskCompletionListItem,
  TaskListItem,
} from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';
import { formatCurrency } from '../utils/taskUtils';

type CostSummaryScreenProps = {
  repairEvents: RepairEventListItem[];
  taskCompletions: TaskCompletionListItem[];
  tasks: TaskListItem[];
  assets: AssetListItem[];
  rooms: RoomListItem[];
  onBack: () => void;
  onAssetPress?: (assetId: string) => void;
  onRoomPress?: (roomId: string) => void;
};

type CostGroup = {
  id: string;
  label: string;
  totalCents: number;
  totalLabel: string;
  count: number;
};

const dimensionFilters = ['By year', 'By room', 'By asset', 'By category'] as const;
type DimensionFilter = (typeof dimensionFilters)[number];

export function CostSummaryScreen({
  repairEvents,
  taskCompletions,
  tasks,
  assets,
  rooms,
  onBack,
  onAssetPress,
  onRoomPress,
}: CostSummaryScreenProps) {
  const [dimension, setDimension] = useState<DimensionFilter>('By year');

  const groups = useMemo<CostGroup[]>(() => {
    const taskById = new Map(tasks.map((t) => [t.id, t]));
    const assetById = new Map(assets.map((a) => [a.id, a]));
    const roomById = new Map(rooms.map((r) => [r.id, r]));

    type RawCostItem = {
      costCents: number;
      year: string;
      assetId: string | null;
      roomId: string | null;
      category: string | null;
    };

    const costItems: RawCostItem[] = [
      ...repairEvents.map((r) => {
        const asset = assetById.get(r.assetId);

        return {
          costCents: r.costCents ?? 0,
          year: r.date.slice(0, 4),
          assetId: r.assetId,
          roomId: asset?.roomId ?? null,
          category: asset?.category ?? null,
        };
      }),
      ...taskCompletions.map((c) => {
        const task = taskById.get(c.taskId);
        const assetId = task?.scope === 'asset' ? task.scopeId : null;
        const roomId =
          task?.scope === 'room'
            ? task.scopeId
            : assetId
              ? (assetById.get(assetId)?.roomId ?? null)
              : null;
        const asset = assetId ? assetById.get(assetId) : null;

        return {
          costCents: c.costCents ?? 0,
          year: c.completedAt.slice(0, 4),
          assetId,
          roomId,
          category: asset?.category ?? null,
        };
      }),
    ].filter((item) => item.costCents > 0);

    const accumulate = (getKey: (item: RawCostItem) => string | null, getLabel: (key: string) => string) => {
      const map = new Map<string, { totalCents: number; count: number }>();

      for (const item of costItems) {
        const key = getKey(item) ?? 'unknown';
        const existing = map.get(key);

        if (existing) {
          existing.totalCents += item.costCents;
          existing.count += 1;
        } else {
          map.set(key, { totalCents: item.costCents, count: 1 });
        }
      }

      return Array.from(map.entries())
        .map(([key, { totalCents, count }]) => ({
          id: key,
          label: getLabel(key),
          totalCents,
          totalLabel: formatCurrency(totalCents),
          count,
        }))
        .sort((a, b) => b.totalCents - a.totalCents);
    };

    if (dimension === 'By year') {
      return accumulate(
        (item) => item.year,
        (key) => key,
      ).sort((a, b) => b.label.localeCompare(a.label));
    }

    if (dimension === 'By room') {
      return accumulate(
        (item) => item.roomId,
        (key) => (key === 'unknown' ? 'Household / unscoped' : (roomById.get(key)?.name ?? key)),
      );
    }

    if (dimension === 'By asset') {
      return accumulate(
        (item) => item.assetId,
        (key) => (key === 'unknown' ? 'Household / unscoped' : (assetById.get(key)?.name ?? key)),
      );
    }

    return accumulate(
      (item) => item.category,
      (key) => (key === 'unknown' ? 'Uncategorized' : key),
    );
  }, [assets, dimension, repairEvents, rooms, taskCompletions, tasks]);

  const totalCents = useMemo(
    () => groups.reduce((sum, g) => sum + g.totalCents, 0),
    [groups],
  );

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
          <Text style={styles.title}>Cost summary</Text>
        </View>
      </View>

      <View style={styles.totalPanel}>
        <Text style={styles.totalLabel}>Total tracked</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalCents)}</Text>
        <Text style={styles.totalMeta}>Repairs and completed maintenance</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {dimensionFilters.map((dim) => (
          <Pressable
            key={dim}
            onPress={() => setDimension(dim)}
            style={[styles.filterPill, dimension === dim && styles.filterPillActive]}
            accessibilityRole="button"
          >
            <Text style={[styles.filterText, dimension === dim && styles.filterTextActive]}>
              {dim}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {groups.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>No cost data</Text>
          <Text style={styles.emptyText}>
            Record costs when completing tasks or logging repairs to see a breakdown here.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {groups.map((group, index) => {
            const pct = totalCents > 0 ? group.totalCents / totalCents : 0;
            const isLast = index === groups.length - 1;
            const handlePress =
              dimension === 'By asset' && group.id !== 'unknown' && onAssetPress
                ? () => onAssetPress(group.id)
                : dimension === 'By room' && group.id !== 'unknown' && onRoomPress
                  ? () => onRoomPress(group.id)
                  : undefined;
            const rowContent = (
              <>
                <View style={styles.groupMeta}>
                  <Text style={styles.groupLabel}>{group.label}</Text>
                  <Text style={styles.groupCount}>
                    {group.count} {group.count === 1 ? 'event' : 'events'}
                  </Text>
                </View>
                <View style={styles.groupRight}>
                  <Text style={[styles.groupTotal, handlePress && styles.groupTotalLink]}>{group.totalLabel}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` }]} />
                  </View>
                </View>
              </>
            );

            if (handlePress) {
              return (
                <Pressable
                  key={group.id}
                  onPress={handlePress}
                  style={[styles.groupRow, isLast && styles.groupRowLast]}
                  accessibilityRole="button"
                >
                  {rowContent}
                </Pressable>
              );
            }

            return (
              <View
                key={group.id}
                style={[styles.groupRow, isLast && styles.groupRowLast]}
              >
                {rowContent}
              </View>
            );
          })}
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
  totalPanel: {
    borderRadius: 8,
    backgroundColor: colors.ink,
    padding: 18,
    gap: 4,
  },
  totalLabel: {
    color: colors.greenSoft,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  totalValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 0,
  },
  totalMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  filterScroll: {
    flexGrow: 0,
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
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  groupRowLast: {
    borderBottomWidth: 0,
  },
  groupMeta: {
    flex: 1,
    gap: 3,
  },
  groupLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  groupCount: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  groupRight: {
    alignItems: 'flex-end',
    gap: 6,
    minWidth: 80,
  },
  groupTotal: {
    color: colors.green,
    fontSize: 16,
    fontWeight: '900',
  },
  groupTotalLink: {
    textDecorationLine: 'underline',
  },
  barTrack: {
    width: 80,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.green,
  },
});
