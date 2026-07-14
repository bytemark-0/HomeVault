import { useEffect, useState } from 'react';
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

type HomeStatusCard = {
  key: string;
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'success' | 'warning';
};

type HomeQuickAction = {
  key: string;
  label: string;
  detail: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary';
};

type HomeNextOpportunity = {
  label: string;
  detail: string;
  impactLabel: string;
  onPress: () => void;
};

type HomePayoffCard = {
  key: string;
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'success';
};

type HomeScreenProps = {
  propertyLabel: string;
  propertyPhotoUri?: string;
  activeTasks: number;
  assetCount: number;
  documentCount: number;
  readinessScore: number | null;
  recentActivity: HomeActivityItem[];
  roomCount: number;
  savedCostLabel: string;
  dueTasks: TaskListItem[];
  warrantyAlerts: AssetListItem[];
  onActivityPress: (activity: HomeActivityItem) => void;
  onAssetPress: (assetId: string) => void;
  onTaskPress: (taskId: string) => void;
  onViewCostSummary: () => void;
  onViewDevices: () => void;
  onViewMaintenance: () => void;
  onViewServiceHistory: () => void;
  nextOpportunity?: HomeNextOpportunity | null;
  payoffCards?: HomePayoffCard[];
  recentAssets: AssetListItem[];
  quickActions: HomeQuickAction[];
  statusCards: HomeStatusCard[];
};

