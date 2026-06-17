import { useState } from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { copyPhotoToAppStorage, deleteAppOwnedPhoto } from '../utils/photoStorage';
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
        aspect: aspectRatio,
        quality: 0.85,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 0.85,
      });
    }
    if (result.canceled || !result.assets[0]) return;
    if (value) {
      await deleteAppOwnedPhoto(value);
    }
    const stored = await copyPhotoToAppStorage(prefix, result.assets[0].uri);
    onChange(stored ?? result.assets[0].uri);
  }

  if (value) {
    return (
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
                onPress: async () => {
                  await deleteAppOwnedPhoto(value);
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
    );
  }

  if (pendingSource) {
    return (
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
  }

  return (
    <View style={styles.pickerRow}>
      {Platform.OS !== 'web' ? (
        <Pressable
          style={styles.pickerButton}
          onPress={() => setPendingSource('camera')}
          accessibilityRole="button"
          accessibilityLabel="Take a photo"
        >
          <Text style={styles.pickerText}>Take photo</Text>
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
  );
}

const styles = StyleSheet.create({
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
});
