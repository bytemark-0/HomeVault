import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Property } from '@homevault/domain';
import type { CreatePropertyInput } from '@homevault/database';
import { getHomeVaultRepository } from '../../data/localHomeVaultRepository';
import {
  clearCreatePropertyDraft,
  readCreatePropertyDraft,
  writeCreatePropertyDraft,
} from '../../utils/onboardingStorage';
import {
  cleanOptional,
  isValidDateInput,
  isValidYear,
  parseYear,
} from '../../utils/propertyForm';
import { colors } from '../../theme/colors';

const PROPERTY_TYPES: Array<{ label: string; value: Property['type'] }> = [
  { label: 'Single family', value: 'single_family' },
  { label: 'Townhome', value: 'townhome' },
  { label: 'Condo', value: 'condo' },
  { label: 'Multi-unit', value: 'multi_unit' },
  { label: 'Other', value: 'other' },
];

type Props = { onBack: () => void; onCreated: (property: Property) => void };

export function CreatePropertyScreen({ onBack, onCreated }: Props) {
  const insets = useSafeAreaInsets();

  const [label, setLabel] = useState('');
  const [addressLabel, setAddressLabel] = useState('');
  const [type, setType] = useState<Property['type']>('single_family');
  const [yearBuilt, setYearBuilt] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [labelError, setLabelError] = useState<string | undefined>();
  const [yearBuiltError, setYearBuiltError] = useState<string | undefined>();
  const [purchaseDateError, setPurchaseDateError] = useState<string | undefined>();
  const [saveError, setSaveError] = useState<string | undefined>();
  const [draftLoaded, setDraftLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDraft() {
      const draft = await readCreatePropertyDraft();
      if (!isMounted) return;

      if (draft) {
        setLabel(draft.label);
        setAddressLabel(draft.addressLabel);
        setType(draft.type);
        setYearBuilt(draft.yearBuilt);
        setPurchaseDate(draft.purchaseDate);
      }

      setDraftLoaded(true);
    }

    void loadDraft();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;

    const hasDraft =
      label.trim().length > 0 ||
      addressLabel.trim().length > 0 ||
      yearBuilt.trim().length > 0 ||
      purchaseDate.trim().length > 0 ||
      type !== 'single_family';

    if (!hasDraft) {
      void clearCreatePropertyDraft();
      return;
    }

    void writeCreatePropertyDraft({
      label,
      addressLabel,
      type,
      yearBuilt,
      purchaseDate,
    });
  }, [addressLabel, draftLoaded, label, purchaseDate, type, yearBuilt]);

  function validate(): boolean {
    let hasError = false;

    if (label.trim().length === 0) {
      setLabelError('Give your home a name to continue.');
      hasError = true;
    } else {
      setLabelError(undefined);
    }

    if (yearBuilt.trim().length > 0 && !isValidYear(yearBuilt)) {
      setYearBuiltError('Enter a four-digit year.');
      hasError = true;
    } else {
      setYearBuiltError(undefined);
    }

    if (purchaseDate.trim().length > 0 && !isValidDateInput(purchaseDate)) {
      setPurchaseDateError('Use YYYY-MM-DD.');
      hasError = true;
    } else {
      setPurchaseDateError(undefined);
    }

    if (hasError) {
      setSaveError(undefined);
      return false;
    }

    return true;
  }

  async function handleSave() {
    if (!validate() || isSaving) return;
    setIsSaving(true);
    setSaveError(undefined);
    try {
      const repo = await getHomeVaultRepository();
      const input: CreatePropertyInput = {
        label: label.trim(),
        addressLabel: cleanOptional(addressLabel),
        type,
        yearBuilt: parseYear(yearBuilt),
        purchaseDate: cleanOptional(purchaseDate),
      };
      const property = await repo.createProperty(input);
      await clearCreatePropertyDraft();
      onCreated(property);
    } catch {
      setSaveError(
        'We could not create your home. Your information is still here. Check storage permissions and try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: 16 + insets.top }]}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.heading}>Set up your home</Text>
        <Text style={styles.subheading}>Just two fields to get started. You can add more later.</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={styles.label}>Home name</Text>
          <TextInput
            style={[styles.input, labelError ? styles.inputError : null]}
            value={label}
            onChangeText={(value: string) => {
              setLabel(value);
              if (labelError) {
                setLabelError(undefined);
              }
            }}
            placeholder="e.g. Oak Street home"
            placeholderTextColor={colors.muted}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => void handleSave()}
            accessibilityLabel="Home name"
          />
          {labelError ? <Text style={styles.errorText}>{labelError}</Text> : null}
          {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Property type</Text>
          <View style={styles.typeGrid}>
            {PROPERTY_TYPES.map((pt) => (
              <Pressable
                key={pt.value}
                style={[styles.typeChip, type === pt.value && styles.typeChipSelected]}
                onPress={() => setType(pt.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: type === pt.value }}
                accessibilityLabel={pt.label}
              >
                <Text
                  style={[styles.typeChipText, type === pt.value && styles.typeChipTextSelected]}
                >
                  {pt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.optionalSection}>
          <Text style={styles.optionalHeading}>Optional details</Text>
          <Text style={styles.optionalBody}>
            Add a little more context now, or leave these blank and finish setup in under a minute.
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Address or location (optional)</Text>
          <TextInput
            style={styles.input}
            value={addressLabel}
            onChangeText={setAddressLabel}
            placeholder="Street, neighborhood, or city"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            accessibilityLabel="Address or location"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Year built (optional)</Text>
          <TextInput
            style={[styles.input, yearBuiltError ? styles.inputError : null]}
            value={yearBuilt}
            onChangeText={(value: string) => {
              setYearBuilt(value);
              if (yearBuiltError) setYearBuiltError(undefined);
            }}
            placeholder="1998"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            accessibilityLabel="Year built"
          />
          {yearBuiltError ? <Text style={styles.errorText}>{yearBuiltError}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Purchase date (optional)</Text>
          <TextInput
            style={[styles.input, purchaseDateError ? styles.inputError : null]}
            value={purchaseDate}
            onChangeText={(value: string) => {
              setPurchaseDate(value);
              if (purchaseDateError) setPurchaseDateError(undefined);
            }}
            placeholder="2023-08-15"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            accessibilityLabel="Purchase date"
          />
          {purchaseDateError ? <Text style={styles.errorText}>{purchaseDateError}</Text> : null}
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            You can add a home photo on the next step, or skip it and come back later.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: 24 + insets.bottom }]}>
        <Pressable
          style={[styles.saveButton, isSaving && styles.buttonDisabled]}
          onPress={() => void handleSave()}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="Create my home"
          accessibilityState={{ busy: isSaving }}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Create my home</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.page,
  },
  header: {
    paddingHorizontal: 28,
    paddingBottom: 20,
    gap: 6,
    backgroundColor: colors.page,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  backButton: {
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  backText: {
    color: colors.blue,
    fontSize: 15,
    fontWeight: '600',
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.ink,
  },
  subheading: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
    lineHeight: 20,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 20,
    gap: 28,
  },
  field: {
    gap: 10,
  },
  optionalSection: {
    gap: 6,
    padding: 14,
    borderRadius: 12,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
  },
  optionalHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  optionalBody: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
    lineHeight: 19,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  input: {
    minHeight: 50,
    borderRadius: 10,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '500',
  },
  inputError: {
    borderColor: colors.red,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.red,
  },
  saveErrorText: {
    borderRadius: 8,
    backgroundColor: colors.redSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.red,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  tipCard: {
    borderRadius: 12,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.blueSoft,
    padding: 14,
  },
  tipText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
  },
  typeChipSelected: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
  typeChipTextSelected: {
    color: colors.green,
  },
  actions: {
    paddingHorizontal: 28,
    paddingTop: 16,
    backgroundColor: colors.page,
    borderTopColor: colors.line,
    borderTopWidth: 1,
  },
  saveButton: {
    backgroundColor: colors.green,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
