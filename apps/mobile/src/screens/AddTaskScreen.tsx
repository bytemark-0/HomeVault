import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { MaintenanceTask, RoomArea } from '@homevault/domain';
import type { CreateTaskInput, UpdateTaskInput } from '@homevault/database';

import type { AssetListItem, TaskListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type AddTaskScreenProps = {
  propertyId: string;
  assets: AssetListItem[];
  rooms?: RoomArea[];
  initialScopeId?: string;
  task?: TaskListItem;
  onCancel: () => void;
  onSave: (input: CreateTaskInput | UpdateTaskInput) => Promise<void>;
};

type FormState = {
  title: string;
  scopeId: string;
  dueDate: string;
  recurrenceLabel: string;
  instructions: string;
};

const recurrenceOptions = ['One time', 'Monthly', 'Every 90 days', 'Twice a year', 'Yearly'];

export function AddTaskScreen({
  propertyId,
  assets,
  rooms = [],
  initialScopeId,
  task,
  onCancel,
  onSave,
}: AddTaskScreenProps) {
  const [form, setForm] = useState<FormState>({
    title: task?.title ?? '',
    scopeId: task?.scopeId ?? initialScopeId ?? assets[0]?.id ?? propertyId,
    dueDate: task?.dueDate ?? toDateInputValue(new Date()),
    recurrenceLabel: task?.recurrenceLabel ?? 'Monthly',
    instructions: task?.instructions ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const canSave = useMemo(
    () => form.title.trim().length > 0 && form.dueDate.trim().length > 0 && !isSaving,
    [form.dueDate, form.title, isSaving],
  );

  async function handleSave() {
    if (!canSave) {
      return;
    }

    setIsSaving(true);

    try {
      const isPropertyScoped = form.scopeId === propertyId;
      const isRoomScoped = rooms.some((room) => room.id === form.scopeId);

      await onSave({
        id: task?.id,
        propertyId,
        scope: isPropertyScoped ? 'property' : isRoomScoped ? 'room' : 'asset',
        scopeId: form.scopeId,
        title: form.title.trim(),
        dueDate: form.dueDate.trim(),
        recurrenceKind: form.recurrenceLabel === 'One time' ? 'one_time' : 'interval',
        recurrenceLabel: form.recurrenceLabel,
        state: task?.state === 'completed' ? 'completed' : getTaskState(form.dueDate),
        instructions: cleanOptional(form.instructions),
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Maintenance</Text>
          <Text style={styles.title}>{task ? 'Edit task' : 'New task'}</Text>
        </View>
        <Pressable onPress={onCancel} style={styles.cancelButton} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Field
          label="Title"
          value={form.title}
          placeholder="Replace filter, flush tank, test detector"
          onChangeText={(title) => setForm((current) => ({ ...current, title }))}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Link to</Text>
          <View style={styles.optionGrid}>
            <OptionPill
              label="Whole home"
              isSelected={form.scopeId === propertyId}
              onPress={() => setForm((current) => ({ ...current, scopeId: propertyId }))}
            />
            {rooms.map((room) => (
              <OptionPill
                key={room.id}
                label={room.name}
                isSelected={form.scopeId === room.id}
                onPress={() => setForm((current) => ({ ...current, scopeId: room.id }))}
              />
            ))}
            {assets.map((asset) => (
              <OptionPill
                key={asset.id}
                label={asset.name}
                isSelected={form.scopeId === asset.id}
                onPress={() => setForm((current) => ({ ...current, scopeId: asset.id }))}
              />
            ))}
          </View>
        </View>

        <Field
          label="Due date"
          value={form.dueDate}
          placeholder="2026-06-12"
          onChangeText={(dueDate) => setForm((current) => ({ ...current, dueDate }))}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Repeats</Text>
          <View style={styles.optionGrid}>
            {recurrenceOptions.map((option) => (
              <OptionPill
                key={option}
                label={option}
                isSelected={form.recurrenceLabel === option}
                onPress={() => setForm((current) => ({ ...current, recurrenceLabel: option }))}
              />
            ))}
          </View>
        </View>

        <Field
          label="Instructions"
          value={form.instructions}
          placeholder="Filter size, shutoff location, safety notes"
          multiline
          onChangeText={(instructions) => setForm((current) => ({ ...current, instructions }))}
        />
      </View>

      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        accessibilityRole="button"
      >
        <Text style={styles.saveText}>
          {isSaving ? 'Saving' : task ? 'Save changes' : 'Save task'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
};

function Field({ label, value, placeholder, onChangeText, multiline }: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
        multiline={multiline}
        style={[styles.input, multiline && styles.multilineInput]}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

function OptionPill({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.optionPill, isSelected && styles.optionPillActive]}
      accessibilityRole="button"
    >
      <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>{label}</Text>
    </Pressable>
  );
}

function cleanOptional(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function getTaskState(dueDate: string): MaintenanceTask['state'] {
  const today = toDateInputValue(new Date());

  if (dueDate < today) {
    return 'overdue';
  }

  if (dueDate === today) {
    return 'due_today';
  }

  return 'upcoming';
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
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
    minHeight: 66,
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
  fieldGroup: {
    gap: 7,
  },
  label: {
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
  multilineInput: {
    minHeight: 88,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionPillActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenSoft,
  },
  optionText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  optionTextActive: {
    color: colors.green,
  },
  saveButton: {
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: colors.green,
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
