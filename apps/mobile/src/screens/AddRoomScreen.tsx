import { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { RoomArea } from '@homevault/domain';
import type { CreateRoomInput, UpdateRoomInput } from '@homevault/database';

import { FormField } from '../components/FormField';
import { PhotoPickerField } from '../components/PhotoPickerField';
import { deleteAppOwnedPhoto } from '../utils/photoStorage';
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
  const originalPhotoUri = useRef(room?.photoUri ?? '');
  const [form, setForm] = useState<FormState>({
    name: room?.name ?? '',
    type: room?.type ?? 'room',
    floor: room?.floor ?? '',
    photoUri: room?.photoUri ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();
  const errors = useMemo(
    () => ({
      name: form.name.trim().length === 0 ? 'Name is required.' : undefined,
    }),
    [form.name],
  );

  const canSave = useMemo(() => !errors.name && !isSaving, [errors.name, isSaving]);

  function handlePhotoChange(photoUri: string) {
    const current = form.photoUri;
    if (current && current !== originalPhotoUri.current) {
      void deleteAppOwnedPhoto(current);
    }
    setForm((prev) => ({ ...prev, photoUri }));
  }

  function handleCancel() {
    if (form.photoUri && form.photoUri !== originalPhotoUri.current) {
      void deleteAppOwnedPhoto(form.photoUri);
    }
    onCancel();
  }

  async function handleSave() {
    if (!canSave) {
      return;
    }

    setIsSaving(true);
    setSaveError(undefined);

    try {
      await onSave({
        id: room?.id,
        propertyId,
        name: form.name.trim(),
        type: form.type,
        floor: cleanOptional(form.floor),
        photoUri: form.photoUri || undefined,
      });
      if (originalPhotoUri.current && originalPhotoUri.current !== form.photoUri) {
        void deleteAppOwnedPhoto(originalPhotoUri.current);
      }
    } catch {
      setSaveError('Could not save this area. Your details are still here. Check storage permissions and try again.');
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
          <Text style={styles.title}>{room ? 'Edit area' : 'Add area'}</Text>
        </View>
        <Pressable onPress={handleCancel} style={styles.cancelButton} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <FormField
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

        <FormField
          label="Floor (optional)"
          value={form.floor}
          placeholder="Main, upstairs, lower, exterior"
          onChangeText={(floor) => setForm((current) => ({ ...current, floor }))}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Photo (optional)</Text>
          <PhotoPickerField
            prefix="room"
            value={form.photoUri}
            onChange={handlePhotoChange}
            accessibilityLabel={`Photo of ${form.name || 'room'}`}
          />
        </View>
      </View>

      {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}

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
  saveErrorText: {
    borderRadius: 8,
    backgroundColor: colors.redSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.red,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
