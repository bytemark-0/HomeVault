import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Property } from '@homevault/domain';
import { getHomeVaultRepository } from '../../data/localHomeVaultRepository';
import { copyPhotoToAppStorage, deleteAppOwnedPhoto } from '../../utils/photoStorage';
import {
  ensureMediaPermission,
  launchImageSelection,
  type MediaSource,
} from '../../utils/mediaPicker';
import { colors } from '../../theme/colors';

type Props = {
  property: Property;
  onDone: (updated: Property) => void;
  onSkip: () => void;
};

type PermissionNotice = {
  blocked: boolean;
  source: MediaSource;
};

export function PropertyPhotoScreen({ property, onDone, onSkip }: Props) {
  const insets = useSafeAreaInsets();
  const [photoUri, setPhotoUri] = useState<string | null>(property.photoUri ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingSource, setPendingSource] = useState<MediaSource | null>(null);
  const [permissionNotice, setPermissionNotice] = useState<PermissionNotice | null>(null);
  const [saveError, setSaveError] = useState<string | undefined>();

  async function handlePick(source: MediaSource) {
    setPendingSource(null);
    setPermissionNotice(null);
    setSaveError(undefined);

    const permission = await ensureMediaPermission(source);

    if (!permission.granted) {
      setPermissionNotice({ blocked: permission.blocked, source });
      return;
    }

    const asset = await launchImageSelection(source);

    if (!asset) return;

    if (photoUri) {
      void deleteAppOwnedPhoto(photoUri);
    }

    const stored = await copyPhotoToAppStorage('property', asset.uri);
    setPhotoUri(stored ?? asset.uri);
  }

  async function handleSave() {
    if (!photoUri || isSaving) return;
    setIsSaving(true);
    setSaveError(undefined);
    try {
      const repo = await getHomeVaultRepository();
      const updated: Property = { ...property, photoUri };
      await repo.updateProperty(updated);
      onDone(updated);
    } catch {
      setSaveError(
        'We could not save this photo yet. You can try again or skip for now and add it later.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleSkip() {
    if (photoUri && photoUri !== property.photoUri) {
      void deleteAppOwnedPhoto(photoUri);
    }

    onSkip();
  }

  function openSettings() {
    void Linking.openSettings().catch(() => {});
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
              onPress={() => {
                if (photoUri) {
                  void deleteAppOwnedPhoto(photoUri);
                }

                setPhotoUri(null);
              }}
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
        ) : permissionNotice ? (
          <View style={[styles.explanationCard, permissionNotice.blocked && styles.warningCard]}>
            <Text style={styles.explanationText}>
              {permissionNotice.source === 'camera'
                ? permissionNotice.blocked
                  ? 'Camera access is turned off for HomeVault. Open Settings to enable it, choose a library photo instead, or skip for now.'
                  : 'HomeVault could not use the camera this time. You can try again, choose a library photo instead, or skip for now.'
                : permissionNotice.blocked
                  ? 'Photo library access is turned off for HomeVault. Open Settings to enable it, take a new photo instead, or skip for now.'
                  : 'HomeVault could not open your photo library this time. You can try again, take a new photo instead, or skip for now.'}
            </Text>
            <View style={styles.permissionActions}>
              {permissionNotice.blocked ? (
                <Pressable
                  style={styles.continueButton}
                  onPress={openSettings}
                  accessibilityRole="button"
                  accessibilityLabel="Open settings"
                >
                  <Text style={styles.continueText}>Open settings</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={styles.continueButton}
                  onPress={() => void handlePick(permissionNotice.source)}
                  accessibilityRole="button"
                  accessibilityLabel="Try again"
                >
                  <Text style={styles.continueText}>Try again</Text>
                </Pressable>
              )}
              {Platform.OS !== 'web' ? (
                <Pressable
                  style={styles.cancelExplanationButton}
                  onPress={() =>
                    setPendingSource(permissionNotice.source === 'camera' ? 'library' : 'camera')
                  }
                  accessibilityRole="button"
                  accessibilityLabel={
                    permissionNotice.source === 'camera'
                      ? 'Choose from library instead'
                      : 'Take a photo instead'
                  }
                >
                  <Text style={styles.cancelExplanationText}>
                    {permissionNotice.source === 'camera' ? 'Use library instead' : 'Take a photo instead'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <Pressable
              style={styles.permissionDismissButton}
              onPress={handleSkip}
              accessibilityRole="button"
              accessibilityLabel="Skip for now"
            >
              <Text style={styles.permissionDismissText}>Skip for now</Text>
            </Pressable>
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

        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
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
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip for now"
        >
          <Text style={styles.skipText}>Skip for now</Text>
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
  warningCard: {
    backgroundColor: colors.amberSoft,
  },
  explanationText: { fontSize: 14, fontWeight: '500', color: colors.ink, lineHeight: 21 },
  explanationRow: { flexDirection: 'row', gap: 10 },
  permissionActions: { flexDirection: 'row', gap: 10 },
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
  permissionDismissButton: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionDismissText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
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
  skipButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
  },
  skipText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  errorText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
});
