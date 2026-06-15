import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AssetRow } from '../components/AssetRow';
import { MetricCard } from '../components/MetricCard';
import { SectionTitle } from '../components/SectionTitle';
import { TaskRow } from '../components/TaskRow';
import type {
  AssetListItem,
  HomeActivityItem,
  TaskListItem,
} from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type HomeScreenProps = {
  activeTasks: number;
  assetCount: number;
  documentCount: number;
  healthScore: number;
  recentActivity: HomeActivityItem[];
  roomCount: number;
  savedCostLabel: string;
  dueTasks: TaskListItem[];
  onActivityPress: (activity: HomeActivityItem) => void;
  onAssetPress: (assetId: string) => void;
  onTaskPress: (taskId: string) => void;
  onViewCostSummary: () => void;
  onViewInventory: () => void;
  onViewMaintenance: () => void;
  onViewServiceHistory: () => void;
  recentAssets: AssetListItem[];
};

export function HomeScreen({
  activeTasks,
  assetCount,
  documentCount,
  healthScore,
  recentActivity,
  roomCount,
  savedCostLabel,
  dueTasks,
  onActivityPress,
  onAssetPress,
  onTaskPress,
  onViewCostSummary,
  onViewInventory,
  onViewMaintenance,
  onViewServiceHistory,
  recentAssets,
}: HomeScreenProps) {
  const heroTitle =
    activeTasks > 0
      ? `${activeTasks} ${activeTasks === 1 ? 'task needs' : 'tasks need'} eyes today`
      : 'Your home is caught up';

  return (
    <View style={styles.screen}>
      <View style={styles.summaryPanel}>
        <View>
          <Text style={styles.kicker}>Home health</Text>
          <Text style={styles.heroTitle}>{heroTitle}</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreValue}>{healthScore}</Text>
          <Text style={styles.scoreLabel}>Score</Text>
        </View>
      </View>

      <View style={styles.metricGrid}>
        <MetricCard label="Assets" value={String(assetCount)} detail={`${roomCount} rooms`} />
        <MetricCard label="Documents" value={String(documentCount)} detail="Receipts, manuals" />
        <MetricCard label="Open tasks" value={String(activeTasks)} detail="Local reminders" />
        <MetricCard label="Tracked costs" value={savedCostLabel} detail="Repairs, service" onPress={onViewCostSummary} />
      </View>

      <SectionTitle title="Due now" action="View all" onActionPress={onViewMaintenance} />
      {dueTasks.length > 0 ? (
        dueTasks.map((task) => <TaskRow key={task.id} task={task} onPress={onTaskPress} />)
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>No urgent tasks</Text>
          <Text style={styles.emptyText}>Upcoming work stays in the maintenance list.</Text>
        </View>
      )}

      <SectionTitle title="Recent activity" action="View all" onActionPress={onViewServiceHistory} />
      {recentActivity.length > 0 ? (
        recentActivity.map((activity) => (
          <Pressable
            key={activity.id}
            onPress={() => onActivityPress(activity)}
            style={styles.activityRow}
            accessibilityRole="button"
          >
            <View style={styles.activityDot} />
            <View style={styles.activityBody}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDetail}>{activity.detail}</Text>
              </View>
              <Text style={styles.activityMeta}>{activity.meta}</Text>
            </View>
          </Pressable>
        ))
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptyText}>Documents, repairs, and completed tasks will appear here.</Text>
        </View>
      )}

      <SectionTitle title="Recent records" action="Search" onActionPress={onViewInventory} />
      {recentAssets.length > 0 ? (
        recentAssets.map((asset) => (
          <AssetRow key={asset.id} asset={asset} onPress={() => onAssetPress(asset.id)} />
        ))
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>No asset records yet</Text>
          <Text style={styles.emptyText}>
            Add an asset from Inventory to start building the household record.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 14,
  },
  summaryPanel: {
    backgroundColor: colors.ink,
    borderRadius: 8,
    padding: 18,
    minHeight: 142,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  kicker: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: 0,
    maxWidth: 210,
    marginTop: 12,
  },
  scoreBadge: {
    width: 78,
    height: 78,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    color: colors.green,
    fontSize: 28,
    fontWeight: '900',
  },
  scoreLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  activityRow: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
  },
  activityDot: {
    width: 10,
    borderRadius: 5,
    backgroundColor: colors.green,
  },
  activityBody: {
    flex: 1,
    gap: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  activityTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
  },
  activityDetail: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 19,
    textAlign: 'right',
  },
  activityMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  emptyPanel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 4,
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
});
