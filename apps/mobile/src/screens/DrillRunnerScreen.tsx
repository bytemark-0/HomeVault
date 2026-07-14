import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import type { ContinuityDrillScenario, ContinuityPlaybookTarget } from '../utils/continuityPlaybooks';
import type { DrillOutcome } from '../utils/drillHistoryStorage';

type DrillRunnerScreenProps = {
  onBack: () => void;
  onComplete?: (summary: DrillCompletionSummary) => void | Promise<void>;
  onOpenTarget: (target: ContinuityPlaybookTarget) => void;
  scenario: ContinuityDrillScenario;
};

export type DrillCompletionSummary = {
  blockedCount: number;
  completedAt: string;
  confusingCount: number;
  missingRecordCount: number;
  outcome: DrillOutcome;
  reviewNeededCount: number;
};

export function DrillRunnerScreen({
  onBack,
  onComplete,
  onOpenTarget,
  scenario,
}: DrillRunnerScreenProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [blockedStepIds, setBlockedStepIds] = useState<string[]>([]);
  const [confusingStepIds, setConfusingStepIds] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!timerRunning) {
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning]);

  const currentStep = scenario.steps[currentStepIndex];
  const totalSteps = scenario.steps.length;
  const missingCount = scenario.steps.reduce(
    (count, step) => count + step.resources.filter((resource) => resource.status === 'missing').length,
    0,
  );
  const missingRecordCount = scenario.missingRecordLabels.length || missingCount;
  const blockedSteps = useMemo(
    () => scenario.steps.filter((step) => blockedStepIds.includes(step.id)),
    [blockedStepIds, scenario.steps],
  );
  const confusingSteps = useMemo(
    () => scenario.steps.filter((step) => confusingStepIds.includes(step.id)),
    [confusingStepIds, scenario.steps],
  );
  const reviewNeededResources = useMemo(() => {
    const resources = new Map<string, { key: string; label: string; detail: string }>();

    for (const step of scenario.steps) {
      for (const resource of step.resources) {
        if (resource.status !== 'ready' || resource.freshness?.status === 'current' || !resource.freshness) {
          continue;
        }

        resources.set(resource.key, {
          key: resource.key,
          label: resource.label,
          detail: `${resource.freshness.label} - ${resource.freshness.detail}`,
        });
      }
    }

    return [...resources.values()];
  }, [scenario.steps]);
  const outcome = useMemo(
    () =>
      getDrillOutcome({
        blockedCount: blockedSteps.length,
        confusingCount: confusingSteps.length,
        missingRecordCount,
        reviewNeededCount: reviewNeededResources.length,
      }),
    [blockedSteps.length, confusingSteps.length, missingRecordCount, reviewNeededResources.length],
  );
  const completionSummary = useMemo<DrillCompletionSummary>(
    () => ({
      blockedCount: blockedSteps.length,
      completedAt: new Date().toISOString(),
      confusingCount: confusingSteps.length,
      missingRecordCount,
      outcome: outcome.key,
      reviewNeededCount: reviewNeededResources.length,
    }),
    [
      blockedSteps.length,
      confusingSteps.length,
      missingRecordCount,
      outcome.key,
      reviewNeededResources.length,
    ],
  );
  const followUpActions = useMemo(
    () =>
      buildFollowUpActions({
        blockedSteps,
        confusingSteps,
        missingRecordLabels: scenario.missingRecordLabels,
        reviewNeededResources,
      }),
    [blockedSteps, confusingSteps, reviewNeededResources, scenario.missingRecordLabels],
  );
  const summaryRows = useMemo(
    () => [
      { label: 'Outcome', value: finished ? outcome.label : 'In progress' },
      { label: 'Steps completed', value: `${completedStepIds.length}/${totalSteps}` },
      { label: 'Blocked steps', value: String(blockedSteps.length) },
      { label: 'Confusing steps', value: String(confusingSteps.length) },
      { label: 'Missing records', value: String(missingRecordCount) },
      { label: 'Needs review', value: String(reviewNeededResources.length) },
    ],
    [
      blockedSteps.length,
      completedStepIds.length,
      confusingSteps.length,
      finished,
      missingRecordCount,
      outcome.label,
      reviewNeededResources.length,
      totalSteps,
    ],
  );

  const isCurrentBlocked = blockedStepIds.includes(currentStep.id);
  const isCurrentConfusing = confusingStepIds.includes(currentStep.id);
  const isLastStep = currentStepIndex === totalSteps - 1;

  const handleAdvance = () => {
    setCompletedStepIds((ids) => (ids.includes(currentStep.id) ? ids : [...ids, currentStep.id]));

    if (isLastStep) {
      setFinished(true);
      setTimerRunning(false);
      void onComplete?.(completionSummary);
      return;
    }

    setCurrentStepIndex((index) => Math.min(index + 1, totalSteps - 1));
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setCompletedStepIds([]);
    setBlockedStepIds([]);
    setConfusingStepIds([]);
    setElapsedSeconds(0);
    setTimerRunning(false);
    setFinished(false);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.secondaryButton} accessibilityRole="button">
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.heroPanel}>
        <Text style={styles.kicker}>Guided drill</Text>
        <Text style={styles.title}>{scenario.title}</Text>
        <Text style={styles.subtitle}>{scenario.whenToUse}</Text>
        <Text style={styles.summary}>{scenario.summary}</Text>
      </View>

      <View style={styles.statusRow}>
        <SummaryCard label="Current step" value={finished ? 'Finished' : `${currentStepIndex + 1}/${totalSteps}`} />
        <SummaryCard label="Timer" value={formatElapsedTime(elapsedSeconds)} />
        <SummaryCard label="Missing" value={String(scenario.missingRecordLabels.length || missingCount)} />
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.sectionTitle}>Practice controls</Text>
          <Pressable
            onPress={() => setTimerRunning((value) => !value)}
            style={styles.inlineButton}
            accessibilityRole="button"
          >
            <Text style={styles.inlineButtonText}>{timerRunning ? 'Pause timer' : 'Start timer'}</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionMeta}>
          Use this dry run to check whether the household can follow the plan without editing live records.
        </Text>
      </View>

      {!finished ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Current step</Text>
          <Text style={styles.stepTitle}>{currentStep.label}</Text>
          {currentStep.notes ? <Text style={styles.stepDetail}>{currentStep.notes}</Text> : null}
          <View style={styles.flagRow}>
            <StatusPill label={currentStep.isRequired ? 'Required' : 'Optional'} tone="default" />
            <StatusPill
              label={currentStep.resources.some((resource) => resource.status === 'missing') ? 'Missing info' : 'Ready'}
              tone={currentStep.resources.some((resource) => resource.status === 'missing') ? 'warning' : 'success'}
            />
          </View>

          <View style={styles.actionRow}>
            <Pressable
              onPress={() =>
                setBlockedStepIds((ids) =>
                  ids.includes(currentStep.id) ? ids.filter((id) => id !== currentStep.id) : [...ids, currentStep.id],
                )
              }
              style={[styles.secondaryActionButton, isCurrentBlocked && styles.secondaryActionButtonActive]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryActionText}>{isCurrentBlocked ? 'Marked blocked' : 'Mark blocked'}</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                setConfusingStepIds((ids) =>
                  ids.includes(currentStep.id) ? ids.filter((id) => id !== currentStep.id) : [...ids, currentStep.id],
                )
              }
              style={[styles.secondaryActionButton, isCurrentConfusing && styles.secondaryActionButtonActive]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryActionText}>
                {isCurrentConfusing ? 'Marked confusing' : 'Mark confusing'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.subsectionTitle}>Linked records for this step</Text>
          {currentStep.resources.length > 0 ? (
            currentStep.resources.map((resource) => (
              <View key={resource.key} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordTitle}>{resource.label}</Text>
                  <StatusPill
                    label={resource.status === 'ready' ? 'Ready' : 'Missing'}
                    tone={resource.status === 'ready' ? 'success' : 'warning'}
                  />
                </View>
                <Text style={styles.recordDetail}>{resource.detail}</Text>
                {resource.freshness && resource.freshness.status !== 'current' ? (
                  <Text style={styles.recordWarningMeta}>{`${resource.freshness.label} - ${resource.freshness.detail}`}</Text>
                ) : null}
                {resource.sensitivity === 'protected' ? (
                  <Text style={styles.recordMeta}>Protected details stay gated in the linked record.</Text>
                ) : null}
                <Pressable
                  onPress={() => onOpenTarget(resource.target)}
                  style={styles.linkButton}
                  accessibilityRole="button"
                >
                  <Text style={styles.linkButtonText}>{resource.actionLabel}</Text>
                </Pressable>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No linked records are mapped to this step yet.</Text>
          )}

          <View style={styles.navigationRow}>
            <Pressable
              onPress={() => setCurrentStepIndex((index) => Math.max(index - 1, 0))}
              style={[styles.secondaryActionButton, currentStepIndex === 0 && styles.actionButtonDisabled]}
              disabled={currentStepIndex === 0}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryActionText}>Previous step</Text>
            </Pressable>
            <Pressable onPress={handleAdvance} style={styles.primaryButton} accessibilityRole="button">
              <Text style={styles.primaryButtonText}>{isLastStep ? 'Finish drill' : 'Next step'}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Drill summary</Text>
          <Text style={styles.sectionMeta}>{outcome.detail}</Text>
          {summaryRows.map((row) => (
            <View key={row.label} style={styles.compareLine}>
              <Text style={styles.compareLabel}>{row.label}</Text>
              <Text style={styles.compareValue}>{row.value}</Text>
            </View>
          ))}
          {blockedSteps.length > 0 ? (
            <>
              <Text style={styles.subsectionTitle}>Blocked steps</Text>
              {blockedSteps.map((step) => (
                <Text key={step.id} style={styles.bulletText}>{`- ${step.label}`}</Text>
              ))}
            </>
          ) : null}
          {confusingSteps.length > 0 ? (
            <>
              <Text style={styles.subsectionTitle}>Confusing steps</Text>
              {confusingSteps.map((step) => (
                <Text key={step.id} style={styles.bulletText}>{`- ${step.label}`}</Text>
              ))}
            </>
          ) : null}
          {scenario.missingRecordLabels.length > 0 ? (
            <>
              <Text style={styles.subsectionTitle}>Missing records</Text>
              {scenario.missingRecordLabels.map((label) => (
                <Text key={label} style={styles.bulletText}>{`- ${label}`}</Text>
              ))}
            </>
          ) : null}
          {reviewNeededResources.length > 0 ? (
            <>
              <Text style={styles.subsectionTitle}>Needs review</Text>
              {reviewNeededResources.map((resource) => (
                <Text key={resource.key} style={styles.bulletText}>{`- ${resource.label} - ${resource.detail}`}</Text>
              ))}
            </>
          ) : null}
          {followUpActions.length > 0 ? (
            <>
              <Text style={styles.subsectionTitle}>Suggested follow-up</Text>
              {followUpActions.map((action) => (
                <Text key={action} style={styles.bulletText}>{`- ${action}`}</Text>
              ))}
            </>
          ) : null}
          <Pressable onPress={handleRestart} style={styles.primaryButton} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>Restart drill</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Drill health</Text>
        {summaryRows.map((row) => (
          <View key={row.label} style={styles.compareLine}>
            <Text style={styles.compareLabel}>{row.label}</Text>
            <Text style={styles.compareValue}>{row.value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: 'default' | 'success' | 'warning';
}) {
  return (
    <View
      style={[
        styles.statusPill,
        tone === 'success'
          ? styles.statusPillSuccess
          : tone === 'warning'
            ? styles.statusPillWarning
            : styles.statusPillDefault,
      ]}
    >
      <Text style={styles.statusPillText}>{label}</Text>
    </View>
  );
}

function formatElapsedTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getDrillOutcome({
  blockedCount,
  confusingCount,
  missingRecordCount,
  reviewNeededCount,
}: {
  blockedCount: number;
  confusingCount: number;
  missingRecordCount: number;
  reviewNeededCount: number;
}) {
  if (blockedCount > 0) {
    return {
      key: 'blocked' as const,
      label: 'Blocked',
      detail: 'One or more steps stalled during practice. Fix those blockers before you rely on this playbook.',
    };
  }

  if (missingRecordCount > 0 || reviewNeededCount > 0) {
    return {
      key: 'needs_data' as const,
      label: 'Needs data',
      detail: 'The drill ran, but linked records still need to be added or refreshed before the plan feels dependable.',
    };
  }

  if (confusingCount > 0) {
    return {
      key: 'pass_with_follow_up' as const,
      label: 'Pass with follow-up',
      detail: 'The core flow worked, but at least one step needs clearer instructions before the next drill.',
    };
  }

  return {
    key: 'pass' as const,
    label: 'Pass',
    detail: 'The scenario completed without blockers, missing records, or stale linked data.',
  };
}

function buildFollowUpActions({
  blockedSteps,
  confusingSteps,
  missingRecordLabels,
  reviewNeededResources,
}: {
  blockedSteps: ContinuityDrillScenario['steps'];
  confusingSteps: ContinuityDrillScenario['steps'];
  missingRecordLabels: string[];
  reviewNeededResources: Array<{ key: string; label: string }>;
}) {
  const suggestions: string[] = [];

  for (const label of missingRecordLabels) {
    suggestions.push(`Add or relink "${label}" before the next drill.`);
  }

  for (const resource of reviewNeededResources) {
    suggestions.push(`Review and refresh "${resource.label}" before the next drill.`);
  }

  for (const step of blockedSteps) {
    suggestions.push(`Rewrite or simplify the blocked step "${step.label}".`);
  }

  for (const step of confusingSteps) {
    suggestions.push(`Clarify the drill instruction "${step.label}" so helpers know what to do.`);
  }

  return [...new Set(suggestions)];
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
    backgroundColor: colors.blueSoft,
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
  subtitle: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  summary: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 12,
    gap: 4,
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 16,
    gap: 10,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  stepTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  stepDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  flagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  statusPillDefault: {
    borderColor: colors.line,
    backgroundColor: colors.page,
  },
  statusPillSuccess: {
    borderColor: colors.green,
    backgroundColor: colors.greenSoft,
  },
  statusPillWarning: {
    borderColor: colors.red,
    backgroundColor: colors.redSoft,
  },
  statusPillText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryActionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.page,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  secondaryActionButtonActive: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blue,
  },
  secondaryActionText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  subsectionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  recordCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.page,
    padding: 12,
    gap: 8,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  recordTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  recordDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  recordMeta: {
    color: colors.red,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  recordWarningMeta: {
    color: colors.amber,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  linkButton: {
    alignSelf: 'flex-start',
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  navigationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  inlineButton: {
    minHeight: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.blue,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueSoft,
  },
  inlineButtonText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  compareLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  compareLabel: {
    flex: 1,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  compareValue: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
  bulletText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
});
