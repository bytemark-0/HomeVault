import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

import type { Property } from '@homevault/domain';
import { getHomeVaultRepository } from '../../data/localHomeVaultRepository';
import { colors } from '../../theme/colors';

type Props = {
  property: Property;
  onDone: (updated: Property) => void;
  onSkip: () => void;
};

export function PropertyPhotoScreen({ property, onDone, onSkip }: Props) {
  const insets = useSafeAreaInsets();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingSource, setPendingSource] = useState<'camera' | 'library' | null>(null);

  async function handlePick(source: 'camera' | 'library') {
    setPendingSource(null);
    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });
    }
    if (result.canceled || !result.assets[0]) return;
    const stored = await copyToAppStorage(result.assets[0].uri);
    setPhotoUri(stored ?? result.assets[0].uri);
  }

  async function handleSave() {
    if (!photoUri || isSaving) return;
    setIsSaving(true);
    try {
      const repo = await getHomeVaultRepository();
      const updated: Property = { ...property, photoUri };
      await repo.updateProperty(updated);
      onDone(updated);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: 16 + insets.top }]}>
        <Text style={styles.heading}>Add a home photo</Text>
        <Text style={styles.subheading}>
          Make the vault feel like yours. You can skip this and add a photo from the property settings later.
        </Text>
      </View>

      <View style={styles.body}>
        {photoUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
            <Pressable
              style={styles.removeButton}
              onPress={() => setPhotoUri(null)}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
            >
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>🏠</Text>
            <Text style={styles.placeholderLabel}>No photo yet</Text>
          </View>
        )}

        {pendingSource ? (
          <View style={styles.explanationCard}>
            <Text style={styles.explanationText}>
              {pendingSource === 'camera'
                ? 'HomeVault needs camera access to take a photo. The image stays on your device and is never uploaded.'
                : 'HomeVault will open your photo library. The image stays on your device and is never uploaded.'}
            </Text>
            <View style={styles.explanationRow}>
              <Pressable
                style={styles.continueButton}
                onPress={() => void handlePick(pendingSource)}
                accessibilityRole="button"
                accessibilityLabel="Continue"
              >
                <Text style={styles.continueText}>Continue</Text>
              </Pressable>
              <Pressable
                style={styles.cancelExplanationButton}
                onPress={() => setPendingSource(null)}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.cancelExplanationText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : !photoUri ? (
          <View style={styles.pickerRow}>
            {Platform.OS !== 'web' ? (
              <Pressable
                style={styles.pickerButton}
                onPress={() => setPendingSource('camera')}
                accessibilityRole="button"
                accessibilityLabel="Take a photo"
              >
                <Text style={styles.pickerText}>Take a photo</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={styles.pickerButton}
              onPress={() => setPendingSource('library')}
              accessibilityRole="button"
              accessibilityLabel="Choose from library"
            >
              <Text style={styles.pickerText}>Choose from library</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={[styles.actions, { paddingBottom: 24 + insets.bottom }]}>
        {photoUri ? (
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
        ) : null}
        <Pressable
          style={styles.skipButton}
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip for now"
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}

async function copyToAppStorage(sourceUri: string): Promise<string | null> {
  if (!FileSystem.documentDirectory) return null;
  try {
    const dir = `${FileSystem.documentDirectory}homevault-assets/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const ext = sourceUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const dest = `${dir}property-${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    return dest;
  } catch {
    return null;
  }
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
  heading: { fontSize: 26, fontWeight: '800', color: colors.ink },
  subheading: { fontSize: 14, fontWeight: '500', color: colors.muted, lineHeight: 20 },
  body: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    gap: 20,
  },
  placeholder: {
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.greenSoft,
    borderColor: colors.line,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  placeholderIcon: { fontSize: 40 },
  placeholderLabel: { fontSize: 14, fontWeight: '600', color: colors.muted },
  previewWrap: { position: 'relative', borderRadius: 12, overflow: 'hidden' },
  previewImage: { width: '100%', height: 200, borderRadius: 12 },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  pickerRow: { flexDirection: 'row', gap: 10 },
  pickerButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pickerText: { color: colors.blue, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  explanationCard: {
    backgroundColor: colors.blueSoft,
    borderRadius: 12,
    borderColor: colors.line,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  explanationText: { fontSize: 14, fontWeight: '500', color: colors.ink, lineHeight: 21 },
  explanationRow: { flexDirection: 'row', gap: 10 },
  continueButton: {
    flex: 1,
    minHeight: 42,
    backgroundColor: colors.blue,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  cancelExplanationButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelExplanationText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
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
  skipButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
  },
  skipText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
});
