import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

export async function deleteAppOwnedPhoto(uri: string): Promise<void> {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) return;
  if (!uri.startsWith(FileSystem.documentDirectory)) return;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri);
  } catch {
    // Non-fatal.
  }
}

export async function copyPhotoToAppStorage(
  prefix: string,
  sourceUri: string,
): Promise<string | null> {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) return null;
  try {
    const dir = `${FileSystem.documentDirectory}homevault-assets/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const ext = sourceUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const dest = `${dir}${prefix}-${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    return dest;
  } catch {
    return null;
  }
}
