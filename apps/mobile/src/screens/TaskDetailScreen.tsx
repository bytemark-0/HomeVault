import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { TaskCompletionListItem, TaskListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type TaskDetailScreenProps = {
  task: TaskListItem;
  completions: TaskCompletionListItem[];
  onBack: () => void;
  onComplete: (taskId: string) => void;
  onDelete: () => Promise<void>;
  onSkip: (taskId: string) => void;
  onSnooze: (taskId: string) => void;
  onResume?: (taskId: string) => void;
  onEdit: () => void;
  onEditCompletion: (completionId: string) => void;
  onDeleteCompletion: (completionId: string) => Promise<void>;
  onViewScope?: () => void;
};

export function TaskDetailScreen({
  task,
  completions,
  onBack,
  onComplete,
  onDelete,
  onSkip,
  onSnooze,
  onResume,
  onEdit,
  onEditCompletion,
  onDeleteCompletion,
  onViewScope,
}: TaskDetailScreenProps) {
  const isCompleted = task.state === 'completed';
  const isSnoozed = task.state === 'snoozed';

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
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => confirmDeleteTask(task.title, completions.length, onDelete)}
            style={styles.dangerButton}
            accessibilityRole="button"
          >
            <Text style={styles.dangerButtonText}>Delete</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (!isCompleted) {
                onComplete(task.id);
              }
            }}
            disabled={isCompleted}
            style={[styles.secondaryButton, isCompleted && styles.disabledButton]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>
              {isCompleted ? 'Completed' : 'Complete'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (!isCompleted && !isSnoozed) {
                confirmSkipTask(task.title, () => onSkip(task.id));
              }
            }}
            disabled={isCompleted || isSnoozed}
            style={[styles.secondaryButton, (isCompleted || isSnoozed) && styles.disabledButton]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>Skip</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (!isCompleted && !isSnoozed) {
                onSnooze(task.id);
              }
            }}
            disabled={isCompleted || isSnoozed}
            style={[styles.secondaryButton, (isCompleted || isSnoozed) && styles.disabledButton]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>Snooze</Text>
          </Pressable>
          {isSnoozed ? (
            <Pressable
              onPress={() => onResume?.(task.id)}
              style={styles.secondaryButton}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>Resume now</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={onEdit} style={styles.primaryButton} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>Edit</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.heroPanel}>
        <Text style={styles.kicker}>{task.scopeLabel}</Text>
        <Text style={styles.title}>{task.title}</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{task.dueLabel}</Text>
        </View>
      </View>

      <View style={styles.detailGrid}>
        <DetailItem label="Due date" value={task.dueDate} />
        <DetailItem label="Repeats" value={task.recurrenceLabel} />
        <DetailItem label="Scope" value={task.scopeLabel} onPress={onViewScope} />
        <DetailItem label="State" value={formatTaskState(task.state)} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.notes}>{task.instructions ?? 'No instructions yet.'}</Text>
      </View>

      {isSnoozed ? (
        <View style={styles.infoPanel}>
          <Text style={styles.infoTitle}>Snoozed task</Text>
          <Text style={styles.infoText}>
            This task is delayed until its snoozed date. Use Resume now if you want it back on the
            active list today.
          </Text>
        </View>
      ) : null}

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Completion history</Text>
        {completions.length > 0 ? (
          completions.map((completion) => {
            const isSkipped = completion.kind === 'skipped';
            return (
              <View key={completion.id} style={styles.completionRow}>
                <View style={styles.completionHeader}>
                  <View style={styles.completionHeaderLeft}>
                    {isSkipped ? (
                      <View style={styles.skippedBadge}>
                        <Text style={styles.skippedBadgeText}>Skipped</Text>
                      </View>
                    ) : null}
                    <Text style={styles.completionDate}>{completion.completedAtLabel}</Text>
                  </View>
                  <View style={styles.completionHeaderRight}>
                    {!isSkipped ? (
                      <Text style={styles.completionCost}>{completion.costLabel}</Text>
                    ) : null}
                    {!isSkipped ? (
                      <Pressable
                        onPress={() => onEditCompletion(completion.id)}
                        style={styles.completionEditButton}
                        accessibilityRole="button"
                        accessibilityLabel="Edit completion"
                      >
                        <Text style={styles.completionEditText}>Edit</Text>
                      </Pressable>
                    ) : null}
                    <Pressable
                      onPress={() => confirmDeleteCompletion(completion.completedAtLabel, () => onDeleteCompletion(completion.id))}
                      style={styles.completionDeleteButton}
                      accessibilityRole="button"
                      accessibilityLabel="Delete completion"
                    >
                      <Text style={styles.completionDeleteText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
                {!isSkipped ? (
                  <Text style={styles.completionNotes}>
                    {completion.notes ?? 'No notes recorded.'}
                  </Text>
                ) : null}
                {completion.notes && isSkipped ? (
                  <Text style={styles.completionNotes}>{completion.notes}</Text>
                ) : null}
                {completion.photoUri ? (
                  <Image
                    source={{ uri: completion.photoUri }}
                    style={styles.completionPhoto}
                    resizeMode="cover"
                    accessibilityLabel="Completion photo"
                  />
                ) : null}
              </View>
            );
          })
        ) : (
          <Text style={styles.notes}>No completions recorded yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

function DetailItem({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  const content = (
    <>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, onPress && styles.detailValueLink]}>{value}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.detailItem} onPress={onPress} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return <View style={styles.detailItem}>{content}</View>;
}

function formatTaskState(state: TaskListItem['state']) {
  switch (state) {
    case 'due_today':
      return 'Due today';
    case 'overdue':
      return 'Overdue';
    case 'snoozed':
      return 'Snoozed';
    case 'completed':
      return 'Completed';
    case 'upcoming':
    default:
      return 'Upcoming';
  }
}

function confirmSkipTask(title: string, onConfirm: () => void) {
  Alert.alert(
    'Skip this task?',
    `"${title}" will be recorded as intentionally skipped. The skip is saved to history so you have a record that this due date was passed without completing the task.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Skip', style: 'destructive', onPress: onConfirm },
    ],
  );
}

function confirmDeleteCompletion(dateLabel: string, onConfirm: () => Promise<void>) {
  Alert.alert(
    'Delete completion?',
    `The completion recorded on ${dateLabel} will be removed.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void onConfirm();
        },
      },
    ],
  );
}

