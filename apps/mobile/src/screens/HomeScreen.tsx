import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

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
  propertyLabel: string;
  propertyPhotoUri?: string;
  activeTasks: number;
  assetCount: number;
  documentCount: number;
  healthScore: number;
  recentActivity: HomeActivityItem[];
  roomCount: number;
  savedCostLabel: string;
  dueTasks: TaskListItem[];
  warrantyAlerts: AssetListItem[];
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
  propertyLabel,
  propertyPhotoUri,
  activeTasks,
  assetCount,
  documentCount,
  healthScore,
  recentActivity,
  roomCount,
  savedCostLabel,
  dueTasks,
  warrantyAlerts,
  onActivityPress,
  onAssetPress,
  onTaskPress,
  onViewCostSummary,
  onViewInventory,
  onViewMaintenance,
  onViewServiceHistory,
  recentAssets,
}: HomeScreenProps) {
  const isEmpty = assetCount === 0 && documentCount === 0 && activeTasks === 0;

  const subtitle =
    isEmpty
      ? 'Start building your home record'
      : activeTasks > 0
        ? `${activeTasks} ${activeTasks === 1 ? 'task needs' : 'tasks need'} attention`
        : 'Your home is caught up';

  return (
    <View style={styles.screen}>
      {/* Property identity header — NX-602 */}
      <View style={styles.propertyHeader}>
        {propertyPhotoUri ? (
          <Image
            source={{ uri: propertyPhotoUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            accessibilityLabel="Property photo"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.propertyHeaderFallback]} />
        )}
        <View style={styles.propertyHeaderOverlay} />
        <View style={styles.propertyHeaderContent}>
          <View style={styles.propertyHeaderText}>
            <Text style={styles.propertyName} numberOfLines={2}>{propertyLabel}</Text>
            <Text style={styles.propertySubtitle}>{subtitle}</Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreValue}>{healthScore}</Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>
        </View>
      </View>

      {/* Metric grid — only shown once there's data worth summarising */}
      {!isEmpty ? (
        <View style={styles.metricGrid}>
          <MetricCard label="Assets" value={String(assetCount)} detail={`${roomCount} rooms`} />
          <MetricCard label="Documents" value={String(documentCount)} detail="Receipts, manuals" />
          <MetricCard label="Open tasks" value={String(activeTasks)} detail="Local reminders" />
          <MetricCard label="Tracked costs" value={savedCostLabel} detail="Repairs, service" onPress={onViewCostSummary} accessibilityLabel="View cost summary" />
        </View>
      ) : null}

      <SectionTitle title="Due now" action="View all" onActionPress={onViewMaintenance} />
      {dueTasks.length > 0 ? (
        dueTasks.map((task) => <TaskRow key={task.id} task={task} onPress={onTaskPress} />)
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>No urgent tasks</Text>
          <Text style={styles.emptyText}>Upcoming work stays in the maintenance list.</Text>
        </View>
      )}

      {warrantyAlerts.length > 0 && (
        <>
          <SectionTitle title="Warranties expiring" action="View all" onActionPress={onViewInventory} />
          {warrantyAlerts.map((asset) => (
            <Pressable
              key={asset.id}
              onPress={() => onAssetPress(asset.id)}
              style={styles.warrantyRow}
              accessibilityRole="button"
            >
              <View style={styles.warrantyDot} />
              <View style={styles.warrantyBody}>
                <Text style={styles.warrantyTitle}>{asset.name}</Text>
                <Text style={styles.warrantyMeta}>
                  {asset.warrantyExpiryLabel ?? 'Expiring soon'} · {asset.roomName}
                </Text>
              </View>
              <Text style={styles.warrantyChevron}>›</Text>
            </Pressable>
          ))}
        </>
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
  propertyHeader: {
    borderRadius: 12,
    minHeight: 160,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  propertyHeaderFallback: {
    backgroundColor: colors.ink,
  },
  propertyHeaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.40)',
  },
  propertyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  propertyHeaderText: {
    flex: 1,
    gap: 4,
  },
  propertyName: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  propertySubtitle: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  scoreBadge: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    color: colors.green,
    fontSize: 26,
    fontWeight: '900',
  },
  scoreLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  warrantyRow: {
    backgroundColor: colors.panel,
    borderColor: colors.amber,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  warrantyDot: {
    width: 10,
    borderRadius: 5,
    alignSelf: 'stretch',
    backgroundColor: colors.amber,
  },
  warrantyBody: {
    flex: 1,
    gap: 3,
  },
  warrantyTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
  },
  warrantyMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  warrantyChevron: {
    color: colors.muted,
    fontSize: 18,
    fontWeight: '500',
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
