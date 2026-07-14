import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AccessItem } from '@homevault/domain';
import type { CreateAccessItemInput, UpdateAccessItemInput } from '@homevault/database';
import type { AssetListItem, DocumentListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type AddAccessItemScreenSharedProps = {
  propertyId: string;
  assets: AssetListItem[];
  documents: DocumentListItem[];
  onCancel: () => void;
};

type AddAccessItemCreateProps = AddAccessItemScreenSharedProps & {
  accessItem?: undefined;
  initialCategory?: AccessItem['category'];
  onSave: (input: CreateAccessItemInput) => Promise<void>;
};

type AddAccessItemEditProps = AddAccessItemScreenSharedProps & {
  accessItem: AccessItem;
  initialCategory?: never;
  onSave: (input: UpdateAccessItemInput) => Promise<void>;
};

type AddAccessItemScreenProps = AddAccessItemCreateProps | AddAccessItemEditProps;

type FormState = {
  category: AccessItem['category'];
  label: string;
  username: string;
  accessCode: string;
  location: string;
  instructions: string;
  notes: string;
  linkedAssetId: string;
  linkedDocumentIds: string[];
  lastVerifiedAt: string;
};

const categoryOptions: Array<{ value: AccessItem['category']; label: string }> = [
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'router', label: 'Router' },
  { value: 'garage', label: 'Garage' },
  { value: 'alarm', label: 'Alarm' },
  { value: 'safe', label: 'Safe' },
  { value: 'utility_shutoff', label: 'Shutoff' },
  { value: 'lockbox', label: 'Lockbox' },
  { value: 'entry_note', label: 'Entry note' },
  { value: 'other', label: 'Other' },
];

