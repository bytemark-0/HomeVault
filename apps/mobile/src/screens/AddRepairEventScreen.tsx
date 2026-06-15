import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { CreateRepairEventInput, UpdateRepairEventInput } from '@homevault/database';
import type { RepairEvent } from '@homevault/domain';

import type { AssetListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type AddRepairEventScreenProps = {
  asset?: AssetListItem;
  assets: AssetListItem[];
  propertyId: string;
  repairEvent?: RepairEvent;
  onCancel: () => void;
  onSave: (input: CreateRepairEventInput | UpdateRepairEventInput) => Promise<void>;
};

type FormState = {
  issue: string;
  provider: string;
  diagnosis: string;
  resolution: string;
  cost: string;
  date: string;
};

export function AddRepairEventScreen({
  asset,
  assets,
  propertyId,
  repairEvent,
  onCancel,
  onSave,
}: AddRepairEventScreenProps) {
  const isEditing = repairEvent !== undefined;
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(asset?.id ?? null);
  const [form, setForm] = useState<FormState>({
    issue: repairEvent?.issue ?? '',
    provider: repairEvent?.provider ?? '',
    diagnosis: repairEvent?.diagnosis ?? '',
    resolution: repairEvent?.resolution ?? '',
    cost: repairEvent?.costCents != null ? String(repairEvent.costCents / 100) : '',
    date: repairEvent?.date ?? toDateInputValue(new Date()),
  });
  const [isSaving, setIsSaving] = useState(false);

  const resolvedAsset = asset ?? assets.find((a) => a.id === selectedAssetId);

  const errors = useMemo(
    () => ({
      asset: !resolvedAsset ? 'Select an asset.' : undefined,
      issue: form.issue.trim().length === 0 ? 'Issue is required.' : undefined,
      date:
        form.date.trim().length === 0
          ? 'Date is required.'
          : !isValidDateInput(form.date)
            ? 'Use YYYY-MM-DD.'
            : undefined,
      cost:
        form.cost.trim().length > 0 && !isValidAmountInput(form.cost)
          ? 'Enter a valid cost.'
          : undefined,
    }),
    [form.cost, form.date, form.issue, resolvedAsset],
  );

  const canSave = useMemo(
    () => !errors.asset && !errors.issue && !errors.date && !errors.cost && !isSaving,
    [errors.asset, errors.cost, errors.date, errors.issue, isSaving],
  );

  async function handleSave() {
    if (!canSave || !resolvedAsset) {
      return;
    }

    setIsSaving(true);

    try {
      if (isEditing && repairEvent) {
        await onSave({
          ...repairEvent,
          issue: form.issue.trim(),
          provider: cleanOptional(form.provider),
          diagnosis: cleanOptional(form.diagnosis),
          resolution: cleanOptional(form.resolution),
          costCents: parseAmountCents(form.cost),
          date: form.date.trim(),
        });
      } else {
        await onSave({
          propertyId,
          assetId: resolvedAsset.id,
          issue: form.issue.trim(),
          provider: cleanOptional(form.provider),
          diagnosis: cleanOptional(form.diagnosis),
          resolution: cleanOptional(form.resolution),
          costCents: parseAmountCents(form.cost),
          date: form.date.trim(),
          documentIds: [],
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
          <Text style={styles.kicker}>Repair history</Text>
          <Text style={styles.title}>{isEditing ? 'Edit repair' : 'Record repair'}</Text>
          {resolvedAsset ? (
            <Text style={styles.subtitle}>{resolvedAsset.name}</Text>
          ) : null}
        </View>
        <Pressable onPress={onCancel} style={styles.cancelButton} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      {!isEditing && !asset && assets.length > 0 ? (
        <View style={styles.panel}>
          <Text style={styles.sectionLabel}>Asset</Text>
          <View style={styles.assetGrid}>
            {assets.map((a) => {
              const isSelected = a.id === selectedAssetId;

              return (
                <Pressable
                  key={a.id}
                  onPress={() => setSelectedAssetId(a.id)}
                  style={[styles.assetPill, isSelected && styles.assetPillActive]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[styles.assetPillText, isSelected && styles.assetPillTextActive]}
                    numberOfLines={1}
                  >
                    {a.name}
                  </Text>
                  {isSelected ? null : (
                    <Text style={styles.assetPillMeta} numberOfLines={1}>
                      {a.category}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.panel}>
        <Field
          label="Issue"
          value={form.issue}
          placeholder="Leak, error code, weak airflow"
          error={errors.issue}
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
          error={errors.cost}
          onChangeText={(cost) => setForm((current) => ({ ...current, cost }))}
        />
        <Field
          label="Date"
          value={form.date}
          placeholder="2026-06-12"
          error={errors.date}
          onChangeText={(date) => setForm((current) => ({ ...current, date }))}
        />
      </View>

      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        accessibilityRole="button"
      >
        <Text style={styles.saveText}>{isSaving ? 'Saving' : isEditing ? 'Save changes' : 'Save repair'}</Text>
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
  sectionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  assetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assetPill: {
    maxWidth: '48%',
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    gap: 2,
  },
  assetPillActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenSoft,
  },
  assetPillText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  assetPillTextActive: {
    color: colors.green,
  },
  assetPillMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
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
