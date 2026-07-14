import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import {
  formatContinuityPlaybookState,
  type ContinuityPlaybookGuide,
  type ContinuityPlaybookTarget,
} from '../utils/continuityPlaybooks';

type ContinuityPlaybookDetailScreenProps = {
  canStartIncidentWorkspace?: boolean;
  canRunDrill?: boolean;
  guide: ContinuityPlaybookGuide;
  onBack: () => void;
  onOpenIncidentWorkspace?: () => void;
  onOpenTarget: (target: ContinuityPlaybookTarget) => void;
  onRunDrill?: () => void;
};

export function ContinuityPlaybookDetailScreen({
  canStartIncidentWorkspace = false,
  canRunDrill = false,
  guide,
  onBack,
  onOpenIncidentWorkspace,
  onOpenTarget,
  onRunDrill,
}: ContinuityPlaybookDetailScreenProps) {
  const nextAction = getNextAction(guide);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.secondaryButton} accessibilityRole="button">
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.heroPanel}>
        <Text style={styles.kicker}>{guide.source === 'guided' ? 'Guided playbook' : 'Saved playbook'}</Text>
        <Text style={styles.title}>{guide.title}</Text>
        <View
          style={[
            styles.statusPill,
            guide.state === 'ready'
              ? styles.statusPillReady
              : guide.state === 'in_progress'
                ? styles.statusPillProgress
                : styles.statusPillNeedsSetup,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              guide.state === 'ready'
                ? styles.statusTextReady
                : guide.state === 'in_progress'
                  ? styles.statusTextProgress
                  : styles.statusTextNeedsSetup,
            ]}
          >
            {formatContinuityPlaybookState(guide.state)}
          </Text>
        </View>
        <Text style={styles.subtitle}>{guide.summary}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>When to use</Text>
        <Text style={styles.sectionText}>{guide.whenToUse}</Text>
        {guide.notes ? <Text style={styles.sectionMeta}>{guide.notes}</Text> : null}
        {canStartIncidentWorkspace && onOpenIncidentWorkspace ? (
          <Pressable
            onPress={onOpenIncidentWorkspace}
            style={styles.primaryButton}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Start incident workspace</Text>
          </Pressable>
        ) : null}
        {canRunDrill && onRunDrill ? (
          <Pressable onPress={onRunDrill} style={styles.primaryButton} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>Run a drill</Text>
          </Pressable>
        ) : null}
      </View>

      {nextAction ? (
        <View style={[styles.panel, styles.nextActionPanel]}>
          <Text style={styles.sectionTitle}>Do this first</Text>
          <Text style={styles.sectionText}>{nextAction.label}</Text>
          <Text style={styles.sectionMeta}>{nextAction.detail}</Text>
          <Text style={styles.sectionMeta}>
            {guide.readyRecords.length} linked ready · {guide.missingRecords.length} still missing
          </Text>
          <Pressable
            onPress={() => onOpenTarget(nextAction.target)}
            style={styles.primaryButton}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>{nextAction.actionLabel}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Guided steps</Text>
        {guide.steps.map((step) => (
          <View key={step.id} style={styles.stepRow}>
            <View style={[styles.stepBadge, step.isComplete && styles.stepBadgeReady]}>
              <Text style={[styles.stepBadgeText, step.isComplete && styles.stepBadgeTextReady]}>
                {step.isComplete ? 'Ready' : step.isRequired ? 'Missing' : 'Optional'}
              </Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>{step.label}</Text>
              {step.notes ? <Text style={styles.stepDetail}>{step.notes}</Text> : null}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Linked records</Text>
        {guide.readyRecords.length > 0 ? (
          guide.readyRecords.map((resource) => (
            <Pressable
              key={resource.key}
              onPress={() => onOpenTarget(resource.target)}
              style={styles.recordCard}
              accessibilityRole="button"
            >
              <View style={styles.recordHeader}>
                <Text style={styles.recordTitle}>{resource.label}</Text>
                <Text style={styles.recordTag}>
                  {resource.priority === 'required' ? 'Required' : 'Helpful'}
                </Text>
              </View>
              <Text style={styles.recordDetail}>{resource.detail}</Text>
              <Text style={styles.recordAction}>Open linked record</Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.emptyText}>
            No linked records are ready yet. Use the missing items below to make this playbook useful.
          </Text>
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>What is missing</Text>
        {guide.missingRecords.length > 0 ? (
          guide.missingRecords.map((resource) => (
            <Pressable
              key={resource.key}
              onPress={() => onOpenTarget(resource.target)}
              style={styles.recordCard}
              accessibilityRole="button"
            >
              <View style={styles.recordHeader}>
                <Text style={styles.recordTitle}>{resource.label}</Text>
                <Text style={[styles.recordTag, styles.recordTagWarning]}>
                  {resource.priority === 'required' ? 'Needed' : 'Optional'}
                </Text>
              </View>
              <Text style={styles.recordDetail}>{resource.detail}</Text>
              <Text style={styles.recordAction}>Open next step</Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.emptyText}>
            This playbook has the core records it needs. Review the linked records above before you need them.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

function getNextAction(guide: ContinuityPlaybookGuide) {
  const missingRequired = guide.missingRecords.find((resource) => resource.priority === 'required');

  if (missingRequired) {
    return {
      actionLabel: 'Fix missing record',
      detail: missingRequired.detail,
      label: missingRequired.label,
      target: missingRequired.target,
    };
  }

  const readyRequired = guide.readyRecords.find((resource) => resource.priority === 'required');

  if (readyRequired) {
    return {
      actionLabel: 'Open linked record',
      detail: readyRequired.detail,
      label: readyRequired.label,
      target: readyRequired.target,
    };
  }

  const fallback = guide.readyRecords[0] ?? guide.missingRecords[0];

  if (!fallback) {
    return null;
  }

  return {
    actionLabel: fallback.status === 'ready' ? 'Open linked record' : 'Open next step',
    detail: fallback.detail,
    label: fallback.label,
    target: fallback.target,
  };
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
    minHeight: 52,
    justifyContent: 'center',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
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
  heroPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 16,
    gap: 8,
  },
  kicker: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillReady: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  statusPillProgress: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blue,
  },
  statusPillNeedsSetup: {
    backgroundColor: colors.redSoft,
    borderColor: colors.red,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statusTextReady: {
    color: colors.green,
  },
  statusTextProgress: {
    color: colors.blue,
  },
  statusTextNeedsSetup: {
    color: colors.red,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 10,
  },
  nextActionPanel: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  sectionMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  primaryButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: colors.blue,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  stepBadge: {
    minWidth: 68,
    borderRadius: 999,
    backgroundColor: colors.amberSoft,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  stepBadgeReady: {
    backgroundColor: colors.greenSoft,
  },
  stepBadgeText: {
    color: colors.amber,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  stepBadgeTextReady: {
    color: colors.green,
  },
  stepBody: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  stepDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  recordCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.page,
    padding: 12,
    gap: 5,
  },
  recordHeader: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recordTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
  },
  recordTag: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  recordTagWarning: {
    color: colors.amber,
  },
  recordDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  recordAction: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
});
