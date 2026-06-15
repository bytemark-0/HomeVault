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

import type { Asset, RoomArea } from '@homevault/domain';
import type { CreateAssetInput, UpdateAssetInput } from '@homevault/database';

import { colors } from '../theme/colors';

type AddAssetScreenProps = {
  propertyId: string;
  rooms: RoomArea[];
  asset?: Asset;
  copyFrom?: Asset;
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
  installDate: string;
  purchaseDate: string;
  cost: string;
  status: Asset['status'];
  warrantyExpiry: string;
  photoUri: string;
  notes: string;
};

const categoryPresets = [
  'Appliance',
  'Heating & cooling',
  'Plumbing',
  'Electrical',
  'Roofing',
  'Windows & doors',
  'Flooring',
  'Lighting',
  'Security',
  'Exterior',
  'Structure',
];

const statusOptions: Array<{ label: string; value: Asset['status'] }> = [
  { label: 'Ready', value: 'ready' },
  { label: 'Needs attention', value: 'needs_attention' },
  { label: 'Warranty soon', value: 'warranty_soon' },
];

export function AddAssetScreen({
  propertyId,
  rooms,
  asset,
  copyFrom,
  initialRoomId,
  onCancel,
  onSave,
}: AddAssetScreenProps) {
  const template = asset ?? copyFrom;
  const [form, setForm] = useState<FormState>({
    name: copyFrom ? `${copyFrom.name} (copy)` : (asset?.name ?? ''),
    category: template?.category ?? 'Appliance',
    roomId: template?.roomId ?? initialRoomId ?? rooms[0]?.id,
    brand: template?.brand ?? '',
    model: template?.model ?? '',
    serial: copyFrom ? '' : (asset?.serial ?? ''),
    installDate: copyFrom ? '' : (asset?.installDate ?? ''),
    purchaseDate: copyFrom ? '' : (asset?.purchaseDate ?? ''),
    cost: copyFrom ? '' : (asset?.costCents != null ? String(asset.costCents / 100) : ''),
    status: template?.status ?? 'ready',
    warrantyExpiry: copyFrom ? '' : (asset?.warrantyExpiry ?? ''),
    photoUri: copyFrom ? '' : (asset?.photoUri ?? ''),
    notes: copyFrom ? '' : (asset?.notes ?? ''),
  });
  const [isSaving, setIsSaving] = useState(false);
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const errors = useMemo(
    () => ({
      name: form.name.trim().length === 0 ? 'Name is required.' : undefined,
      category: form.category.trim().length === 0 ? 'Category is required.' : undefined,
      installDate:
        form.installDate.trim().length > 0 && !datePattern.test(form.installDate.trim())
          ? 'Enter a date as YYYY-MM-DD.'
          : undefined,
      purchaseDate:
        form.purchaseDate.trim().length > 0 && !datePattern.test(form.purchaseDate.trim())
          ? 'Enter a date as YYYY-MM-DD.'
          : undefined,
      cost:
        form.cost.trim().length > 0 && (isNaN(parseFloat(form.cost.trim())) || parseFloat(form.cost.trim()) < 0)
          ? 'Enter a positive dollar amount.'
          : undefined,
      warrantyExpiry:
        form.warrantyExpiry.trim().length > 0 && !datePattern.test(form.warrantyExpiry.trim())
          ? 'Enter a date as YYYY-MM-DD.'
          : undefined,
    }),
    [form.category, form.cost, form.installDate, form.name, form.purchaseDate, form.warrantyExpiry],
  );

  const canSave = useMemo(
    () =>
      !errors.name &&
      !errors.category &&
      !errors.installDate &&
      !errors.purchaseDate &&
      !errors.cost &&
      !errors.warrantyExpiry &&
      !isSaving,
    [errors.category, errors.cost, errors.installDate, errors.name, errors.purchaseDate, errors.warrantyExpiry, isSaving],
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
        installDate: cleanOptional(form.installDate),
        purchaseDate: cleanOptional(form.purchaseDate),
        costCents: form.cost.trim().length > 0 ? Math.round(parseFloat(form.cost.trim()) * 100) : undefined,
        status: form.status,
        warrantyExpiry: cleanOptional(form.warrantyExpiry),
        photoUri: form.photoUri || undefined,
        notes: cleanOptional(form.notes),
      });
    } finally {
      setIsSaving(false);
    }
  }

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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Inventory</Text>
          <Text style={styles.title}>{asset ? 'Edit asset' : copyFrom ? 'Copy asset' : 'Add asset'}</Text>
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
          error={errors.name}
          onChangeText={(name) => setForm((current) => ({ ...current, name }))}
        />
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.optionGrid}>
            {categoryPresets.map((preset) => {
              const isSelected = form.category === preset;

              return (
                <Pressable
                  key={preset}
                  onPress={() => setForm((current) => ({ ...current, category: preset }))}
                  style={[styles.optionPill, isSelected && styles.optionPillActive]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                    {preset}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {!categoryPresets.includes(form.category) || form.category === '' ? (
            <TextInput
              value={categoryPresets.includes(form.category) ? '' : form.category}
              placeholder="Custom category"
              onChangeText={(category) => setForm((current) => ({ ...current, category }))}
              style={[styles.input, errors.category && styles.inputError]}
              placeholderTextColor={colors.muted}
            />
          ) : null}
          {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Room or area</Text>
          {rooms.length > 0 ? (
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
          ) : (
            <Text style={styles.fieldHint}>
              No areas added yet. Add a room or area from the Household tab first.
            </Text>
          )}
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
        <Field
          label="Install date"
          value={form.installDate}
          placeholder="YYYY-MM-DD"
          error={errors.installDate}
          onChangeText={(installDate) => setForm((current) => ({ ...current, installDate }))}
        />
        <Field
          label="Purchase date"
          value={form.purchaseDate}
          placeholder="YYYY-MM-DD"
          error={errors.purchaseDate}
          onChangeText={(purchaseDate) => setForm((current) => ({ ...current, purchaseDate }))}
        />
        <Field
          label="Purchase cost"
          value={form.cost}
          placeholder="0.00"
          error={errors.cost}
          keyboardType="decimal-pad"
          onChangeText={(cost) => setForm((current) => ({ ...current, cost }))}
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
          label="Warranty expiry"
          value={form.warrantyExpiry}
          placeholder="YYYY-MM-DD"
          error={errors.warrantyExpiry}
          onChangeText={(warrantyExpiry) => setForm((current) => ({ ...current, warrantyExpiry }))}
        />
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Photo</Text>
          {form.photoUri ? (
            <View style={styles.photoPreviewBox}>
              <Image source={{ uri: form.photoUri }} style={styles.photoPreview} resizeMode="cover" />
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
  error?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'decimal-pad' | 'numeric' | 'email-address';
  multiline?: boolean;
};

function Field({
  label,
  value,
  placeholder,
  onChangeText,
  error,
  autoCapitalize,
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
        autoCapitalize={autoCapitalize}
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

async function copyPhotoToAppStorage(sourceUri: string): Promise<string | null> {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return null;
  }

  try {
    const directoryUri = `${FileSystem.documentDirectory}homevault-assets/`;
    const fileName = `asset-photo-${Date.now()}.jpg`;
    const fileUri = `${directoryUri}${fileName}`;

    await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
    await FileSystem.copyAsync({ from: sourceUri, to: fileUri });

    return fileUri;
  } catch {
    return null;
  }
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
  inputError: {
    borderColor: colors.red,
  },
  fieldHint: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  errorText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
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
  photoPickerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoPickerButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPickerText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  photoPreviewBox: {
    gap: 10,
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    backgroundColor: colors.page,
  },
  photoRemoveButton: {
    alignSelf: 'flex-start',
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: colors.red,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '900',
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
