import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { ImportantAccount } from '@homevault/domain';
import type { CreateImportantAccountInput, UpdateImportantAccountInput } from '@homevault/database';
import type { DocumentListItem } from '../data/homeVaultSampleData';
import { colors } from '../theme/colors';

type AddImportantAccountScreenSharedProps = {
  propertyId: string;
  documents: DocumentListItem[];
  onCancel: () => void;
};

type AddImportantAccountCreateProps = AddImportantAccountScreenSharedProps & {
  account?: undefined;
  initialKind?: ImportantAccount['kind'];
  onSave: (input: CreateImportantAccountInput) => Promise<void>;
};

type AddImportantAccountEditProps = AddImportantAccountScreenSharedProps & {
  account: ImportantAccount;
  initialKind?: never;
  onSave: (input: UpdateImportantAccountInput) => Promise<void>;
};

type AddImportantAccountScreenProps = AddImportantAccountCreateProps | AddImportantAccountEditProps;

type BooleanChoice = 'unknown' | 'enabled' | 'disabled';
type ManagerRoleChoice = NonNullable<ImportantAccount['managerRole']> | 'unknown';

type FormState = {
  kind: ImportantAccount['kind'];
  providerName: string;
  label: string;
  accountNumber: string;
  website: string;
  phone: string;
  email: string;
  managerRole: ManagerRoleChoice;
  backupHelperName: string;
  isSharedHouseholdAccount: BooleanChoice;
  mfaEnabled: BooleanChoice;
  recoveryCodesStored: BooleanChoice;
  managedInPasswordManager: BooleanChoice;
  recoveryNotes: string;
  notes: string;
  linkedDocumentIds: string[];
};

const kindOptions: Array<{ value: ImportantAccount['kind']; label: string }> = [
  { value: 'insurance', label: 'Insurance' },
  { value: 'utility', label: 'Utility' },
  { value: 'internet', label: 'Internet' },
  { value: 'email', label: 'Email' },
  { value: 'carrier', label: 'Carrier' },
  { value: 'platform', label: 'Apple / Google' },
  { value: 'security', label: 'Security' },
  { value: 'smart_home', label: 'Smart home' },
  { value: 'banking', label: 'Banking' },
  { value: 'government', label: 'Government' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'other', label: 'Other' },
];

const booleanOptions: Array<{ value: BooleanChoice; label: string }> = [
  { value: 'enabled', label: 'Yes' },
  { value: 'disabled', label: 'No' },
  { value: 'unknown', label: 'Not sure' },
];

