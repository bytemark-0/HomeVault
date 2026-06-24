import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import { Alert, Linking } from 'react-native';

import { PhotoPickerField } from '../../components/PhotoPickerField';
import { copyPhotoToAppStorage, deleteAppOwnedPhoto } from '../../utils/photoStorage';

jest.mock('expo-image-picker', () => ({
  getCameraPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  getMediaLibraryPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('../../utils/photoStorage', () => ({
  copyPhotoToAppStorage: jest.fn(),
  deleteAppOwnedPhoto: jest.fn(),
}));

const ImagePicker = require('expo-image-picker');
const mockCopyPhotoToAppStorage = copyPhotoToAppStorage as jest.MockedFunction<
  typeof copyPhotoToAppStorage
>;
const mockDeleteAppOwnedPhoto = deleteAppOwnedPhoto as jest.MockedFunction<
  typeof deleteAppOwnedPhoto
>;

function ControlledPhotoPickerField({
  initialValue = '',
  originalValue = '',
}: {
  initialValue?: string;
  originalValue?: string;
}) {
  const [value, setValue] = useState(initialValue);

  function handleChange(nextValue: string) {
    if (value && value !== originalValue) {
      void deleteAppOwnedPhoto(value);
    }
    setValue(nextValue);
  }

  return <PhotoPickerField prefix="asset" value={value} onChange={handleChange} />;
}

describe('PhotoPickerField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const removeAction = buttons?.find((button) => button.text === 'Remove');
      removeAction?.onPress?.();
    });
    ImagePicker.getCameraPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: true,
    });
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    });
    ImagePicker.getMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: true,
    });
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    });
    ImagePicker.launchCameraAsync.mockResolvedValue({ canceled: true });
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true });
    mockCopyPhotoToAppStorage.mockResolvedValue('file:///documents/homevault-assets/asset.jpg');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows an explanation before opening the library picker', async () => {
    const onChange = jest.fn();
    const { getByText } = await render(
      <PhotoPickerField prefix="asset" value="" onChange={onChange} />,
    );

    await fireEvent.press(getByText('Choose from library'));

    expect(ImagePicker.requestMediaLibraryPermissionsAsync).not.toHaveBeenCalled();
    expect(
      getByText(
        'HomeVault will open your photo library. The image stays on your device and is never uploaded.',
      ),
    ).toBeTruthy();

    ImagePicker.getMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    });
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///picked/asset.jpg' }],
    });

    await fireEvent.press(getByText('Continue'));

    await waitFor(() =>
      expect(mockCopyPhotoToAppStorage).toHaveBeenCalledWith('asset', 'file:///picked/asset.jpg'),
    );
    expect(onChange).toHaveBeenCalledWith('file:///documents/homevault-assets/asset.jpg');
  });

  it('shows the settings action when camera access is permanently denied', async () => {
    ImagePicker.getCameraPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    });

    const { getByText } = await render(
      <PhotoPickerField prefix="asset" value="" onChange={jest.fn()} />,
    );

    await fireEvent.press(getByText('Take photo'));
    await fireEvent.press(getByText('Continue'));

    await waitFor(() =>
      expect(
        getByText(
          'Camera access is turned off for HomeVault. Open Settings to enable it, or choose a library photo instead.',
        ),
      ).toBeTruthy(),
    );

    await fireEvent.press(getByText('Open settings'));

    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
    expect(ImagePicker.requestCameraPermissionsAsync).not.toHaveBeenCalled();
  });

  it('shows replace controls when a photo already exists', async () => {
    const { getByText } = await render(
      <PhotoPickerField prefix="asset" value="file:///existing-asset.jpg" onChange={jest.fn()} />,
    );

    expect(getByText('Take a new photo')).toBeTruthy();
    expect(getByText('Choose a different photo')).toBeTruthy();
    expect(getByText('Remove')).toBeTruthy();
  });

  it('does not update the field when the user cancels image selection', async () => {
    ImagePicker.getMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    });
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true });
    const onChange = jest.fn();
    const { getByText } = await render(
      <PhotoPickerField prefix="asset" value="" onChange={onChange} />,
    );

    await fireEvent.press(getByText('Choose from library'));
    await fireEvent.press(getByText('Continue'));

    await waitFor(() =>
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledTimes(1),
    );
    expect(mockCopyPhotoToAppStorage).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('replaces an existing draft photo and cleans up the previous copy', async () => {
    ImagePicker.getMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    });
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///picked/replacement.jpg' }],
    });
    mockCopyPhotoToAppStorage.mockResolvedValue('file:///documents/homevault-assets/replacement.jpg');

    const { getByText } = await render(
      <ControlledPhotoPickerField
        initialValue="file:///documents/homevault-assets/original.jpg"
        originalValue=""
      />,
    );

    await fireEvent.press(getByText('Choose a different photo'));
    await fireEvent.press(getByText('Continue'));

    await waitFor(() =>
      expect(mockCopyPhotoToAppStorage).toHaveBeenCalledWith(
        'asset',
        'file:///picked/replacement.jpg',
      ),
    );
    expect(mockDeleteAppOwnedPhoto).toHaveBeenCalledWith(
      'file:///documents/homevault-assets/original.jpg',
    );
  });

  it('removes a selected draft photo and cleans up its stored copy', async () => {
    const { getByText } = await render(
      <ControlledPhotoPickerField
        initialValue="file:///documents/homevault-assets/original.jpg"
        originalValue=""
      />,
    );

    await fireEvent.press(getByText('Remove'));

    expect(mockDeleteAppOwnedPhoto).toHaveBeenCalledWith(
      'file:///documents/homevault-assets/original.jpg',
    );
  });
});
