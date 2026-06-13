import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { Asset, RoomArea } from '@homevault/domain';
import type { CreateAssetInput, UpdateAssetInput } from '@homevault/database';

import { colors } from '../theme/colors';

type AddAssetScreenProps = {
  propertyId: string;
  rooms: RoomArea[];
  asset?: Asset;
  initialRoomId?: string;
  onCancel: () => void;
  onSave: (input: CreateAssetInput | UpdateAssetInput) => Promise<void>;
};

type FormState = {
  name: string;
  category: string;
  roomId?: string;
  brand: string;
  model: string;
  serial: string;
  status: Asset['status'];
  notes: string;
};

const statusOptions: Array<{ label: string; value: Asset['status'] }> = [
  { label: 'Ready', value: 'ready' },
  { label: 'Needs attention', value: 'needs_attention' },
  { label: 'Warranty soon', value: 'warranty_soon' },
];

export function AddAssetScreen({
  propertyId,
  rooms,
  asset,
  initialRoomId,
  onCancel,
  onSave,
}: AddAssetScreenProps) {
  const [form, setForm] = useState<FormState>({
    name: asset?.name ?? '',
    category: asset?.category ?? 'Appliance',
    roomId: asset?.roomId ?? initialRoomId ?? rooms[0]?.id,
    brand: asset?.brand ?? '',
    model: asset?.model ?? '',
    serial: asset?.serial ?? '',
    status: asset?.status ?? 'ready',
    notes: asset?.notes ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const canSave = useMemo(
    () => form.name.trim().length > 0 && form.category.trim().length > 0 && !isSaving,
    [form.category, form.name, isSaving],
  );

  async function handleSave() {
    if (!canSave) {
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        id: asset?.id,
        propertyId,
        roomId: form.roomId,
        name: form.name.trim(),
        category: form.category.trim(),
        brand: cleanOptional(form.brand),
        model: cleanOptional(form.model),
        serial: cleanOptional(form.serial),
        status: form.status,
        notes: cleanOptional(form.notes),
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
          <Text style={styles.kicker}>Inventory</Text>
          <Text style={styles.title}>{asset ? 'Edit asset' : 'Add asset'}</Text>
        </View>
        <Pressable onPress={onCancel} style={styles.cancelButton} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Field
          label="Name"
          value={form.name}
          placeholder="Dishwasher, roof, breaker panel"
          onChangeText={(name) => setForm((current) => ({ ...current, name }))}
        />
        <Field
          label="Category"
          value={form.category}
          placeholder="Appliance, plumbing, exterior"
          onChangeText={(category) => setForm((current) => ({ ...current, category }))}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Room or area</Text>
          <View style={styles.optionGrid}>
            {rooms.map((room) => {
              const isSelected = room.id === form.roomId;

              return (
                <Pressable
                  key={room.id}
                  onPress={() => setForm((current) => ({ ...current, roomId: room.id }))}
                  style={[styles.optionPill, isSelected && styles.optionPillActive]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                    {room.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Field
          label="Brand"
          value={form.brand}
          placeholder="Bosch, Trane, Rheem"
          onChangeText={(brand) => setForm((current) => ({ ...current, brand }))}
        />
        <Field
          label="Model"
          value={form.model}
          placeholder="Model number"
          autoCapitalize="characters"
          onChangeText={(model) => setForm((current) => ({ ...current, model }))}
        />
        <Field
          label="Serial"
          value={form.serial}
          placeholder="Serial number"
          autoCapitalize="characters"
          onChangeText={(serial) => setForm((current) => ({ ...current, serial }))}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.optionGrid}>
            {statusOptions.map((option) => {
              const isSelected = option.value === form.status;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => setForm((current) => ({ ...current, status: option.value }))}
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
          label="Notes"
          value={form.notes}
          placeholder="Filter size, location, access notes"
          multiline
          onChangeText={(notes) => setForm((current) => ({ ...current, notes }))}
        />
      </View>

      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        accessibilityRole="button"
      >
        <Text style={styles.saveText}>{isSaving ? 'Saving' : asset ? 'Save changes' : 'Save asset'}</Text>
      </Pressable>
    </ScrollView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
};

function Field({
  label,
  value,
  placeholder,
  onChangeText,
  autoCapitalize,
  multiline,
}: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
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
  multilineInput: {
    minHeight: 86,
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
