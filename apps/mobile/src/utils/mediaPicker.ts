import * as ImagePicker from 'expo-image-picker';

export type MediaSource = 'camera' | 'library';

export type MediaPermissionResult = {
  granted: boolean;
  blocked: boolean;
};

export async function ensureMediaPermission(
  source: MediaSource,
): Promise<MediaPermissionResult> {
  const current =
    source === 'camera'
      ? await ImagePicker.getCameraPermissionsAsync()
      : await ImagePicker.getMediaLibraryPermissionsAsync();

  if (current.granted) {
    return { granted: true, blocked: false };
  }

  if (!current.canAskAgain) {
    return { granted: false, blocked: true };
  }

  const requested =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  return {
    granted: requested.granted,
    blocked: !requested.granted && !requested.canAskAgain,
  };
}

export async function launchImageSelection(
  source: MediaSource,
  aspect: [number, number] = [4, 3],
  quality = 0.85,
): Promise<ImagePicker.ImagePickerAsset | null> {
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect,
          quality,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect,
          quality,
        });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return result.assets[0];
}