export function HomeScreen({
  propertyLabel,
  propertyPhotoUri,
  activeTasks,
  assetCount,
  documentCount,
  readinessScore,
  recentActivity,
  roomCount,
  savedCostLabel,
  dueTasks,
  warrantyAlerts,
  onActivityPress,
  onAssetPress,
  onTaskPress,
  onViewCostSummary,
  onViewDevices,
  onViewMaintenance,
  onViewServiceHistory,
  nextOpportunity = null,
  payoffCards = [],
  recentAssets,
  quickActions,
  statusCards,
}: HomeScreenProps) {
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    setPhotoError(false);
  }, [propertyPhotoUri]);

  const isEmpty = assetCount === 0 && documentCount === 0 && activeTasks === 0;

  const subtitle =
    isEmpty
      ? 'Start building the household guide'
      : activeTasks > 0
        ? `${activeTasks} ${activeTasks === 1 ? 'readiness step needs' : 'readiness steps need'} attention`
        : 'Your household guide is ready for now';

  return (
    <View style={styles.screen}>
      {/* Property identity header — NX-602 */}
      <View style={styles.propertyHeader}>
        {propertyPhotoUri && !photoError ? (
          <Image
            source={{ uri: propertyPhotoUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            accessibilityLabel="Property photo"
            onError={() => setPhotoError(true)}
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
            {readinessScore !== null ? (
              <>
                <Text style={styles.scoreValue}>{readinessScore}</Text>
                <Text style={styles.scoreLabel}>Ready</Text>
              </>
            ) : (
              <>
                <Text style={styles.scoreValueEmpty}>—</Text>
                <Text style={styles.scoreLabel}>Not rated</Text>
              </>
            )}
          </View>
        </View>
      </View>

      <View style={styles.statusGrid}>
        {statusCards.map((card) => (
          <View
            key={card.key}
            style={[
              styles.statusCard,
              card.tone === 'success' ? styles.statusCardSuccess : null,
              card.tone === 'warning' ? styles.statusCardWarning : null,
            ]}
          >
            <Text style={styles.statusLabel}>{card.label}</Text>
            <Text style={styles.statusValue}>{card.value}</Text>
            <Text style={styles.statusDetail}>{card.detail}</Text>
          </View>
        ))}
      </View>

      {nextOpportunity ? (
        <Pressable
          onPress={nextOpportunity.onPress}
          style={styles.nextOpportunityCard}
          accessibilityRole="button"
          accessibilityLabel={nextOpportunity.label}
        >
          <View style={styles.nextOpportunityBody}>
            <Text style={styles.nextOpportunityKicker}>Next best step</Text>
            <Text style={styles.nextOpportunityTitle}>{nextOpportunity.label}</Text>
            <Text style={styles.nextOpportunityDetail}>{nextOpportunity.detail}</Text>
          </View>
          <Text style={styles.nextOpportunityImpact}>{nextOpportunity.impactLabel}</Text>
        </Pressable>
      ) : null}

      {payoffCards.length > 0 ? (
        <View style={styles.payoffSection}>
          <Text style={styles.payoffHeading}>What this already protects</Text>
          <View style={styles.payoffList}>
            {payoffCards.map((card) => (
              <View
                key={card.key}
                style={[
                  styles.payoffCard,
                  card.tone === 'success' ? styles.payoffCardSuccess : null,
                ]}
              >
                <Text style={styles.payoffLabel}>{card.label}</Text>
                <Text style={styles.payoffValue}>{card.value}</Text>
                <Text style={styles.payoffDetail}>{card.detail}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Metric grid — only shown once there's data worth summarising */}
      {!isEmpty ? (
        <View style={styles.metricGrid}>
          <MetricCard label="Devices" value={String(assetCount)} detail={`${roomCount} areas mapped`} />
          <MetricCard label="Records" value={String(documentCount)} detail="Policies, manuals" />
          <MetricCard label="Open steps" value={String(activeTasks)} detail="Local reminders" />
          <MetricCard label="Tracked costs" value={savedCostLabel} detail="Repairs, service" onPress={onViewCostSummary} accessibilityLabel="View cost summary" />
        </View>
      ) : null}

      <View style={styles.quickActionsSection}>
        <Text style={styles.quickActionsHeading}>Build readiness</Text>
        <View style={styles.quickActionGrid}>
          {quickActions.map((action) => (
            <Pressable
              key={action.key}
              onPress={action.onPress}
              style={[
                styles.quickActionCard,
                action.tone === 'primary' ? styles.quickActionCardPrimary : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Text
                style={[
                  styles.quickActionTitle,
                  action.tone === 'primary' ? styles.quickActionTitlePrimary : null,
                ]}
              >
                {action.label}
              </Text>
              <Text
                style={[
                  styles.quickActionDetail,
                  action.tone === 'primary' ? styles.quickActionDetailPrimary : null,
                ]}
              >
                {action.detail}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <SectionTitle title="Due now" action="View all" onActionPress={onViewMaintenance} />
      {dueTasks.length > 0 ? (
        dueTasks.map((task) => <TaskRow key={task.id} task={task} onPress={onTaskPress} />)
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>No urgent readiness steps</Text>
          <Text style={styles.emptyText}>Upcoming work stays in the maintenance list.</Text>
        </View>
      )}

      {warrantyAlerts.length > 0 && (
        <>
          <SectionTitle title="Warranties expiring" action="View all" onActionPress={onViewDevices} />
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
          <Text style={styles.emptyText}>
            Saved records, repairs, and completed reminders will appear here.
          </Text>
        </View>
      )}

      <SectionTitle title="Recent records" action="Search" onActionPress={onViewDevices} />
      {recentAssets.length > 0 ? (
        recentAssets.map((asset) => (
          <AssetRow key={asset.id} asset={asset} onPress={() => onAssetPress(asset.id)} />
        ))
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>No critical equipment saved yet</Text>
          <Text style={styles.emptyText}>
            Add a device or system from Devices to start building the household guide.
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
  scoreValueEmpty: {
    color: colors.muted,
    fontSize: 20,
    fontWeight: '700',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  nextOpportunityCard: {
    borderRadius: 10,
    borderColor: colors.blue,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextOpportunityBody: {
    flex: 1,
    gap: 4,
  },
  nextOpportunityKicker: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  nextOpportunityTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  nextOpportunityDetail: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  nextOpportunityImpact: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  statusCard: {
    width: '48.6%',
    minHeight: 92,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 12,
    gap: 4,
  },
  statusCardSuccess: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  statusCardWarning: {
    backgroundColor: colors.amberSoft,
    borderColor: colors.amber,
  },
  statusLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  statusValue: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
  },
  statusDetail: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  payoffSection: {
    gap: 10,
  },
  payoffHeading: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  payoffList: {
    gap: 10,
  },
  payoffCard: {
    borderRadius: 10,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 5,
  },
  payoffCardSuccess: {
    backgroundColor: colors.blueSoft,
    borderColor: '#B9D2E7',
  },
  payoffLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  payoffValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 23,
  },
  payoffDetail: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  quickActionsSection: {
    gap: 10,
  },
  quickActionsHeading: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickActionCard: {
    width: '31.7%',
    minHeight: 94,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 12,
    gap: 6,
    justifyContent: 'space-between',
  },
  quickActionCardPrimary: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  quickActionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
  },
  quickActionTitlePrimary: {
    color: '#FFFFFF',
  },
  quickActionDetail: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  quickActionDetailPrimary: {
    color: 'rgba(255,255,255,0.86)',
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
