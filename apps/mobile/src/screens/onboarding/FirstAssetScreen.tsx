import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Property } from '@homevault/domain';
import type { CreateAssetInput } from '@homevault/database';
import { getHomeVaultRepository } from '../../data/localHomeVaultRepository';
import { colors } from '../../theme/colors';

const CATEGORIES = [
  'Appliance',
  'Heating & cooling',
  'Plumbing',
  'Electrical',
  'Roofing',
  'Windows & doors',
  'Flooring',
  'Security',
  'Exterior',
  'Structure',
];

type Props = {
  property: Property;
  initialCategory?: string;
  onSaved: () => void;
  onBack: () => void;
};

export function FirstAssetScreen({
  property,
  initialCategory = 'Appliance',
  onSaved,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [nameError, setNameError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  function validate(): boolean {
    if (name.trim().length === 0) {
      setNameError('Give it a name to continue.');
      return false;
    }
    setNameError(undefined);
    return true;
  }

  async function handleSave() {
    if (!validate() || isSaving) return;
    setIsSaving(true);
    try {
      const repo = await getHomeVaultRepository();
      const input: CreateAssetInput = {
        propertyId: property.id,
        name: name.trim(),
        category,
        status: 'ready',
      };
      await repo.createAsset(input);
      onSaved();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: 16 + insets.top }]}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.heading}>Add an item</Text>
        <Text style={styles.subheading}>
          Just name and category — you can fill in brand, model, and other details later.
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, nameError ? styles.inputError : null]}
            value={name}
            onChangeText={(v: string) => {
              setName(v);
              if (nameError) setNameError(undefined);
            }}
            placeholder="e.g. Dishwasher, Furnace, Roof"
            placeholderTextColor={colors.muted}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => void handleSave()}
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.chipGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={[styles.chip, category === cat && styles.chipSelected]}
                onPress={() => setCategory(cat)}
                accessibilityRole="radio"
                accessibilityState={{ checked: category === cat }}
                accessibilityLabel={cat}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextSelected]}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.hint}>
          <Text style={styles.hintText}>
            Room assignment is optional — you can organize by room from the Household tab after setup.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: 24 + insets.bottom }]}>
        <Pressable
          style={[styles.saveButton, isSaving && styles.buttonDisabled]}
          onPress={() => void handleSave()}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="Save and continue"
          accessibilityState={{ busy: isSaving }}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save and continue</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.page },
  header: {
    paddingHorizontal: 28,
    paddingBottom: 20,
    gap: 6,
    backgroundColor: colors.page,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  backButton: { marginBottom: 4, alignSelf: 'flex-start' },
  backText: { color: colors.blue, fontSize: 15, fontWeight: '600' },
  heading: { fontSize: 26, fontWeight: '800', color: colors.ink },
  subheading: { fontSize: 14, fontWeight: '500', color: colors.muted, lineHeight: 20 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 28, paddingTop: 28, paddingBottom: 20, gap: 24 },
  field: { gap: 10 },
  label: { fontSize: 14, fontWeight: '700', color: colors.ink },
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
  inputError: { borderColor: colors.red },
  errorText: { fontSize: 13, fontWeight: '600', color: colors.red },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
  },
  chipSelected: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  chipTextSelected: { color: colors.green },
  hint: {
    backgroundColor: colors.panel,
    borderRadius: 10,
    borderColor: colors.line,
    borderWidth: 1,
    padding: 14,
  },
  hintText: { fontSize: 13, fontWeight: '500', color: colors.muted, lineHeight: 19 },
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
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