function confirmDeleteTask(
  title: string,
  completionCount: number,
  onConfirm: () => Promise<void>,
) {
  const historyNote =
    completionCount > 0
      ? ` This also removes ${completionCount} completion ${completionCount === 1 ? 'record' : 'records'}.`
      : '';

  Alert.alert(
    'Delete task?',
    `"${title}" will be removed from this local HomeVault preview.${historyNote}`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void onConfirm();
        },
      },
    ],
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
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  disabledButton: {
    opacity: 0.55,
  },
  secondaryButtonText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  primaryButton: {
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  dangerButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '900',
  },
  heroPanel: {
    minHeight: 150,
    borderRadius: 8,
    backgroundColor: colors.blue,
    padding: 18,
    justifyContent: 'space-between',
  },
  kicker: {
    color: colors.blueSoft,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: 0,
  },
  statusPill: {
    alignSelf: 'flex-start',
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 7,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailItem: {
    width: '48.6%',
    minHeight: 86,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 12,
    gap: 8,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  detailValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  detailValueLink: {
    color: colors.blue,
    textDecorationLine: 'underline',
  },
  panel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 12,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  notes: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  infoPanel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.blueSoft,
    padding: 14,
    gap: 4,
  },
  infoTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  infoText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  completionRow: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 5,
  },
  completionHeader: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  completionHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  completionDate: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  skippedBadge: {
    alignSelf: 'flex-start',
    minHeight: 20,
    paddingHorizontal: 7,
    borderRadius: 5,
    backgroundColor: colors.page,
    borderColor: colors.line,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skippedBadgeText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
  },
  completionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completionCost: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right',
  },
  completionEditButton: {
    minHeight: 26,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionEditText: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '900',
  },
  completionDeleteButton: {
    minHeight: 26,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionDeleteText: {
    color: colors.red,
    fontSize: 11,
    fontWeight: '900',
  },
  completionNotes: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  completionPhoto: {
    width: '100%',
    height: 160,
    borderRadius: 6,
    marginTop: 6,
  },
});
