import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { DocumentRecord, RoomArea } from '@homevault/domain';
import type { CreateDocumentInput, UpdateDocumentInput } from '@homevault/database';

import type { AssetListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type AddDocumentScreenProps = {
  propertyId: string;
  assets: AssetListItem[];
  rooms?: RoomArea[];
  document?: DocumentRecord;
  initialLinkedRecordId?: string;
  onCancel: () => void;
  onSave: (input: CreateDocumentInput | UpdateDocumentInput) => Promise<void>;
};

type FormState = {
  title: string;
  type: DocumentRecord['type'];
  linkedRecordId: string;
  date: string;
  vendor: string;
  amount: string;
};

const documentTypes: Array<{ label: string; value: DocumentRecord['type'] }> = [
  { label: 'Receipt', value: 'receipt' },
  { label: 'Manual', value: 'manual' },
  { label: 'Warranty', value: 'warranty' },
  { label: 'Invoice', value: 'invoice' },
  { label: 'Report', value: 'report' },
];

export function AddDocumentScreen({
  propertyId,
  assets,
  rooms = [],
  document,
  initialLinkedRecordId,
  onCancel,
  onSave,
}: AddDocumentScreenProps) {
  const [form, setForm] = useState<FormState>({
    title: document?.title ?? '',
    type: document?.type ?? 'receipt',
    linkedRecordId: document?.linkedRecordIds[0] ?? initialLinkedRecordId ?? assets[0]?.id ?? propertyId,
    date: document?.date ?? '',
    vendor: document?.vendor ?? '',
    amount: formatAmountInput(document?.amountCents),
  });
  const [isSaving, setIsSaving] = useState(false);

  const canSave = useMemo(() => form.title.trim().length > 0 && !isSaving, [form.title, isSaving]);

  async function handleSave() {
    if (!canSave) {
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        id: document?.id,
        propertyId,
        title: form.title.trim(),
        type: form.type,
        filePath: document?.filePath,
        date: cleanOptional(form.date),
        vendor: cleanOptional(form.vendor),
        amountCents: parseAmountCents(form.amount),
        ocrText: document?.ocrText,
        linkedRecordIds: [form.linkedRecordId],
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
          <Text style={styles.kicker}>Documents</Text>
          <Text style={styles.title}>{document ? 'Edit document' : 'Add document'}</Text>
        </View>
        <Pressable onPress={onCancel} style={styles.cancelButton} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Field
          label="Title"
          value={form.title}
          placeholder="Receipt, manual, inspection report"
          onChangeText={(title) => setForm((current) => ({ ...current, title }))}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.optionGrid}>
            {documentTypes.map((option) => {
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

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Link to</Text>
          <View style={styles.optionGrid}>
            <RecordPill
              label="Property"
              isSelected={form.linkedRecordId === propertyId}
              onPress={() => setForm((current) => ({ ...current, linkedRecordId: propertyId }))}
            />
            {rooms.map((room) => (
              <RecordPill
                key={room.id}
                label={room.name}
                isSelected={form.linkedRecordId === room.id}
                onPress={() => setForm((current) => ({ ...current, linkedRecordId: room.id }))}
              />
            ))}
            {assets.map((asset) => (
              <RecordPill
                key={asset.id}
                label={asset.name}
                isSelected={form.linkedRecordId === asset.id}
                onPress={() => setForm((current) => ({ ...current, linkedRecordId: asset.id }))}
              />
            ))}
          </View>
        </View>

        <Field
          label="Date"
          value={form.date}
          placeholder="2026-06-12"
          onChangeText={(date) => setForm((current) => ({ ...current, date }))}
        />
        <Field
          label="Vendor"
          value={form.vendor}
          placeholder="Store, contractor, manufacturer"
          onChangeText={(vendor) => setForm((current) => ({ ...current, vendor }))}
        />
        <Field
          label="Amount"
          value={form.amount}
          placeholder="129.99"
          keyboardType="decimal-pad"
          onChangeText={(amount) => setForm((current) => ({ ...current, amount }))}
        />
      </View>

      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        accessibilityRole="button"
      >
        <Text style={styles.saveText}>
          {isSaving ? 'Saving' : document ? 'Save changes' : 'Save document'}
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
  keyboardType?: 'default' | 'decimal-pad';
};

function Field({ label, value, placeholder, onChangeText, keyboardType }: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={styles.input}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

function RecordPill({
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

function parseAmountCents(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? Math.round(parsed * 100) : undefined;
}

function formatAmountInput(value?: number) {
  if (value === undefined) {
    return '';
  }

  return (value / 100).toFixed(2);
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
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 14,
  },
  fieldGroup: {
    gap: 7,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    minHeight: 46,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: colors.ink,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '700',
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
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionPillActive: {
    borderColor: colors.green,
    backgroundColor: colors.green,
  },
  optionText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9AB8AC',
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
