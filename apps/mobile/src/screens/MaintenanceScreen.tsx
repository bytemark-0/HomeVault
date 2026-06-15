import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SectionTitle } from '../components/SectionTitle';
import { TaskRow } from '../components/TaskRow';
import type { TaskListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type MaintenanceScreenProps = {
  tasks: TaskListItem[];
  onAddTask: () => void;
  onCompleteTask: (taskId: string) => void;
  onRecordRepair: () => void;
  onSnoozeTask: (taskId: string) => void;
  onTaskPress: (taskId: string) => void;
};

const stateFilters = ['All', 'Urgent', 'Upcoming', 'Snoozed', 'Completed'];

export function MaintenanceScreen({
  tasks,
  onAddTask,
  onCompleteTask,
  onRecordRepair,
  onSnoozeTask,
  onTaskPress,
}: MaintenanceScreenProps) {
  const [query, setQuery] = useState('');
  const [activeState, setActiveState] = useState('All');
  const focusTask = tasks.find((task) => task.state === 'overdue' || task.state === 'due_today');
  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesState =
        activeState === 'All' ||
        (activeState === 'Urgent' && (task.state === 'overdue' || task.state === 'due_today')) ||
        (activeState === 'Upcoming' && task.state === 'upcoming') ||
        (activeState === 'Snoozed' && task.state === 'snoozed') ||
        (activeState === 'Completed' && task.state === 'completed');
      const searchableText = [
        task.title,
        task.scopeLabel,
        task.recurrenceLabel,
        task.dueLabel,
        task.instructions ?? '',
      ]
        .join(' ')
        .toLowerCase();
      const matchesQuery = normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

      return matchesState && matchesQuery;
    });
  }, [activeState, query, tasks]);

  return (
    <View style={styles.screen}>
      <View style={styles.focusPanel}>
        <Text style={styles.kicker}>{focusTask ? 'Next completion' : 'All caught up'}</Text>
        <Text style={styles.focusTitle}>
          {focusTask ? focusTask.title : 'No tasks need attention'}
        </Text>
        <Text style={styles.focusMeta}>
          {focusTask
            ? `${focusTask.scopeLabel} · ${focusTask.recurrenceLabel}`
            : 'Upcoming and completed work stays in the maintenance list.'}
        </Text>
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.primaryAction, !focusTask && styles.primaryActionDisabled]}
            disabled={!focusTask}
            onPress={() => {
              if (focusTask) {
                onCompleteTask(focusTask.id);
              }
            }}
            accessibilityRole="button"
          >
            <Text style={styles.primaryActionText}>Complete</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryAction, !focusTask && styles.secondaryActionDisabled]}
            disabled={!focusTask}
            onPress={() => {
              if (focusTask) {
                onSnoozeTask(focusTask.id);
              }
            }}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryActionText}>Snooze</Text>
          </Pressable>
          <Pressable
            style={styles.repairAction}
            onPress={onRecordRepair}
            accessibilityRole="button"
            accessibilityLabel="Record repair"
          >
            <Text style={styles.repairActionText}>Repair</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search task, asset, recurrence"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterRow}>
        {stateFilters.map((filter) => {
          const isActive = filter === activeState;

          return (
            <Pressable
              key={filter}
              onPress={() => setActiveState(filter)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              accessibilityRole="button"
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle title="Maintenance" action="New task" onActionPress={onAddTask} />
      {tasks.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>Create the first maintenance task</Text>
          <Text style={styles.emptyText}>
            Track filter changes, seasonal checks, warranty deadlines, and recurring service.
          </Text>
          <Pressable onPress={onAddTask} style={styles.emptyAction} accessibilityRole="button">
            <Text style={styles.emptyActionText}>New task</Text>
          </Pressable>
        </View>
      ) : filteredTasks.length > 0 ? (
        filteredTasks.map((task) => (
          <TaskRow key={task.id} task={task} onPress={onTaskPress} />
        ))
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>No tasks found</Text>
          <Text style={styles.emptyText}>Try another search or state filter.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 14,
  },
  focusPanel: {
    backgroundColor: colors.blueSoft,
    borderColor: '#B9D2E7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  kicker: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  focusTitle: {
    color: colors.ink,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
    letterSpacing: 0,
  },
  focusMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  searchBox: {
    minHeight: 48,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  searchInput: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  filterText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  primaryAction: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionDisabled: {
    backgroundColor: '#9AB8AC',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryAction: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionDisabled: {
    opacity: 0.55,
  },
  secondaryActionText: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: '900',
  },
  repairAction: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repairActionText: {
    color: colors.amber,
    fontSize: 14,
    fontWeight: '900',
  },
  emptyPanel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 8,
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
  emptyAction: {
    alignSelf: 'flex-start',
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
