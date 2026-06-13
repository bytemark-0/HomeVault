import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TaskListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type TaskRowProps = {
  task: TaskListItem;
  onPress?: (taskId: string) => void;
};

export function TaskRow({ task, onPress }: TaskRowProps) {
  const isUrgent = task.state === 'overdue' || task.state === 'due_today';
  const isCompleted = task.state === 'completed';

  return (
    <Pressable
      onPress={() => onPress?.(task.id)}
      style={styles.taskRow}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View
        style={[
          styles.taskState,
          isUrgent && styles.taskStateUrgent,
          isCompleted && styles.taskStateCompleted,
        ]}
      />
      <View style={styles.rowBody}>
        <View style={styles.rowTitleLine}>
          <Text style={styles.rowTitle}>{task.title}</Text>
          <Text
            style={[
              styles.dueText,
              isUrgent && styles.dueTextUrgent,
              isCompleted && styles.dueTextCompleted,
            ]}
          >
            {task.dueLabel}
          </Text>
        </View>
        <Text style={styles.rowMeta}>
          {task.scopeLabel} · {task.recurrenceLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  taskRow: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
  },
  taskState: {
    width: 8,
    borderRadius: 4,
    backgroundColor: colors.blue,
  },
  taskStateUrgent: {
    backgroundColor: colors.red,
  },
  taskStateCompleted: {
    backgroundColor: colors.green,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
  },
  rowMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  dueText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
  },
  dueTextUrgent: {
    color: colors.red,
  },
  dueTextCompleted: {
    color: colors.green,
  },
});
