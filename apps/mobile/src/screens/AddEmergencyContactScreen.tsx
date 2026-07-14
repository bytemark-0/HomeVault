import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type {
  CreateEmergencyContactInput,
  UpdateEmergencyContactInput,
} from '@homevault/database';
import type {
  EmergencyContact,
  EmergencyContactResponsibilityCategory,
  ImportantAccountManagerRole,
} from '@homevault/domain';
import { colors } from '../theme/colors';
import { formatEmergencyContactPriority } from './EmergencyContactsScreen';

type AddEmergencyContactScreenSharedProps = {
  propertyId: string;
  onCancel: () => void;
};

type AddEmergencyContactCreateProps = AddEmergencyContactScreenSharedProps & {
  contact?: undefined;
  initialPriority?: EmergencyContact['priority'];
  onSave: (input: CreateEmergencyContactInput) => Promise<void>;
};

type AddEmergencyContactEditProps = AddEmergencyContactScreenSharedProps & {
  contact: EmergencyContact;
  initialPriority?: never;
  onSave: (input: UpdateEmergencyContactInput) => Promise<void>;
};

type AddEmergencyContactScreenProps =
  | AddEmergencyContactCreateProps
  | AddEmergencyContactEditProps;

type FormState = {
  priority: EmergencyContact['priority'];
  name: string;
  role: string;
  responsibilityCategory: EmergencyContactResponsibilityCategory | 'unknown';
  ownerRole: ImportantAccountManagerRole | 'unknown';
  backupHelperName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

const priorityOptions: EmergencyContact['priority'][] = [
  'primary',
  'secondary',
  'service_provider',
  'other',
];

const responsibilityCategoryOptions: Array<{
  value: FormState['responsibilityCategory'];
  label: string;
}> = [
  { value: 'unknown', label: 'General helper' },
  { value: 'school', label: 'School / daycare' },
  { value: 'pet', label: 'Pet care' },
  { value: 'home_service', label: 'Home service' },
  { value: 'trusted_helper', label: 'Trusted helper' },
  { value: 'other', label: 'Other' },
];

const ownerRoleOptions: Array<{ value: FormState['ownerRole']; label: string }> = [
  { value: 'self', label: 'You' },
  { value: 'partner', label: 'Partner' },
  { value: 'shared_household', label: 'Shared household' },
  { value: 'helper', label: 'Trusted helper' },
  { value: 'service_provider', label: 'Provider' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Not sure' },
];

export function AddEmergencyContactScreen(props: AddEmergencyContactScreenProps) {
  const { propertyId, onCancel } = props;
  const contact = props.contact;
  const [form, setForm] = useState<FormState>({
    priority: contact?.priority ?? props.initialPriority ?? 'primary',
    name: contact?.name ?? '',
    role: contact?.role ?? '',
    responsibilityCategory: contact?.responsibilityCategory ?? 'unknown',
    ownerRole: contact?.ownerRole ?? 'unknown',
    backupHelperName: contact?.backupHelperName ?? '',
    phone: contact?.phone ?? '',
    email: contact?.email ?? '',
    address: contact?.address ?? '',
    notes: contact?.notes ?? '',
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
        priority: form.priority,
        name: form.name.trim(),
        role: form.role.trim(),
        responsibilityCategory: fromOptionalEnumChoice(form.responsibilityCategory),
        ownerRole: fromOptionalEnumChoice(form.ownerRole),
        backupHelperName: cleanOptional(form.backupHelperName),
        phone: cleanOptional(form.phone),
        email: cleanOptional(form.email),
        address: cleanOptional(form.address),
        notes: cleanOptional(form.notes),
      };

      if (props.contact) {
        await props.onSave({
          ...payload,
          id: props.contact.id,
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
          <Text style={styles.kicker}>Emergency contacts</Text>
          <Text style={styles.title}>{contact ? 'Edit contact' : 'Add contact'}</Text>
        </View>
        <Pressable onPress={onCancel} style={styles.cancelButton} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <View style={styles.noticePanel}>
        <Text style={styles.noticeTitle}>Keep the record action-ready</Text>
        <Text style={styles.noticeText}>
          Save the name, relationship or provider context, and best contact details. This record
          should help someone act fast under stress.
        </Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Contact type</Text>
          <View style={styles.optionGrid}>
            {priorityOptions.map((option) => {
              const isSelected = option === form.priority;

              return (
                <Pressable
                  key={option}
                  onPress={() => setForm((current) => ({ ...current, priority: option }))}
                  style={[styles.optionPill, isSelected && styles.optionPillActive]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                    {formatEmergencyContactPriority(option)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Field
          label="Contact name"
          value={form.name}
          placeholder="Jamie Lee"
          onChangeText={(name) => setForm((current) => ({ ...current, name }))}
        />
        <Field
          label="Relationship or provider"
          value={form.role}
          placeholder="Neighbor with spare key, family member, plumber, vet"
          onChangeText={(role) => setForm((current) => ({ ...current, role }))}
        />
        <ChoiceField
          label="Responsibility"
          value={form.responsibilityCategory}
          options={responsibilityCategoryOptions}
          onChange={(responsibilityCategory) =>
            setForm((current) => ({ ...current, responsibilityCategory }))
          }
        />
        <ChoiceField
          label="Owned by"
          value={form.ownerRole}
          options={ownerRoleOptions}
          onChange={(ownerRole) => setForm((current) => ({ ...current, ownerRole }))}
        />
        <Field
          label="Backup helper (optional)"
          value={form.backupHelperName}
          placeholder="Dana, co-parent, spouse, or alternate provider"
          onChangeText={(backupHelperName) =>
            setForm((current) => ({ ...current, backupHelperName }))
          }
        />
        <Field
          label="Phone"
          value={form.phone}
          placeholder="555-0101"
          onChangeText={(phone) => setForm((current) => ({ ...current, phone }))}
        />
        <Field
          label="Email (optional)"
          value={form.email}
          placeholder="jamie@example.com"
          onChangeText={(email) => setForm((current) => ({ ...current, email }))}
        />
        <Field
          label="Address (optional)"
          value={form.address}
          placeholder="123 Oak Street"
          onChangeText={(address) => setForm((current) => ({ ...current, address }))}
          multiline
        />
        <Field
          label="Notes (optional)"
          value={form.notes}
          placeholder="Best time to call, gate code reminder, policy contact instructions"
          onChangeText={(notes) => setForm((current) => ({ ...current, notes }))}
          multiline
        />

        {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}
      </View>

      <Pressable
        onPress={() => void handleSave()}
        disabled={Boolean(validationError) || isSaving}
        style={[styles.saveButton, (validationError || isSaving) && styles.saveButtonDisabled]}
        accessibilityRole="button"
      >
        <Text style={styles.saveButtonText}>
          {isSaving ? 'Saving…' : contact ? 'Save changes' : 'Save contact'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function validateForm(form: FormState) {
  if (!form.name.trim()) {
    return 'Add a contact name before saving.';
  }

  if (!form.role.trim()) {
    return 'Add the relationship or provider context before saving.';
  }

  if (!form.phone.trim() && !form.email.trim()) {
    return 'Add at least one way to reach this contact.';
  }

  return null;
}

function cleanOptional(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function fromOptionalEnumChoice<TValue extends string>(value: TValue | 'unknown') {
  return value === 'unknown' ? undefined : value;
}

function Field({
  label,
  multiline = false,
  onChangeText,
  placeholder,
  value,
}: {
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.inputMultiline]}
        multiline={multiline}
      />
    </View>
  );
}

function ChoiceField<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: TValue;
  options: Array<{ value: TValue; label: string }>;
  onChange: (value: TValue) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionGrid}>
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <Pressable
              key={`${label}-${option.value}`}
              onPress={() => onChange(option.value)}
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
  );
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
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
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
  noticePanel: {
    borderRadius: 8,
    borderColor: colors.green,
    borderWidth: 1,
    backgroundColor: colors.greenSoft,
    padding: 14,
    gap: 6,
  },
  noticeTitle: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '900',
  },
  noticeText: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionPillActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenSoft,
  },
  optionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  optionTextActive: {
    color: colors.green,
  },
  input: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.page,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputMultiline: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  errorText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '700',
  },
  saveButton: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
