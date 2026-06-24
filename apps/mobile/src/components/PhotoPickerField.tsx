import { useState } from 'react';
import { Alert, Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { copyPhotoToAppStorage } from '../utils/photoStorage';
import {
  ensureMediaPermission,
  launchImageSelection,
  type MediaSource,
} from '../utils/mediaPicker';
import { colors } from '../theme/colors';

type Props = {
  prefix: string;
  value: string;
  onChange: (uri: string) => void;
  aspectRatio?: [number, number];
  accessibilityLabel?: string;
};

export function PhotoPickerField({
  prefix,
  value,
  onChange,
  aspectRatio = [4, 3],
  accessibilityLabel,
}: Props) {
  const [pendingSource, setPendingSource] = useState<MediaSource | null>(null);
  const [permissionNotice, setPermissionNotice] = useState<{
    blocked: boolean;
    source: MediaSource;
  } | null>(null);

  async function handlePick(source: MediaSource) {
    setPendingSource(null);
    setPermissionNotice(null);

    const permission = await ensureMediaPermission(source);

    if (!permission.granted) {
      setPermissionNotice({ blocked: permission.blocked, source });
      return;
    }

    const asset = await launchImageSelection(source, aspectRatio);

    if (!asset) return;

    const stored = await copyPhotoToAppStorage(prefix, asset.uri);
    onChange(stored ?? asset.uri);
  }

  function openSettings() {
    void Linking.openSettings().catch(() => {});
  }

  let content;

  if (pendingSource) {
    content = (
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
            style={styles.cancelButton}
            onPress={() => setPendingSource(null)}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  } else if (permissionNotice) {
    content = (
      <View style={[styles.explanationCard, styles.warningCard]}>
        <Text style={styles.explanationText}>
          {permissionNotice.source === 'camera'
            ? permissionNotice.blocked
              ? 'Camera access is turned off for HomeVault. Open Settings to enable it, or choose a library photo instead.'
              : 'HomeVault could not use the camera this time. You can try again or choose a library photo instead.'
            : permissionNotice.blocked
              ? 'Photo library access is turned off for HomeVault. Open Settings to enable it, or take a new photo instead.'
              : 'HomeVault could not open your photo library this time. You can try again or take a new photo instead.'}
        </Text>
        <View style={styles.explanationRow}>
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
              style={styles.cancelButton}
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
              <Text style={styles.cancelText}>
                {permissionNotice.source === 'camera' ? 'Use library instead' : 'Take a photo instead'}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <Pressable
          style={styles.dismissButton}
          onPress={() => setPermissionNotice(null)}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        >
          <Text style={styles.dismissText}>Dismiss</Text>
        </Pressable>
      </View>
    );
  } else {
    content = (
      <View style={styles.pickerRow}>
        {Platform.OS !== 'web' ? (
          <Pressable
            style={styles.pickerButton}
            onPress={() => setPendingSource('camera')}
            accessibilityRole="button"
            accessibilityLabel={value ? 'Take a new photo' : 'Take a photo'}
          >
            <Text style={styles.pickerText}>{value ? 'Take a new photo' : 'Take photo'}</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={styles.pickerButton}
          onPress={() => setPendingSource('library')}
          accessibilityRole="button"
          accessibilityLabel={value ? 'Choose a different photo' : 'Choose from library'}
        >
          <Text style={styles.pickerText}>
            {value ? 'Choose a different photo' : 'Choose from library'}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.fieldWrap}>
      {value ? (
        <View style={styles.previewWrap}>
          <Image
            source={{ uri: value }}
            style={styles.preview}
            resizeMode="cover"
            accessibilityLabel={accessibilityLabel ?? 'Photo preview'}
          />
          <Pressable
            style={styles.removeButton}
            onPress={() =>
              Alert.alert('Remove photo', 'Remove this photo?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => {
                    onChange('');
                  },
                },
              ])
            }
            accessibilityRole="button"
            accessibilityLabel="Remove photo"
          >
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        </View>
      ) : null}
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: { gap: 10 },
  previewWrap: { position: 'relative', borderRadius: 8, overflow: 'hidden' },
  preview: { width: '100%', height: 180, borderRadius: 8 },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  removeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  pickerRow: { flexDirection: 'row', gap: 10 },
  pickerButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerText: { color: colors.blue, fontSize: 13, fontWeight: '900' },
  explanationCard: {
    backgroundColor: colors.blueSoft,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  warningCard: {
    backgroundColor: colors.amberSoft,
  },
  explanationText: { fontSize: 13, fontWeight: '600', color: colors.ink, lineHeight: 19 },
  explanationRow: { flexDirection: 'row', gap: 8 },
  continueButton: {
    flex: 1,
    minHeight: 38,
    backgroundColor: colors.blue,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  cancelButton: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  dismissButton: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
});
