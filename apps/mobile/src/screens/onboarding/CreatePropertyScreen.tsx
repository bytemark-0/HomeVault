import { useState } from 'react';
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
  const [type, setType] = useState<Property['type']>('single_family');
  const [isSaving, setIsSaving] = useState(false);
  const [labelError, setLabelError] = useState<string | undefined>();

  function validate(): boolean {
    if (label.trim().length === 0) {
      setLabelError('Give your home a name to continue.');
      return false;
    }
    setLabelError(undefined);
    return true;
  }

  async function handleSave() {
    if (!validate() || isSaving) return;
    setIsSaving(true);
    try {
      const repo = await getHomeVaultRepository();
      const input: CreatePropertyInput = { label: label.trim(), type };
      const property = await repo.createProperty(input);
      onCreated(property);
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
        <Pressable onPress={onBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Back">
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
            onChangeText={(v: string) => { setLabel(v); if (labelError) setLabelError(undefined); }}
            placeholder="e.g. Oak Street home"
            placeholderTextColor={colors.muted}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => void handleSave()}
            accessibilityLabel="Home name"
          />
          {labelError ? <Text style={styles.errorText}>{labelError}</Text> : null}
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
                <Text style={[styles.typeChipText, type === pt.value && styles.typeChipTextSelected]}>
                  {pt.label}
                </Text>
              </Pressable>
            ))}
          </View>
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