const managerRoleOptions: Array<{ value: ManagerRoleChoice; label: string }> = [
  { value: 'self', label: 'You' },
  { value: 'partner', label: 'Partner' },
  { value: 'shared_household', label: 'Shared household' },
  { value: 'helper', label: 'Trusted helper' },
  { value: 'service_provider', label: 'Provider' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Not sure' },
];

export function AddImportantAccountScreen(props: AddImportantAccountScreenProps) {
  const { propertyId, documents, onCancel } = props;
  const account = props.account;
  const [form, setForm] = useState<FormState>({
    kind: account?.kind ?? props.initialKind ?? 'insurance',
    providerName: account?.providerName ?? '',
    label: account?.label ?? defaultLabel(props.initialKind ?? 'insurance'),
    accountNumber: account?.accountNumber ?? '',
    website: account?.website ?? '',
    phone: account?.phone ?? '',
    email: account?.email ?? '',
    managerRole: toManagerRoleChoice(account?.managerRole),
    backupHelperName: account?.backupHelperName ?? '',
    isSharedHouseholdAccount: toChoice(account?.isSharedHouseholdAccount),
    mfaEnabled: toChoice(account?.mfaEnabled),
    recoveryCodesStored: toChoice(account?.recoveryCodesStored),
    managedInPasswordManager: toChoice(account?.managedInPasswordManager),
    recoveryNotes: account?.recoveryNotes ?? '',
    notes: account?.notes ?? '',
    linkedDocumentIds: account?.linkedDocumentIds ?? [],
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
        kind: form.kind,
        providerName: form.providerName.trim(),
        label: form.label.trim(),
        accountNumber: cleanOptional(form.accountNumber),
        website: cleanOptional(form.website),
        phone: cleanOptional(form.phone),
        email: cleanOptional(form.email),
        managerRole: fromManagerRoleChoice(form.managerRole),
        backupHelperName: cleanOptional(form.backupHelperName),
        isSharedHouseholdAccount: fromChoice(form.isSharedHouseholdAccount),
        mfaEnabled: fromChoice(form.mfaEnabled),
        recoveryCodesStored: fromChoice(form.recoveryCodesStored),
        managedInPasswordManager: fromChoice(form.managedInPasswordManager),
        recoveryNotes: cleanOptional(form.recoveryNotes),
        notes: cleanOptional(form.notes),
        linkedDocumentIds: [...form.linkedDocumentIds],
      };

      if (props.account) {
        await props.onSave({
          ...payload,
          id: props.account.id,
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
          <Text style={styles.kicker}>Important accounts</Text>
          <Text style={styles.title}>{account ? 'Edit account' : 'Add account'}</Text>
        </View>
        <Pressable onPress={onCancel} style={styles.cancelButton} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <View style={styles.noticePanel}>
        <Text style={styles.noticeTitle}>HomeVault tracks recovery readiness, not passwords</Text>
        <Text style={styles.noticeText}>
          Save providers, support contacts, recovery notes, and whether protections are set up.
          Do not enter passwords, one-time codes, or recovery-code values here.
        </Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Account type</Text>
          <View style={styles.optionGrid}>
            {kindOptions.map((option) => {
              const isSelected = option.value === form.kind;

              return (
                <Pressable
                  key={option.value}
                  onPress={() =>
                    setForm((current) => ({
                      ...current,
                      kind: option.value,
                      label:
                        current.label === '' || current.label === defaultLabel(current.kind)
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
          label="Provider name"
          value={form.providerName}
          placeholder="Prairie Mutual, FiberCo, City Utilities"
          onChangeText={(providerName) => setForm((current) => ({ ...current, providerName }))}
        />
        <Field
          label="Account label"
          value={form.label}
          placeholder={defaultLabel(form.kind)}
          onChangeText={(label) => setForm((current) => ({ ...current, label }))}
        />
        <Field
          label="Account number or member ID (optional)"
          value={form.accountNumber}
          placeholder="Policy number, customer ID, or last 4 reference"
          onChangeText={(accountNumber) => setForm((current) => ({ ...current, accountNumber }))}
        />
        <Field
          label="Website (optional)"
          value={form.website}
          placeholder="https://example.com/account"
          onChangeText={(website) => setForm((current) => ({ ...current, website }))}
        />
        <Field
          label="Phone (optional)"
          value={form.phone}
          placeholder="555-0119"
          onChangeText={(phone) => setForm((current) => ({ ...current, phone }))}
        />
        <Field
          label="Email (optional)"
          value={form.email}
          placeholder="support@example.com"
          onChangeText={(email) => setForm((current) => ({ ...current, email }))}
        />
        <EnumChoiceField
          label="Managed by"
          value={form.managerRole}
          options={managerRoleOptions}
          onChange={(managerRole) => setForm((current) => ({ ...current, managerRole }))}
        />
        <Field
          label="Backup helper (optional)"
          value={form.backupHelperName}
          placeholder="Taylor, spouse, shared household access, or contractor fallback"
          onChangeText={(backupHelperName) =>
            setForm((current) => ({ ...current, backupHelperName }))
          }
        />
        <ChoiceField
          label="Shared household account"
          value={form.isSharedHouseholdAccount}
          onChange={(isSharedHouseholdAccount) =>
            setForm((current) => ({ ...current, isSharedHouseholdAccount }))
          }
        />

        <ChoiceField
          label="MFA enabled"
          value={form.mfaEnabled}
          onChange={(mfaEnabled) => setForm((current) => ({ ...current, mfaEnabled }))}
        />
        <ChoiceField
          label="Recovery codes stored"
          value={form.recoveryCodesStored}
          onChange={(recoveryCodesStored) =>
            setForm((current) => ({ ...current, recoveryCodesStored }))
          }
        />
        <ChoiceField
          label="Saved in a password manager"
          value={form.managedInPasswordManager}
          onChange={(managedInPasswordManager) =>
            setForm((current) => ({ ...current, managedInPasswordManager }))
          }
        />

        <Field
          label="Recovery notes"
          value={form.recoveryNotes}
          placeholder="Where codes live, who owns the login, or which backup contact is current"
          onChangeText={(recoveryNotes) => setForm((current) => ({ ...current, recoveryNotes }))}
          multiline
        />
        <Field
          label="Notes"
          value={form.notes}
          placeholder="Optional support hours, family ownership notes, or escalation instructions"
          onChangeText={(notes) => setForm((current) => ({ ...current, notes }))}
          multiline
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Linked documents</Text>
          <Text style={styles.helperText}>
            Optional: connect policies, recovery instructions, or billing files to this account.
          </Text>
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
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving…' : account ? 'Save changes' : 'Save account'}
          </Text>
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

function ChoiceField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: BooleanChoice;
  onChange: (value: BooleanChoice) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionGrid}>
        {booleanOptions.map((option) => {
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

function EnumChoiceField<TValue extends string>({
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

function toggleLinkedRecord(linkedRecordIds: string[], recordId: string) {
  return linkedRecordIds.includes(recordId)
    ? linkedRecordIds.filter((id) => id !== recordId)
    : [...linkedRecordIds, recordId];
}

function validateForm(form: FormState) {
  if (form.providerName.trim().length === 0) {
    return 'Add the provider name for this account.';
  }

  if (form.label.trim().length === 0) {
    return 'Add a label for this account.';
  }

  return null;
}

function defaultLabel(kind: ImportantAccount['kind']) {
  switch (kind) {
    case 'insurance':
      return 'Home policy';
    case 'utility':
      return 'Electric utility';
    case 'internet':
      return 'Internet service';
    case 'email':
      return 'Primary email';
    case 'carrier':
      return 'Mobile carrier';
    case 'platform':
      return 'Apple or Google account';
    case 'security':
      return 'Alarm monitoring';
    case 'smart_home':
      return 'Smart-home account';
    case 'banking':
      return 'Primary bank login';
    case 'government':
      return 'Property tax portal';
    case 'warranty':
      return 'Warranty portal';
    case 'other':
    default:
      return 'Important account';
  }
}

function cleanOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toChoice(value: boolean | undefined): BooleanChoice {
  if (value == null) return 'unknown';
  return value ? 'enabled' : 'disabled';
}

function toManagerRoleChoice(value: ImportantAccount['managerRole'] | undefined): ManagerRoleChoice {
  return value ?? 'unknown';
}

function fromChoice(value: BooleanChoice): boolean | undefined {
  if (value === 'unknown') return undefined;
  return value === 'enabled';
}

function fromManagerRoleChoice(value: ManagerRoleChoice): ImportantAccount['managerRole'] | undefined {
  return value === 'unknown' ? undefined : value;
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
  noticePanel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.blueSoft,
    padding: 14,
    gap: 6,
  },
  noticeTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  noticeText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
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
  helperText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
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
  errorText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
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
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