export function AddAccessItemScreen(props: AddAccessItemScreenProps) {
  const { propertyId, assets, documents, onCancel } = props;
  const accessItem = props.accessItem;
  const initialCategory = props.accessItem ? undefined : props.initialCategory;
  const [form, setForm] = useState<FormState>({
    category: accessItem?.category ?? initialCategory ?? 'wifi',
    label: accessItem?.label ?? defaultLabel(initialCategory ?? 'wifi'),
    username: accessItem?.username ?? '',
    accessCode: accessItem?.accessCode ?? '',
    location: accessItem?.location ?? '',
    instructions: accessItem?.instructions ?? '',
    notes: accessItem?.notes ?? '',
    linkedAssetId: accessItem?.linkedAssetId ?? '',
    linkedDocumentIds: accessItem?.linkedDocumentIds ?? [],
    lastVerifiedAt: accessItem?.lastVerifiedAt ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const validationError = useMemo(() => validateForm(form), [form]);

  async function handleSave() {
    if (validationError || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        propertyId,
        category: form.category,
        label: cleanOptional(form.label) ?? defaultLabel(form.category),
        username: cleanOptional(form.username),
        accessCode: cleanOptional(form.accessCode),
        location: cleanOptional(form.location),
        instructions: cleanOptional(form.instructions),
        notes: cleanOptional(form.notes),
        linkedAssetId: cleanOptional(form.linkedAssetId),
        linkedDocumentIds: [...form.linkedDocumentIds],
        lastVerifiedAt: cleanOptional(form.lastVerifiedAt),
      };

      if (props.accessItem) {
        await props.onSave({
          ...payload,
          id: props.accessItem.id,
        });
      } else {
        await props.onSave({
          ...payload,
          id: undefined,
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
          <Text style={styles.kicker}>Access</Text>
          <Text style={styles.title}>{accessItem ? 'Edit access record' : 'Add access record'}</Text>
        </View>
        <Pressable onPress={onCancel} style={styles.cancelButton} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.optionGrid}>
            {categoryOptions.map((option) => {
              const isSelected = option.value === form.category;

              return (
                <Pressable
                  key={option.value}
                  onPress={() =>
                    setForm((current) => ({
                      ...current,
                      category: option.value,
                      label:
                        current.label === '' || current.label === defaultLabel(current.category)
                          ? defaultLabel(option.value)
                          : current.label,
                    }))
                  }
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
          label="Record label"
          value={form.label}
          placeholder={defaultLabel(form.category)}
          onChangeText={(label) => setForm((current) => ({ ...current, label }))}
        />
        <Text style={styles.helperText}>{categoryHelperText(form.category)}</Text>

        <Field
          label={usernameLabel(form.category)}
          value={form.username}
          placeholder={usernamePlaceholder(form.category)}
          onChangeText={(username) => setForm((current) => ({ ...current, username }))}
        />
        <Field
          label={accessCodeLabel(form.category)}
          value={form.accessCode}
          placeholder={accessCodePlaceholder(form.category)}
          onChangeText={(accessCode) => setForm((current) => ({ ...current, accessCode }))}
        />
        <Field
          label="Location"
          value={form.location}
          placeholder={locationPlaceholder(form.category)}
          onChangeText={(location) => setForm((current) => ({ ...current, location }))}
        />
        <Field
          label="Instructions"
          value={form.instructions}
          placeholder={instructionsPlaceholder(form.category)}
          onChangeText={(instructions) => setForm((current) => ({ ...current, instructions }))}
          multiline
        />
        <Field
          label="Notes"
          value={form.notes}
          placeholder="Optional details someone should know"
          onChangeText={(notes) => setForm((current) => ({ ...current, notes }))}
          multiline
        />
        <Field
          label="Last verified"
          value={form.lastVerifiedAt}
          placeholder="2026-07-09"
          onChangeText={(lastVerifiedAt) => setForm((current) => ({ ...current, lastVerifiedAt }))}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Linked device</Text>
          <Text style={styles.helperText}>Optional: connect this record to the device it belongs to.</Text>
          <View style={styles.optionGrid}>
            <RecordPill
              label="None"
              isSelected={form.linkedAssetId === ''}
              onPress={() => setForm((current) => ({ ...current, linkedAssetId: '' }))}
            />
            {assets.map((asset) => (
              <RecordPill
                key={asset.id}
                label={asset.name}
                isSelected={form.linkedAssetId === asset.id}
                onPress={() => setForm((current) => ({ ...current, linkedAssetId: asset.id }))}
              />
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Linked documents</Text>
          <Text style={styles.helperText}>Optional: manuals, policies, or backup notes tied to this record.</Text>
          <View style={styles.optionGrid}>
            {documents.map((document) => (
              <RecordPill
                key={document.id}
                label={document.title}
                isSelected={form.linkedDocumentIds.includes(document.id)}
                onPress={() =>
                  setForm((current) => ({
                    ...current,
                    linkedDocumentIds: toggleLinkedRecord(current.linkedDocumentIds, document.id),
                  }))
                }
              />
            ))}
          </View>
        </View>

        {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}

        <Pressable
          onPress={() => void handleSave()}
          style={[styles.saveButton, (validationError || isSaving) && styles.saveButtonDisabled]}
          accessibilityRole="button"
          disabled={Boolean(validationError) || isSaving}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving…' : accessItem ? 'Save changes' : 'Save access record'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChangeText,
  multiline = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.multilineInput]}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        accessibilityLabel={label}
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

function toggleLinkedRecord(linkedRecordIds: string[], recordId: string) {
  return linkedRecordIds.includes(recordId)
    ? linkedRecordIds.filter((id) => id !== recordId)
    : [...linkedRecordIds, recordId];
}

function validateForm(form: FormState) {
  if (form.lastVerifiedAt.trim().length > 0 && !/^\d{4}-\d{2}-\d{2}$/.test(form.lastVerifiedAt.trim())) {
    return 'Last verified must use YYYY-MM-DD.';
  }

  switch (form.category) {
    case 'wifi':
      if (form.username.trim().length === 0 || form.accessCode.trim().length === 0) {
        return 'Wi-Fi records need a network name and password.';
      }
      return null;
    case 'router':
      if (
        form.username.trim().length === 0 &&
        form.accessCode.trim().length === 0 &&
        form.location.trim().length === 0
      ) {
        return 'Router records need login details or a location note.';
      }
      return null;
    case 'garage':
    case 'alarm':
    case 'safe':
    case 'lockbox':
      if (form.accessCode.trim().length === 0) {
        return 'This record needs a code or combination.';
      }
      return null;
    case 'utility_shutoff':
    case 'entry_note':
      if (form.location.trim().length === 0 && form.instructions.trim().length === 0) {
        return 'Add a location or instructions for this record.';
      }
      return null;
    case 'other':
    default:
      if (cleanOptional(form.label) === undefined) {
        return 'Add a label for this access record.';
      }
      return null;
  }
}

function cleanOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function defaultLabel(category: AccessItem['category']) {
  switch (category) {
    case 'wifi':
      return 'Wi-Fi access';
    case 'router':
      return 'Router login';
    case 'garage':
      return 'Garage access';
    case 'alarm':
      return 'Alarm code';
    case 'safe':
      return 'Safe access';
    case 'utility_shutoff':
      return 'Utility shutoff';
    case 'lockbox':
      return 'Lockbox code';
    case 'entry_note':
      return 'Entry instructions';
    case 'other':
    default:
      return 'Access record';
  }
}

function categoryHelperText(category: AccessItem['category']) {
  switch (category) {
    case 'wifi':
      return 'Save the network name, password, and where someone can restart it.';
    case 'router':
      return 'Save admin login details, reset steps, or where the hardware lives.';
    case 'garage':
      return 'Keep keypad codes or opener notes easy to find.';
    case 'alarm':
      return 'Capture alarm disarm steps, passcodes, or provider notes.';
    case 'safe':
      return 'Store combinations and any opening instructions.';
    case 'utility_shutoff':
      return 'Record valve, panel, or meter locations and how to use them.';
    case 'lockbox':
      return 'Save the code and where the box is mounted.';
    case 'entry_note':
      return 'Document gates, pets, tricky locks, or handoff instructions.';
    case 'other':
    default:
      return 'Use this for anything a helper needs to access the home safely.';
  }
}

function usernameLabel(category: AccessItem['category']) {
  switch (category) {
    case 'wifi':
      return 'Network name';
    case 'router':
      return 'Username';
    default:
      return 'Login name';
  }
}

function usernamePlaceholder(category: AccessItem['category']) {
  switch (category) {
    case 'wifi':
      return 'OakStreet-5G';
    case 'router':
      return 'admin';
    default:
      return 'Optional username or account name';
  }
}

function accessCodeLabel(category: AccessItem['category']) {
  switch (category) {
    case 'wifi':
      return 'Password';
    case 'safe':
      return 'Combination';
    default:
      return 'Code';
  }
}

function accessCodePlaceholder(category: AccessItem['category']) {
  switch (category) {
    case 'wifi':
      return 'Wi-Fi password';
    case 'garage':
      return '1942';
    case 'alarm':
      return 'Disarm code';
    case 'safe':
      return 'Combination or PIN';
    default:
      return 'Optional code, password, or combination';
  }
}

function locationPlaceholder(category: AccessItem['category']) {
  switch (category) {
    case 'wifi':
      return 'Office shelf beside the modem';
    case 'utility_shutoff':
      return 'South exterior wall by the AC condenser';
    default:
      return 'Where to find it';
  }
}

function instructionsPlaceholder(category: AccessItem['category']) {
  switch (category) {
    case 'router':
      return 'Restart power only if both status lights are red.';
    case 'utility_shutoff':
      return 'Turn clockwise until snug, then verify flow has stopped.';
    case 'entry_note':
      return 'Use the side gate latch first, then deadbolt.';
    default:
      return 'Optional instructions someone should follow';
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
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  helperText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  input: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.page,
    paddingHorizontal: 12,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  multilineInput: {
    minHeight: 88,
    paddingTop: 12,
    paddingBottom: 12,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionPillActive: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  optionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  optionTextActive: {
    color: colors.green,
  },
  errorText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '700',
  },
  saveButton: {
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
