import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { PropertyPhotoScreen } from '../../screens/onboarding/PropertyPhotoScreen';
import { getHomeVaultRepository } from '../../data/localHomeVaultRepository';
import { copyPhotoToAppStorage, deleteAppOwnedPhoto } from '../../utils/photoStorage';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('expo-image-picker', () => ({
  getCameraPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  getMediaLibraryPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('../../data/localHomeVaultRepository', () => ({
  getHomeVaultRepository: jest.fn(),
}));

jest.mock('../../utils/photoStorage', () => ({
  copyPhotoToAppStorage: jest.fn(),
  deleteAppOwnedPhoto: jest.fn(),
}));

const ImagePicker = require('expo-image-picker');

const mockGetHomeVaultRepository = getHomeVaultRepository as jest.MockedFunction<
  typeof getHomeVaultRepository
>;
const mockCopyPhotoToAppStorage = copyPhotoToAppStorage as jest.MockedFunction<
  typeof copyPhotoToAppStorage
>;
const mockDeleteAppOwnedPhoto = deleteAppOwnedPhoto as jest.MockedFunction<
  typeof deleteAppOwnedPhoto
>;

describe('PropertyPhotoScreen', () => {
  const property = {
    id: 'property-1',
    householdId: 'household-1',
    label: 'Oak Street home',
    type: 'single_family' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, 'openSettings').mockResolvedValue();
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
    mockCopyPhotoToAppStorage.mockResolvedValue('file:///documents/homevault-assets/property.jpg');
    mockDeleteAppOwnedPhoto.mockResolvedValue(undefined);
    mockGetHomeVaultRepository.mockResolvedValue({
      updateProperty: jest.fn().mockResolvedValue(undefined),
    } as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows a camera explanation before requesting permission', async () => {
    const { getByText } = await render(
      <PropertyPhotoScreen property={property} onDone={jest.fn()} onSkip={jest.fn()} />,
    );

    await fireEvent.press(getByText('Take a photo'));

    expect(ImagePicker.requestCameraPermissionsAsync).not.toHaveBeenCalled();
    expect(
      getByText(
        'HomeVault needs camera access to take a photo. The image stays on your device and is never uploaded.',
      ),
    ).toBeTruthy();

    await fireEvent.press(getByText('Continue'));

    await waitFor(() => expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalledTimes(1));
  });

  it('requests library permission only after the user confirms', async () => {
    const { getByText } = await render(
      <PropertyPhotoScreen property={property} onDone={jest.fn()} onSkip={jest.fn()} />,
    );

    await fireEvent.press(getByText('Choose from library'));

    expect(ImagePicker.requestMediaLibraryPermissionsAsync).not.toHaveBeenCalled();

    await fireEvent.press(getByText('Continue'));

    await waitFor(() =>
      expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalledTimes(1),
    );
  });

  it('shows a settings path when library access is permanently denied', async () => {
    ImagePicker.getMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    });

    const { getByText } = await render(
      <PropertyPhotoScreen property={property} onDone={jest.fn()} onSkip={jest.fn()} />,
    );

    await fireEvent.press(getByText('Choose from library'));
    await fireEvent.press(getByText('Continue'));

    await waitFor(() =>
      expect(
        getByText(
          'Photo library access is turned off for HomeVault. Open Settings to enable it, take a new photo instead, or skip for now.',
        ),
      ).toBeTruthy(),
    );

    await fireEvent.press(getByText('Open settings'));

    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
    expect(ImagePicker.requestMediaLibraryPermissionsAsync).not.toHaveBeenCalled();
  });

  it('saves a selected library photo and continues onboarding', async () => {
    const updateProperty = jest.fn().mockResolvedValue(undefined);
    mockGetHomeVaultRepository.mockResolvedValue({ updateProperty } as never);
    ImagePicker.getMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    });
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///picked/home.jpg' }],
    });
    const onDone = jest.fn();
    const { getByText } = await render(
      <PropertyPhotoScreen property={property} onDone={onDone} onSkip={jest.fn()} />,
    );

    await fireEvent.press(getByText('Choose from library'));
    await fireEvent.press(getByText('Continue'));

    await waitFor(() =>
      expect(mockCopyPhotoToAppStorage).toHaveBeenCalledWith('property', 'file:///picked/home.jpg'),
    );

    await fireEvent.press(getByText('Save and continue'));

    await waitFor(() =>
      expect(updateProperty).toHaveBeenCalledWith({
        ...property,
        photoUri: 'file:///documents/homevault-assets/property.jpg',
      }),
    );
    expect(onDone).toHaveBeenCalledWith({
      ...property,
      photoUri: 'file:///documents/homevault-assets/property.jpg',
    });
  });

  it('cleans up a newly selected photo when the user skips', async () => {
    ImagePicker.getMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    });
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///picked/home.jpg' }],
    });
    const onSkip = jest.fn();
    const { getByText } = await render(
      <PropertyPhotoScreen property={property} onDone={jest.fn()} onSkip={onSkip} />,
    );

    await fireEvent.press(getByText('Choose from library'));
    await fireEvent.press(getByText('Continue'));
    await waitFor(() =>
      expect(mockCopyPhotoToAppStorage).toHaveBeenCalledWith('property', 'file:///picked/home.jpg'),
    );

    await fireEvent.press(getByText('Skip for now'));

    expect(mockDeleteAppOwnedPhoto).toHaveBeenCalledWith(
      'file:///documents/homevault-assets/property.jpg',
    );
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
