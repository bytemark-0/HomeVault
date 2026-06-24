import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useHomeVault } from '../context/HomeVaultContext';
import { colors } from '../theme/colors';
import {
  SETUP_CHECKLIST_STEPS,
  dismissSetupChecklist,
  getSetupChecklistProgress,
  readSetupChecklistDismissed,
} from '../utils/setupChecklist';

export function SetupChecklistCard() {
  const { appData, backupSummary } = useHomeVault();
  const [dismissed, setDismissed] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    readSetupChecklistDismissed().then((v) => setDismissed(v));
  }, []);

  if (!appData || dismissed) return null;

  const { done, doneCount, incomplete, next, total } = getSetupChecklistProgress({
    roomCount: appData.roomCount,
    assetCount: appData.assetCount,
    taskCount: appData.tasks.length,
    documentCount: appData.documentCount,
    hasPropertyPhoto: Boolean(appData.property.photoUri),
    backupCreated: Boolean(backupSummary),
  });
  if (incomplete.length === 0) return null;
  if (!next) return null;

  function handleDismiss() {
    setDismissed(true);
    void dismissSetupChecklist();
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Getting started</Text>
        <Text style={styles.progress}>
          {doneCount} of {total}
        </Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(doneCount / total) * 100}%` }]} />
      </View>

      <Pressable
        style={styles.nextAction}
        onPress={() => router.push(next.route as Parameters<typeof router.push>[0])}
        accessibilityRole="button"
        accessibilityLabel={next.label}
        accessibilityHint={next.hint}
      >
        <View style={styles.nextActionBody}>
          <Text style={styles.nextLabel}>Next step</Text>
          <Text style={styles.nextTitle}>{next.label}</Text>
          <Text style={styles.nextHint}>{next.hint}</Text>
        </View>
        <Text style={styles.nextArrow}>›</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.stepList}>
          {SETUP_CHECKLIST_STEPS.map((step) => {
            const isDone = done.has(step.key);
            return (
              <Pressable
                key={step.key}
                style={styles.stepRow}
                onPress={isDone ? undefined : () => router.push(step.route as Parameters<typeof router.push>[0])}
                accessibilityRole={isDone ? 'text' : 'button'}
                accessibilityLabel={step.label}
                accessibilityState={isDone ? { checked: true } : undefined}
              >
                <View style={[styles.stepDot, isDone && styles.stepDotDone]}>
                  {isDone ? <Text style={styles.stepCheck}>✓</Text> : null}
                </View>
                <Text style={[styles.stepLabel, isDone && styles.stepLabelDone]}>
                  {step.label}
                </Text>
                {!isDone ? <Text style={styles.stepArrow}>›</Text> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.footer}>
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          style={styles.footerButton}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Show fewer steps' : 'Show all steps'}
        >
          <Text style={styles.footerButtonText}>{expanded ? 'Show fewer ▴' : 'Show all steps ▾'}</Text>
        </Pressable>
        <Pressable
          onPress={handleDismiss}
          style={styles.footerButton}
          accessibilityRole="button"
          accessibilityLabel="Dismiss setup checklist"
        >
          <Text style={styles.dismissText}>Dismiss</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.green,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
  },
  progress: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  nextAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.greenSoft,
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  nextActionBody: {
    flex: 1,
    gap: 2,
  },
  nextLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.green,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
  },
  nextHint: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
    lineHeight: 18,
  },
  nextArrow: {
    fontSize: 22,
    color: colors.green,
    fontWeight: '300',
  },
  stepList: {
    gap: 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopColor: colors.line,
    borderTopWidth: 1,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderColor: colors.line,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.page,
  },
  stepDotDone: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  stepCheck: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  stepLabelDone: {
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  stepArrow: {
    fontSize: 18,
    color: colors.muted,
    fontWeight: '300',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  footerButton: {
    minHeight: 32,
    justifyContent: 'center',
  },
  footerButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.blue,
  },
  dismissText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
  },
});
