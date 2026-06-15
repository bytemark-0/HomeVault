import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { Property } from '@homevault/domain';
import type { UpdatePropertyInput } from '@homevault/database';

import { colors } from '../theme/colors';

type EditPropertyScreenProps = {
  property: Property;
  onCancel: () => void;
  onSave: (input: UpdatePropertyInput) => Promise<void>;
};

type FormState = {
  label: string;
  addressLabel: string;
  type: Property['type'];
  yearBuilt: string;
  purchaseDate: string;
};

const propertyTypes: Array<{ label: string; value: Property['type'] }> = [
  { label: 'Single family', value: 'single_family' },
  { label: 'Townhome', value: 'townhome' },
  { label: 'Condo', value: 'condo' },
  { label: 'Multi-unit', value: 'multi_unit' },
  { label: 'Other', value: 'other' },
];

export function EditPropertyScreen({ property, onCancel, onSave }: EditPropertyScreenProps) {
  const [form, setForm] = useState<FormState>({
    label: property.label,
    addressLabel: property.addressLabel ?? '',
    type: property.type,
    yearBuilt: property.yearBuilt ? String(property.yearBuilt) : '',
    purchaseDate: property.purchaseDate ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const errors = useMemo(
    () => ({
      label: form.label.trim().length === 0 ? 'Home name is required.' : undefined,
      yearBuilt:
        form.yearBuilt.trim().length > 0 && !isValidYear(form.yearBuilt)
          ? 'Enter a four-digit year.'
          : undefined,
      purchaseDate:
        form.purchaseDate.trim().length > 0 && !isValidDateInput(form.purchaseDate)
          ? 'Use YYYY-MM-DD.'
          : undefined,
    }),
    [form.label, form.purchaseDate, form.yearBuilt],
  );

  const canSave = useMemo(
    () => !errors.label && !errors.yearBuilt && !errors.purchaseDate && !isSaving,
    [errors.label, errors.purchaseDate, errors.yearBuilt, isSaving],
  );

  async function handleSave() {
    if (!canSave) {
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        ...property,
        label: form.label.trim(),
        addressLabel: cleanOptional(form.addressLabel),
        type: form.type,
        yearBuilt: parseYear(form.yearBuilt),
        purchaseDate: cleanOptional(form.purchaseDate),
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
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Household</Text>
          <Text style={styles.title}>Edit home</Text>
        </View>
        <Pressable onPress={onCancel} style={styles.cancelButton} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Field
          label="Home name"
          value={form.label}
          placeholder="Maple Street home"
          error={errors.label}
          onChangeText={(label) => setForm((current) => ({ ...current, label }))}
        />
        <Field
          label="Address label"
          value={form.addressLabel}
          placeholder="Street, neighborhood, or city"
          onChangeText={(addressLabel) =>
            setForm((current) => ({ ...current, addressLabel }))
          }
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.optionGrid}>
            {propertyTypes.map((option) => {
              const isSelected = option.value === form.type;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => setForm((current) => ({ ...current, type: option.value }))}
                  style={[styles.optionPill, isSelected && styles.optionPillActive]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Field
          label="Year built"
          value={form.yearBuilt}
          placeholder="1998"
          keyboardType="number-pad"
          error={errors.yearBuilt}
          onChangeText={(yearBuilt) => setForm((current) => ({ ...current, yearBuilt }))}
        />
        <Field
          label="Purchase date"
          value={form.purchaseDate}
          placeholder="2023-08-15"
          error={errors.purchaseDate}
          onChangeText={(purchaseDate) =>
            setForm((current) => ({ ...current, purchaseDate }))
          }
        />
      </View>

      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        accessibilityRole="button"
      >
        <Text style={styles.saveText}>{isSaving ? 'Saving' : 'Save home'}</Text>
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
  keyboardType?: 'default' | 'number-pad';
};

function Field({ label, value, placeholder, onChangeText, error, keyboardType }: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={[styles.input, error && styles.inputError]}
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

function parseYear(value: string) {
  const parsed = Number(value.trim());

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function isValidYear(value: string) {
  const parsed = Number(value.trim());
  const currentYear = new Date().getFullYear();

  return Number.isInteger(parsed) && parsed >= 1700 && parsed <= currentYear + 1;
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
  inputError: {
    borderColor: colors.red,
  },
  errorText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
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
