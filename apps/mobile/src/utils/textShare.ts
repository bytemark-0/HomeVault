import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export async function shareTextFile({
  dialogTitle,
  fileName,
  text,
}: {
  dialogTitle: string;
  fileName: string;
  text: string;
}) {
  if (Platform.OS === 'web') {
    if (typeof document === 'undefined' || typeof URL === 'undefined') {
      throw new Error('Downloading text files is not supported in this preview.');
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    return 'downloaded' as const;
  }

  const isAvailable = await Sharing.isAvailableAsync();

  if (!isAvailable) {
    throw new Error('Sharing is not available on this device.');
  }

  const file = new File(Paths.cache, fileName);
  file.write(text);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/plain',
    dialogTitle,
    UTI: 'public.plain-text',
  });
  return 'shared' as const;
}
