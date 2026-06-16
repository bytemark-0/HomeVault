import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { PartSupply } from '@homevault/domain';
import type { CreatePartInput } from '@homevault/database';
import { colors } from '../theme/colors';

type AddPartScreenProps = {
  propertyId: string;
  assetId: string;
  part?: PartSupply;
  onCancel: () => void;
  onSave: (input: CreatePartInput) => Promise<void>;
};

type PartForm = {
  name: string;
  partNumber: string;
  size: string;
  quantity: string;
  link: string;
};

function initialForm(part?: PartSupply): PartForm {
  return {
    name: part?.name ?? '',
    partNumber: part?.partNumber ?? '',
    size: part?.size ?? '',
    quantity: part?.quantity != null ? String(part.quantity) : '',
    link: part?.link ?? '',
  };
}

export function AddPartScreen({
  propertyId,
  assetId,
  part,
  onCancel,
  onSave,
}: AddPartScreenProps) {
  const [form, setForm] = useState<PartForm>(() => initialForm(part));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<PartForm>>({});

  const isEditing = Boolean(part);

  function updateField(field: keyof PartForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  function validate(): boolean {
    const next: Partial<PartForm> = {};

    if (!form.name.trim()) {
      next.name = 'Part name is required.';
    }

    if (form.quantity.trim() && isNaN(Number(form.quantity.trim()))) {
      next.quantity = 'Quantity must be a number.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate() || saving) return;
    setSaving(true);

    try {
      const quantityNum = form.quantity.trim() ? Number(form.quantity.trim()) : undefined;
      const input: CreatePartInput = {
        ...(isEditing ? { id: part!.id } : {}),
        propertyId,
        assetId,
        name: form.name.trim(),
        partNumber: form.partNumber.trim() || undefined,
        size: form.size.trim() || undefined,
        quantity: quantityNum,
        link: form.link.trim() || undefined,
      };
      await onSave(input);
    } finally {
      setSaving(false);
    }
  }

  function handleOpenLink() {
    const url = form.link.trim();
    if (!url) return;
    const target = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(target).catch(() => {});
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={onCancel} style={styles.secondaryButton} accessibilityRole="button">
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
          <Text style={styles.screenTitle}>{isEditing ? 'Edit part' : 'Add part'}</Text>
          <Pressable
            onPress={() => void handleSave()}
            style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
            accessibilityRole="button"
            disabled={saving}
          >
            <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Save'}</Text>
          </Pressable>
        </View>

        <View style={styles.formPanel}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Part name *</Text>
            <TextInput
              style={[styles.textInput, errors.name ? styles.textInputError : null]}
              value={form.name}
              onChangeText={(v) => updateField('name', v)}
              placeholder="e.g. HVAC filter, water filter, belt"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.fieldGroupHalf}>
              <Text style={styles.fieldLabel}>Part number</Text>
              <TextInput
                style={styles.textInput}
                value={form.partNumber}
                onChangeText={(v) => updateField('partNumber', v)}
                placeholder="e.g. DA29-00020B"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                returnKeyType="next"
              />
            </View>
            <View style={styles.fieldGroupHalf}>
              <Text style={styles.fieldLabel}>Size / spec</Text>
              <TextInput
                style={styles.textInput}
                value={form.size}
                onChangeText={(v) => updateField('size', v)}
                placeholder="e.g. 20x25x1 MERV-8"
                placeholderTextColor={colors.muted}
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Quantity on hand</Text>
            <TextInput
              style={[styles.textInput, errors.quantity ? styles.textInputError : null]}
              value={form.quantity}
              onChangeText={(v) => updateField('quantity', v)}
              placeholder="e.g. 3"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              returnKeyType="next"
            />
            {errors.quantity ? <Text style={styles.errorText}>{errors.quantity}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Purchase link</Text>
            <TextInput
              style={styles.textInput}
              value={form.link}
              onChangeText={(v) => updateField('link', v)}
              placeholder="https://amazon.com/…"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="url"
              returnKeyType="done"
            />
            {form.link.trim() ? (
              <Pressable
                onPress={handleOpenLink}
                style={styles.linkPreviewButton}
                accessibilityRole="link"
              >
                <Text style={styles.linkPreviewText}>Open link</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.page,
  },
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  primaryButton: {
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  formPanel: {
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    padding: 14,
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldGroupHalf: {
    flex: 1,
    gap: 6,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  textInput: {
    minHeight: 44,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.page,
    paddingHorizontal: 12,
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  textInputError: {
    borderColor: colors.red,
  },
  errorText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '700',
  },
  linkPreviewButton: {
    alignSelf: 'flex-start',
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 7,
    borderColor: colors.blue,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkPreviewText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '900',
  },
});
