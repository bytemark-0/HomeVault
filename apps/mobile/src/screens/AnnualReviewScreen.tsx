import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { AnnualReviewChecklistItem, AnnualReviewChecklistKey } from '../utils/annualReview';
import type { DrillPracticePrompt } from '../utils/drillHistoryStorage';
import { colors } from '../theme/colors';

type AnnualReviewScreenProps = {
  checklist: AnnualReviewChecklistItem[];
  isSaving?: boolean;
  lastCompletedLabel: string | null;
  nextReminderLabel: string | null;
  practicePrompts?: DrillPracticePrompt[];
  priorityReviewItems?: Array<{
    key: string;
    title: string;
    detail: string;
    actionLabel: string;
  }>;
  propertyLabel: string;
  remindersEnabled: boolean;
  onBack: () => void;
  onCompleteReview: () => void | Promise<void>;
  onOpenChecklistItem: (key: AnnualReviewChecklistKey) => void;
  onOpenPracticePrompt?: (guideId: string) => void;
  onOpenPriorityReviewItem?: (key: string) => void;
  onToggleReminders: (enabled: boolean) => void | Promise<void>;
};

export function AnnualReviewScreen({
  checklist,
  isSaving = false,
  lastCompletedLabel,
  nextReminderLabel,
  practicePrompts = [],
  priorityReviewItems = [],
  propertyLabel,
  remindersEnabled,
  onBack,
  onCompleteReview,
  onOpenChecklistItem,
  onOpenPracticePrompt,
  onOpenPriorityReviewItem,
  onToggleReminders,
}: AnnualReviewScreenProps) {
  const readyCount = checklist.filter((item) => item.status === 'ready').length;

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <View style={styles.heroText}>
            <Text style={styles.kicker}>Annual review</Text>
            <Text style={styles.title}>Refresh the household continuity plan</Text>
            <Text style={styles.subtitle}>
              Review the records behind {propertyLabel} once a year so coverage, contacts, access,
              devices, and the emergency packet stay worth keeping.
            </Text>
          </View>
          <Pressable onPress={onBack} style={styles.backButton} accessibilityRole="button">
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{readyCount}/{checklist.length}</Text>
          <Text style={styles.summaryLabel}>areas ready</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{lastCompletedLabel ?? 'Never'}</Text>
          <Text style={styles.summaryLabel}>last completed</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{nextReminderLabel ?? 'Off'}</Text>
          <Text style={styles.summaryLabel}>next reminder</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={() => void onToggleReminders(!remindersEnabled)}
          style={[styles.actionCard, remindersEnabled && styles.actionCardPrimary]}
          accessibilityRole="button"
          disabled={isSaving}
        >
          <Text style={remindersEnabled ? styles.actionTitlePrimary : styles.actionTitle}>
            {remindersEnabled ? 'Pause yearly reminder' : 'Turn on yearly reminder'}
          </Text>
          <Text style={remindersEnabled ? styles.actionDetailPrimary : styles.actionDetail}>
            {remindersEnabled
              ? 'The annual review stays off the reminder list until you turn it back on.'
              : 'Use the existing local-notification flow after you intentionally enable the review cadence.'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => void onCompleteReview()}
          style={[styles.actionCard, styles.actionCardAccent]}
          accessibilityRole="button"
          disabled={isSaving}
        >
          <Text style={styles.actionTitlePrimary}>
            {remindersEnabled ? 'Complete review and reschedule' : 'Mark review complete'}
          </Text>
          <Text style={styles.actionDetailPrimary}>
            Save today&apos;s review and keep the next yearly checkpoint visible.
          </Text>
        </Pressable>
      </View>

      {priorityReviewItems.length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Highest-risk stale records</Text>
            <Text style={styles.sectionMeta}>Open the records that need review first</Text>
          </View>
          <View style={styles.priorityList}>
            {priorityReviewItems.map((item) => (
              <View key={item.key} style={styles.priorityCard}>
                <Text style={styles.priorityTitle}>{item.title}</Text>
                <Text style={styles.priorityDetail}>{item.detail}</Text>
                <Pressable
                  onPress={() => onOpenPriorityReviewItem?.(item.key)}
                  style={styles.priorityAction}
                  accessibilityRole="button"
                  disabled={isSaving}
                >
                  <Text style={styles.priorityActionText}>{item.actionLabel}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {practicePrompts.length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Practice prompts</Text>
            <Text style={styles.sectionMeta}>Run the incidents that still feel risky</Text>
          </View>
          <View style={styles.priorityList}>
            {practicePrompts.map((prompt) => (
              <View key={prompt.guideId} style={styles.practiceCard}>
                <Text style={styles.priorityTitle}>{prompt.title}</Text>
                <Text style={styles.priorityDetail}>{prompt.detail}</Text>
                <Pressable
                  onPress={() => onOpenPracticePrompt?.(prompt.guideId)}
                  style={styles.priorityAction}
                  accessibilityRole="button"
                  disabled={isSaving}
                >
                  <Text style={styles.priorityActionText}>{prompt.actionLabel}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Review checklist</Text>
        <Text style={styles.sectionMeta}>Work through each continuity area</Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {checklist.map((item) => (
          <View key={item.key} style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <View style={styles.recordTitleWrap}>
                <Text style={styles.recordTitle}>{item.title}</Text>
                <Text
                  style={[
                    styles.recordStatus,
                    item.status === 'ready' ? styles.recordStatusReady : styles.recordStatusNeedsAttention,
                  ]}
                >
                  {item.status === 'ready' ? 'Ready' : 'Needs attention'}
                </Text>
              </View>
              <Pressable
                onPress={() => onOpenChecklistItem(item.key)}
                style={styles.recordAction}
                accessibilityRole="button"
                disabled={isSaving}
              >
                <Text style={styles.recordActionText}>{item.actionLabel}</Text>
              </Pressable>
            </View>
            <Text style={styles.recordDetail}>{item.detail}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 14,
  },
  hero: {
    backgroundColor: colors.blueSoft,
    borderColor: '#B9D2E7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },
  heroText: {
    flex: 1,
    gap: 6,
  },
  kicker: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A9C3D9',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  backButtonText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 4,
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  actionsRow: {
    gap: 10,
  },
  actionCard: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 6,
  },
  actionCardPrimary: {
    backgroundColor: colors.blueSoft,
    borderColor: '#B9D2E7',
  },
  actionCardAccent: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  actionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  actionTitlePrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  actionDetail: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  actionDetailPrimary: {
    color: '#EAF6F1',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 32,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  priorityList: {
    gap: 10,
  },
  priorityCard: {
    backgroundColor: '#FFF6EA',
    borderColor: '#E5C18F',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 8,
  },
  practiceCard: {
    backgroundColor: colors.redSoft,
    borderColor: '#E4B6AF',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 8,
  },
  priorityTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  priorityDetail: {
    color: '#815A1D',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  priorityAction: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  priorityActionText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 12,
    paddingBottom: 32,
  },
  recordCard: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  recordHeader: {
    gap: 10,
  },
  recordTitleWrap: {
    gap: 6,
  },
  recordTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  recordStatus: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
  },
  recordStatusReady: {
    backgroundColor: colors.greenSoft,
    color: colors.green,
  },
  recordStatusNeedsAttention: {
    backgroundColor: colors.amberSoft,
    color: colors.amber,
  },
  recordAction: {
    alignSelf: 'flex-start',
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: colors.blueSoft,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  recordActionText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  recordDetail: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
