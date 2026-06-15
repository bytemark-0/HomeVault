import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { TaskListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type SnoozeTaskScreenProps = {
  task: TaskListItem;
  onCancel: () => void;
  onSave: (taskId: string, dueDate: string) => Promise<void>;
};

type SnoozePreset = {
  label: string;
  days: number;
};

const snoozePresets: SnoozePreset[] = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
];

export function SnoozeTaskScreen({ task, onCancel, onSave }: SnoozeTaskScreenProps) {
  const [selectedPreset, setSelectedPreset] = useState<SnoozePreset>(snoozePresets[0]!);
  const [customDate, setCustomDate] = useState('');
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const computedDueDate = useMemo(() => {
    if (useCustomDate) {
      return customDate.trim();
    }

    return addDaysToDateInput(new Date(), selectedPreset.days);
  }, [customDate, selectedPreset, useCustomDate]);

  const customDateError = useMemo(() => {
    if (!useCustomDate || customDate.trim().length === 0) {
      return 'Enter a date.';
    }

    return isValidDateInput(customDate.trim()) ? undefined : 'Use YYYY-MM-DD.';
  }, [customDate, useCustomDate]);

  const canSave = useMemo(() => {
    if (isSaving) {
      return false;
    }

    if (useCustomDate) {
      return !customDateError;
    }

    return true;
  }, [customDateError, isSaving, useCustomDate]);

  async function handleSave() {
    if (!canSave) {
      return;
    }

    setIsSaving(true);

    try {
      await onSave(task.id, computedDueDate);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Maintenance</Text>
          <Text style={styles.title}>Snooze task</Text>
          <Text style={styles.subtitle}>{task.title}</Text>
        </View>
        <Pressable onPress={onCancel} style={styles.cancelButton} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionLabel}>Snooze until</Text>
        <View style={styles.presetGrid}>
          {snoozePresets.map((preset) => {
            const isSelected = !useCustomDate && preset.label === selectedPreset.label;

            return (
              <Pressable
                key={preset.label}
                onPress={() => {
                  setSelectedPreset(preset);
                  setUseCustomDate(false);
                }}
                style={[styles.presetPill, isSelected && styles.presetPillActive]}
                accessibilityRole="button"
              >
                <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => setUseCustomDate(true)}
            style={[styles.presetPill, useCustomDate && styles.presetPillActive]}
            accessibilityRole="button"
          >
            <Text style={[styles.presetText, useCustomDate && styles.presetTextActive]}>
              Pick date
            </Text>
          </Pressable>
        </View>

        {useCustomDate ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Custom date</Text>
            <TextInput
              value={customDate}
              onChangeText={setCustomDate}
              placeholder="2026-09-01"
              placeholderTextColor={colors.muted}
              style={[styles.input, customDateError && customDate.trim().length > 0 && styles.inputError]}
            />
            {customDateError && customDate.trim().length > 0 ? (
              <Text style={styles.errorText}>{customDateError}</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {computedDueDate && !customDateError ? (
        <View style={styles.summaryPanel}>
          <Text style={styles.summaryLabel}>Snoozed to</Text>
          <Text style={styles.summaryDate}>{formatDate(computedDueDate)}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        accessibilityRole="button"
      >
        <Text style={styles.saveText}>{isSaving ? 'Snoozing...' : 'Snooze task'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function addDaysToDateInput(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate.toISOString().slice(0, 10);
}

function isValidDateInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
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
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  kicker: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 2,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  cancelButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  panel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 14,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetPill: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetPillActive: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
  },
  presetText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  presetTextActive: {
    color: colors.blue,
  },
  fieldGroup: {
    gap: 7,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  input: {
    minHeight: 44,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    color: colors.ink,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '800',
  },
  inputError: {
    borderColor: colors.red,
  },
  errorText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  summaryPanel: {
    borderRadius: 8,
    borderColor: '#B9D2E7',
    borderWidth: 1,
    backgroundColor: colors.blueSoft,
    padding: 14,
    gap: 4,
  },
  summaryLabel: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  summaryDate: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  saveButton: {
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.muted,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
