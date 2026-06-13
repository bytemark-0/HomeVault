import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { CreateRepairEventInput } from '@homevault/database';

import type { AssetListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type AddRepairEventScreenProps = {
  asset: AssetListItem;
  onCancel: () => void;
  onSave: (input: CreateRepairEventInput) => Promise<void>;
};

type FormState = {
  issue: string;
  provider: string;
  diagnosis: string;
  resolution: string;
  cost: string;
  date: string;
};

export function AddRepairEventScreen({ asset, onCancel, onSave }: AddRepairEventScreenProps) {
  const [form, setForm] = useState<FormState>({
    issue: '',
    provider: '',
    diagnosis: '',
    resolution: '',
    cost: '',
    date: toDateInputValue(new Date()),
  });
  const [isSaving, setIsSaving] = useState(false);

  const canSave = useMemo(
    () => form.issue.trim().length > 0 && form.date.trim().length > 0 && !isSaving,
    [form.date, form.issue, isSaving],
  );

  async function handleSave() {
    if (!canSave) {
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        propertyId: asset.propertyId,
        assetId: asset.id,
        issue: form.issue.trim(),
        provider: cleanOptional(form.provider),
        diagnosis: cleanOptional(form.diagnosis),
        resolution: cleanOptional(form.resolution),
        costCents: parseAmountCents(form.cost),
        date: form.date.trim(),
        documentIds: [],
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
          <Text style={styles.kicker}>Repair history</Text>
          <Text style={styles.title}>Record repair</Text>
          <Text style={styles.subtitle}>{asset.name}</Text>
        </View>
        <Pressable onPress={onCancel} style={styles.cancelButton} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Field
          label="Issue"
          value={form.issue}
          placeholder="Leak, error code, weak airflow"
          onChangeText={(issue) => setForm((current) => ({ ...current, issue }))}
        />
        <Field
          label="Provider"
          value={form.provider}
          placeholder="Contractor, shop, or self"
          onChangeText={(provider) => setForm((current) => ({ ...current, provider }))}
        />
        <Field
          label="Diagnosis"
          value={form.diagnosis}
          placeholder="What caused it"
          multiline
          onChangeText={(diagnosis) => setForm((current) => ({ ...current, diagnosis }))}
        />
        <Field
          label="Resolution"
          value={form.resolution}
          placeholder="What was repaired or replaced"
          multiline
          onChangeText={(resolution) => setForm((current) => ({ ...current, resolution }))}
        />
        <Field
          label="Cost"
          value={form.cost}
          placeholder="249.00"
          keyboardType="decimal-pad"
          onChangeText={(cost) => setForm((current) => ({ ...current, cost }))}
        />
        <Field
          label="Date"
          value={form.date}
          placeholder="2026-06-12"
          onChangeText={(date) => setForm((current) => ({ ...current, date }))}
        />
      </View>

      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        accessibilityRole="button"
      >
        <Text style={styles.saveText}>{isSaving ? 'Saving' : 'Save repair'}</Text>
      </Pressable>
    </ScrollView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
  multiline?: boolean;
};

function Field({
  label,
  value,
  placeholder,
  onChangeText,
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
        style={[styles.input, multiline && styles.multilineInput]}
        placeholderTextColor={colors.muted}
      />
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
