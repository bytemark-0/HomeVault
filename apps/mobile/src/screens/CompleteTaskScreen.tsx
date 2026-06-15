import { useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

import type { CompleteTaskInput, UpdateTaskCompletionInput } from '@homevault/database';
import type { TaskCompletion } from '@homevault/domain';

import type { TaskListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type CompleteTaskScreenProps = {
  task: TaskListItem;
  completion?: TaskCompletion;
  onCancel: () => void;
  onSave: (input: CompleteTaskInput | UpdateTaskCompletionInput) => Promise<void>;
};

type FormState = {
  completedAt: string;
  cost: string;
  notes: string;
  photoUri: string;
};

export function CompleteTaskScreen({ task, completion, onCancel, onSave }: CompleteTaskScreenProps) {
  const isEditing = completion !== undefined;
  const [form, setForm] = useState<FormState>({
    completedAt: completion ? toDateInputValue(new Date(completion.completedAt)) : toDateInputValue(new Date()),
    cost: completion?.costCents != null ? String(completion.costCents / 100) : '',
    notes: completion?.notes ?? '',
    photoUri: completion?.photoUri ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const errors = useMemo(
    () => ({
      completedAt:
        form.completedAt.trim().length === 0
          ? 'Completed date is required.'
          : !isValidDateInput(form.completedAt)
            ? 'Use YYYY-MM-DD.'
            : undefined,
      cost:
        form.cost.trim().length > 0 && !isValidAmountInput(form.cost)
          ? 'Enter a valid cost.'
          : undefined,
    }),
    [form.completedAt, form.cost],
  );

  const canSave = useMemo(
    () => !errors.completedAt && !errors.cost && !isSaving,
    [errors.completedAt, errors.cost, isSaving],
  );

  async function handlePickPhoto(source: 'library' | 'camera') {
    let result: ImagePicker.ImagePickerResult;

    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        return;
      }

      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
    }

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const pickedUri = result.assets[0].uri;
    const storedUri = await copyPhotoToAppStorage(pickedUri);

    setForm((current) => ({ ...current, photoUri: storedUri ?? pickedUri }));
  }

  async function handleSave() {
    if (!canSave) {
      return;
    }

    setIsSaving(true);

    try {
      if (isEditing && completion) {
        await onSave({
          ...completion,
          completedAt: toCompletedAtIso(form.completedAt),
          costCents: parseAmountCents(form.cost),
          notes: cleanOptional(form.notes),
          photoUri: form.photoUri || undefined,
        });
      } else {
        await onSave({
          taskId: task.id,
          completedAt: toCompletedAtIso(form.completedAt),
          costCents: parseAmountCents(form.cost),
          notes: cleanOptional(form.notes),
          photoUri: form.photoUri || undefined,
        });
      }
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
          <Text style={styles.title}>{isEditing ? 'Edit completion' : 'Complete task'}</Text>
          <Text style={styles.subtitle}>{task.title}</Text>
        </View>
        <Pressable onPress={onCancel} style={styles.cancelButton} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      {task.instructions ? (
        <View style={styles.instructionsPanel}>
          <Text style={styles.instructionsLabel}>Instructions</Text>
          <Text style={styles.instructionsText}>{task.instructions}</Text>
        </View>
      ) : null}

      <View style={styles.panel}>
        <Field
          label="Completed date"
          value={form.completedAt}
          placeholder="2026-06-12"
          error={errors.completedAt}
          onChangeText={(completedAt) => setForm((current) => ({ ...current, completedAt }))}
        />
        <Field
          label="Cost"
          value={form.cost}
          placeholder="49.99"
          keyboardType="decimal-pad"
          error={errors.cost}
          onChangeText={(cost) => setForm((current) => ({ ...current, cost }))}
        />
        <Field
          label="Notes"
          value={form.notes}
          placeholder="What was done, parts used, condition found"
          multiline
          onChangeText={(notes) => setForm((current) => ({ ...current, notes }))}
        />
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Photo</Text>
          {form.photoUri ? (
            <View style={styles.photoPreviewBox}>
              <Image source={{ uri: form.photoUri }} style={styles.photoPreview} resizeMode="cover" accessibilityLabel="Completion photo" />
              <Pressable
                onPress={() => setForm((current) => ({ ...current, photoUri: '' }))}
                style={styles.photoRemoveButton}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
              >
                <Text style={styles.photoRemoveText}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.photoPickerRow}>
              <Pressable
                onPress={() => handlePickPhoto('library')}
                style={styles.photoPickerButton}
                accessibilityRole="button"
              >
                <Text style={styles.photoPickerText}>Choose from library</Text>
              </Pressable>
              <Pressable
                onPress={() => handlePickPhoto('camera')}
                style={styles.photoPickerButton}
                accessibilityRole="button"
              >
                <Text style={styles.photoPickerText}>Take photo</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        accessibilityRole="button"
      >
        <Text style={styles.saveText}>{isSaving ? 'Saving' : isEditing ? 'Save changes' : 'Save completion'}</Text>
      </Pressable>
    </ScrollView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  error?: string;
  keyboardType?: 'default' | 'decimal-pad';
  multiline?: boolean;
};

function Field({
  label,
  value,
  placeholder,
  onChangeText,
  error,
  keyboardType,
  multiline,
}: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, error && styles.inputError, multiline && styles.multilineInput]}
        placeholderTextColor={colors.muted}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function cleanOptional(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function parseAmountCents(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? Math.round(parsed * 100) : undefined;
}

function isValidDateInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

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

function isValidAmountInput(value: string) {
  const parsed = Number(value.trim());

  return Number.isFinite(parsed) && parsed >= 0;
}

function toCompletedAtIso(value: string) {
  const [year, month, day] = value.trim().split('-').map(Number);

  if (!year || !month || !day) {
    return new Date().toISOString();
  }

  return new Date(year, month - 1, day, 12).toISOString();
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
  instructionsPanel: {
    borderRadius: 8,
    borderColor: colors.green,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 6,
  },
  instructionsLabel: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  instructionsText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
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
  inputError: {
    borderColor: colors.red,
  },
  errorText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  multilineInput: {
    minHeight: 96,
    paddingTop: 12,
    textAlignVertical: 'top',
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
  photoPreviewBox: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
  photoRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  photoPickerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoPickerButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPickerText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
});

async function copyPhotoToAppStorage(sourceUri: string): Promise<string | null> {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return null;
  }

  try {
    const directoryUri = `${FileSystem.documentDirectory}homevault-assets/`;
    const fileName = `completion-photo-${Date.now()}.jpg`;
    const fileUri = `${directoryUri}${fileName}`;

    await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
    await FileSystem.copyAsync({ from: sourceUri, to: fileUri });

    return fileUri;
  } catch {
    return null;
  }
}
