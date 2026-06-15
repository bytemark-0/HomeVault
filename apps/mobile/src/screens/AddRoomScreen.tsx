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

import type { RoomArea } from '@homevault/domain';
import type { CreateRoomInput, UpdateRoomInput } from '@homevault/database';

import { colors } from '../theme/colors';

type AddRoomScreenProps = {
  propertyId: string;
  room?: RoomArea;
  onCancel: () => void;
  onSave: (input: CreateRoomInput | UpdateRoomInput) => Promise<void>;
};

type FormState = {
  name: string;
  type: RoomArea['type'];
  floor: string;
  photoUri: string;
};

const areaTypes: Array<{ label: string; value: RoomArea['type'] }> = [
  { label: 'Room', value: 'room' },
  { label: 'Area', value: 'area' },
  { label: 'Exterior', value: 'exterior' },
  { label: 'System', value: 'system' },
];

export function AddRoomScreen({ propertyId, room, onCancel, onSave }: AddRoomScreenProps) {
  const [form, setForm] = useState<FormState>({
    name: room?.name ?? '',
    type: room?.type ?? 'room',
    floor: room?.floor ?? '',
    photoUri: room?.photoUri ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const errors = useMemo(
    () => ({
      name: form.name.trim().length === 0 ? 'Name is required.' : undefined,
    }),
    [form.name],
  );

  const canSave = useMemo(() => !errors.name && !isSaving, [errors.name, isSaving]);

  async function handleSave() {
    if (!canSave) {
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        id: room?.id,
        propertyId,
        name: form.name.trim(),
        type: form.type,
        floor: cleanOptional(form.floor),
        photoUri: form.photoUri || undefined,
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
          <Text style={styles.kicker}>Household</Text>
          <Text style={styles.title}>{room ? 'Edit area' : 'Add area'}</Text>
        </View>
        <Pressable onPress={onCancel} style={styles.cancelButton} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Field
          label="Name"
          value={form.name}
          placeholder="Kitchen, basement, roof, electrical"
          error={errors.name}
          onChangeText={(name) => setForm((current) => ({ ...current, name }))}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.optionGrid}>
            {areaTypes.map((option) => {
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
          label="Floor"
          value={form.floor}
          placeholder="Main, upstairs, lower, exterior"
          onChangeText={(floor) => setForm((current) => ({ ...current, floor }))}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Photo</Text>
          {form.photoUri ? (
            <View style={styles.photoPreviewBox}>
              <Image source={{ uri: form.photoUri }} style={styles.photoPreview} resizeMode="cover" accessibilityLabel="Room photo preview" />
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
        <Text style={styles.saveText}>
          {isSaving ? 'Saving' : room ? 'Save changes' : 'Save area'}
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
  error?: string;
};

function Field({ label, value, placeholder, onChangeText, error }: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
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
    const fileName = `room-photo-${Date.now()}.jpg`;
    const fileUri = `${directoryUri}${fileName}`;

    await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
    await FileSystem.copyAsync({ from: sourceUri, to: fileUri });

    return fileUri;
  } catch {
    return null;
  }
}
