import { useEffect, useState } from 'react';
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

import type { Asset, Property, RoomArea } from '@homevault/domain';
import type { CreateAssetInput } from '@homevault/database';
import { getHomeVaultRepository } from '../../data/localHomeVaultRepository';
import { PhotoPickerField } from '../../components/PhotoPickerField';
import { deleteAppOwnedPhoto } from '../../utils/photoStorage';
import { maybeAddRecommendedMaintenanceTasks } from '../../utils/recommendedMaintenance';
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

type AssetFormState = {
  name: string;
  category: string;
  roomId: string;
  brand: string;
  model: string;
  serial: string;
  notes: string;
};

export function FirstAssetScreen({
  property,
  initialCategory = 'Appliance',
  onSaved,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'details' | 'photo'>('details');
  const [rooms, setRooms] = useState<RoomArea[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<AssetFormState>({
    name: '',
    category: initialCategory,
    roomId: '',
    brand: '',
    model: '',
    serial: '',
    notes: '',
  });
  const [nameError, setNameError] = useState<string | undefined>();
  const [saveError, setSaveError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [createdAsset, setCreatedAsset] = useState<Asset | null>(null);
  const [recommendedTaskCount, setRecommendedTaskCount] = useState(0);
  const [photoUri, setPhotoUri] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadRooms() {
      try {
        const repo = await getHomeVaultRepository();
        const propertyRooms = await repo.getRooms(property.id);

        if (!isMounted) {
          return;
        }

        setRooms(propertyRooms);
      } catch {
        if (!isMounted) {
          return;
        }

        setRooms([]);
      }
    }

    void loadRooms();

    return () => {
      isMounted = false;
    };
  }, [property.id]);

  function validate(): boolean {
    if (form.name.trim().length === 0) {
      setNameError('Give it a name to continue.');
      setSaveError(undefined);
      return false;
    }
    setNameError(undefined);
    return true;
  }

  function handleBack() {
    if (step === 'photo') {
      if (photoUri) {
        void deleteAppOwnedPhoto(photoUri);
        setPhotoUri('');
      }

      setStep('details');
      return;
    }

    onBack();
  }

  async function handleSaveDetails() {
    if (!validate() || isSaving) return;
    setIsSaving(true);
    setSaveError(undefined);
    try {
      const repo = await getHomeVaultRepository();
      const input: CreateAssetInput = {
        propertyId: property.id,
        roomId: cleanOptional(form.roomId),
        name: form.name.trim(),
        category: form.category,
        brand: cleanOptional(form.brand),
        model: cleanOptional(form.model),
        serial: cleanOptional(form.serial),
        notes: cleanOptional(form.notes),
        status: 'ready',
      };
      const asset = await repo.createAsset(input);
      let reminderCount = 0;

      try {
        reminderCount = await maybeAddRecommendedMaintenanceTasks(repo, asset);
      } catch {
        setSaveError(
          'Your item is saved, but we could not add the recommended reminders this time.',
        );
      }

      setCreatedAsset(asset);
      setRecommendedTaskCount(reminderCount);
      setStep('photo');
    } catch {
      setSaveError(
        'We could not save this item yet. Your details are still here, so you can try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleFinish() {
    if (!createdAsset || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(undefined);

    try {
      if (photoUri) {
        const repo = await getHomeVaultRepository();
        await repo.updateAsset({
          ...createdAsset,
          photoUri,
        });
      }

      onSaved();
    } catch {
      setSaveError(
        'We could not finish saving this item. You can try again or skip the photo for now.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleSkipPhoto() {
    if (photoUri) {
      void deleteAppOwnedPhoto(photoUri);
      setPhotoUri('');
    }

    onSaved();
  }

  if (step === 'photo' && createdAsset) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: 16 + insets.top }]}>
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.heading}>Your first item is saved</Text>
          <Text style={styles.subheading}>
            Add a photo to make it easier to recognize later, or finish setup and keep moving.
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>{createdAsset.name}</Text>
            <Text style={styles.successBody}>
              Saved as {createdAsset.category}.{' '}
              {recommendedTaskCount > 0
                ? `Added ${recommendedTaskCount} recommended reminder${
                    recommendedTaskCount === 1 ? '' : 's'
                  } for it.`
                : 'You can still edit brand, model, notes, and other details after onboarding.'}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Photo (optional)</Text>
            <PhotoPickerField
              prefix="asset"
              value={photoUri}
              onChange={setPhotoUri}
              accessibilityLabel="Asset photo"
            />
          </View>

          <View style={styles.hint}>
            <Text style={styles.hintText}>
              Photos stay on this device unless you export or back up your vault.
            </Text>
          </View>

          {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
        </ScrollView>

        <View style={[styles.actions, { paddingBottom: 24 + insets.bottom }]}>
          <Pressable
            style={[styles.saveButton, isSaving && styles.buttonDisabled]}
            onPress={() => void handleFinish()}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel={photoUri ? 'Save photo and finish' : 'Finish to dashboard'}
            accessibilityState={{ busy: isSaving }}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {photoUri ? 'Save photo and finish' : 'Finish to dashboard'}
              </Text>
            )}
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={handleSkipPhoto}
            accessibilityRole="button"
            accessibilityLabel="Skip photo for now"
          >
            <Text style={styles.secondaryButtonText}>Skip photo for now</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: 16 + insets.top }]}>
        <Pressable
          onPress={handleBack}
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
            value={form.name}
            onChangeText={(v: string) => {
              setForm((current) => ({ ...current, name: v }));
              if (nameError) setNameError(undefined);
            }}
            placeholder="e.g. Dishwasher, Furnace, Roof"
            placeholderTextColor={colors.muted}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => void handleSaveDetails()}
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.chipGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={[styles.chip, form.category === cat && styles.chipSelected]}
                onPress={() => setForm((current) => ({ ...current, category: cat }))}
                accessibilityRole="radio"
                accessibilityState={{ checked: form.category === cat }}
                accessibilityLabel={cat}
              >
                <Text
                  style={[styles.chipText, form.category === cat && styles.chipTextSelected]}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Room or area (optional)</Text>
          {rooms.length > 0 ? (
            <View style={styles.chipGrid}>
              <Pressable
                style={[styles.chip, form.roomId === '' && styles.chipSelected]}
                onPress={() => setForm((current) => ({ ...current, roomId: '' }))}
                accessibilityRole="radio"
                accessibilityState={{ checked: form.roomId === '' }}
                accessibilityLabel="No room yet"
              >
                <Text style={[styles.chipText, form.roomId === '' && styles.chipTextSelected]}>
                  No room yet
                </Text>
              </Pressable>
              {rooms.map((room) => (
                <Pressable
                  key={room.id}
                  style={[styles.chip, form.roomId === room.id && styles.chipSelected]}
                  onPress={() => setForm((current) => ({ ...current, roomId: room.id }))}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: form.roomId === room.id }}
                  accessibilityLabel={room.name}
                >
                  <Text
                    style={[styles.chipText, form.roomId === room.id && styles.chipTextSelected]}
                  >
                    {room.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.hint}>
              <Text style={styles.hintText}>
                Room assignment is optional. You can finish this now and organize it by room later.
              </Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => setShowAdvanced((current) => !current)}
          style={styles.advancedToggle}
          accessibilityRole="button"
          accessibilityLabel={showAdvanced ? 'Hide extra details' : 'Add more details'}
        >
          <Text style={styles.advancedToggleText}>
            {showAdvanced ? 'Hide extra details ▴' : 'Add more details ▾'}
          </Text>
        </Pressable>

        {showAdvanced ? (
          <View style={styles.advancedPanel}>
            <View style={styles.field}>
              <Text style={styles.label}>Brand (optional)</Text>
              <TextInput
                style={styles.input}
                value={form.brand}
                onChangeText={(brand: string) =>
                  setForm((current) => ({ ...current, brand }))
                }
                placeholder="e.g. Bosch"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Model (optional)</Text>
              <TextInput
                style={styles.input}
                value={form.model}
                onChangeText={(model: string) =>
                  setForm((current) => ({ ...current, model }))
                }
                placeholder="Model number"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Serial number (optional)</Text>
              <TextInput
                style={styles.input}
                value={form.serial}
                onChangeText={(serial: string) =>
                  setForm((current) => ({ ...current, serial }))
                }
                placeholder="Serial number"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={form.notes}
                onChangeText={(notes: string) =>
                  setForm((current) => ({ ...current, notes }))
                }
                placeholder="Where it is, what to watch, warranty reminder..."
                placeholderTextColor={colors.muted}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>
        ) : null}

        <View style={styles.hint}>
          <Text style={styles.hintText}>
            Keep going with just the basics. You can add purchase dates, warranty info, and a
            photo after this.
          </Text>
        </View>

        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: 24 + insets.bottom }]}>
        <Pressable
          style={[styles.saveButton, isSaving && styles.buttonDisabled]}
          onPress={() => void handleSaveDetails()}
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
  notesInput: {
    minHeight: 96,
    paddingTop: 12,
  },
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
  advancedToggle: {
    borderRadius: 10,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  advancedToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.blue,
  },
  advancedPanel: {
    gap: 18,
  },
  successCard: {
    borderRadius: 10,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.greenSoft,
    padding: 14,
    gap: 6,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
  },
  successBody: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: 28,
    paddingTop: 16,
    gap: 10,
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
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
  },
  secondaryButtonText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '700',
  },
});

function cleanOptional(value: string): string | undefined {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}
