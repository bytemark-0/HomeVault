import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { FirstAssetScreen } from '../../screens/onboarding/FirstAssetScreen';
import { getHomeVaultRepository } from '../../data/localHomeVaultRepository';
import { deleteAppOwnedPhoto } from '../../utils/photoStorage';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../../data/localHomeVaultRepository', () => ({
  getHomeVaultRepository: jest.fn(),
}));

jest.mock('../../components/PhotoPickerField', () => ({
  PhotoPickerField: ({ onChange }: { onChange: (photoUri: string) => void }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <Pressable accessibilityRole="button" onPress={() => onChange('file:///selected-asset-photo.jpg')}>
        <Text>Choose asset photo</Text>
      </Pressable>
    );
  },
}));

jest.mock('../../utils/photoStorage', () => ({
  deleteAppOwnedPhoto: jest.fn(),
}));

const mockGetHomeVaultRepository = getHomeVaultRepository as jest.MockedFunction<
  typeof getHomeVaultRepository
>;
const mockDeleteAppOwnedPhoto = deleteAppOwnedPhoto as jest.MockedFunction<
  typeof deleteAppOwnedPhoto
>;

describe('FirstAssetScreen', () => {
  const property = {
    id: 'property-1',
    householdId: 'household-1',
    label: 'Home',
    type: 'single_family' as const,
  };
  const rooms = [
    {
      id: 'room-kitchen',
      propertyId: 'property-1',
      name: 'Kitchen',
      type: 'room' as const,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHomeVaultRepository.mockResolvedValue({
      getRooms: jest.fn().mockResolvedValue([]),
      createAsset: jest.fn().mockResolvedValue({
        id: 'asset-1',
        propertyId: 'property-1',
        name: 'Dishwasher',
        category: 'Appliance',
        status: 'ready',
      }),
      updateAsset: jest.fn().mockResolvedValue(undefined),
    } as never);
  });

  it('requires a name before saving', async () => {
    const onSaved = jest.fn();
    const { getByText, queryByText } = await render(
      <FirstAssetScreen property={property} onSaved={onSaved} onBack={jest.fn()} />,
    );

    await fireEvent.press(getByText('Save and continue'));

    expect(queryByText('Give it a name to continue.')).toBeTruthy();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('saves with the provided category and trimmed name', async () => {
    const createAsset = jest.fn().mockResolvedValue({
      id: 'asset-1',
      propertyId: 'property-1',
      name: 'Dishwasher',
      category: 'Appliance',
      status: 'ready',
    });
    mockGetHomeVaultRepository.mockResolvedValue({
      getRooms: jest.fn().mockResolvedValue([]),
      createAsset,
      updateAsset: jest.fn().mockResolvedValue(undefined),
    } as never);
    const onSaved = jest.fn();
    const { getByPlaceholderText, getByText } = await render(
      <FirstAssetScreen
        property={property}
        initialCategory="Heating & cooling"
        onSaved={onSaved}
        onBack={jest.fn()}
      />,
    );

    await fireEvent.changeText(getByPlaceholderText('e.g. Dishwasher, Furnace, Roof'), ' Furnace ');
    await fireEvent.press(getByText('Save and continue'));

    await waitFor(() =>
      expect(createAsset).toHaveBeenCalledWith({
        propertyId: 'property-1',
        name: 'Furnace',
        category: 'Heating & cooling',
        status: 'ready',
      }),
    );

    await waitFor(() => expect(getByText('Your first item is saved')).toBeTruthy());
    await fireEvent.press(getByText('Finish to dashboard'));

    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('saves expanded optional details and an optional room when provided', async () => {
    const createAsset = jest.fn().mockResolvedValue({
      id: 'asset-1',
      propertyId: 'property-1',
      name: 'Security camera',
      category: 'Security',
      roomId: 'room-kitchen',
      status: 'ready',
    });
    mockGetHomeVaultRepository.mockResolvedValue({
      getRooms: jest.fn().mockResolvedValue(rooms),
      createAsset,
      updateAsset: jest.fn().mockResolvedValue(undefined),
    } as never);
    const { getByPlaceholderText, getByText } = await render(
      <FirstAssetScreen property={property} onSaved={jest.fn()} onBack={jest.fn()} />,
    );

    await fireEvent.changeText(
      getByPlaceholderText('e.g. Dishwasher, Furnace, Roof'),
      'Security camera',
    );
    await fireEvent.press(getByText('Security'));
    await waitFor(() => expect(getByText('Kitchen')).toBeTruthy());
    await fireEvent.press(getByText('Kitchen'));
    await fireEvent.press(getByText('Add more details ▾'));
    await fireEvent.changeText(getByPlaceholderText('e.g. Bosch'), ' Ring ');
    await fireEvent.changeText(getByPlaceholderText('Model number'), ' SC-200 ');
    await fireEvent.changeText(getByPlaceholderText('Serial number'), ' SN-42 ');
    await fireEvent.changeText(
      getByPlaceholderText('Where it is, what to watch, warranty reminder...'),
      ' Front porch ',
    );
    await fireEvent.press(getByText('Save and continue'));

    await waitFor(() =>
      expect(createAsset).toHaveBeenCalledWith({
        propertyId: 'property-1',
        roomId: 'room-kitchen',
        name: 'Security camera',
        category: 'Security',
        brand: 'Ring',
        model: 'SC-200',
        serial: 'SN-42',
        notes: 'Front porch',
        status: 'ready',
      }),
    );
  });

  it('prevents duplicate submissions while saving', async () => {
    let resolveCreate: ((value: {
      id: string;
      propertyId: string;
      name: string;
      category: string;
      status: 'ready';
    }) => void) | null = null;
    const createAsset = jest.fn(
      () =>
        new Promise<{
          id: string;
          propertyId: string;
          name: string;
          category: string;
          status: 'ready';
        }>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    mockGetHomeVaultRepository.mockResolvedValue({
      getRooms: jest.fn().mockResolvedValue([]),
      createAsset,
      updateAsset: jest.fn().mockResolvedValue(undefined),
    } as never);
    const onSaved = jest.fn();
    const { getByPlaceholderText, getByLabelText, getByText } = await render(
      <FirstAssetScreen property={property} onSaved={onSaved} onBack={jest.fn()} />,
    );

    await fireEvent.changeText(getByPlaceholderText('e.g. Dishwasher, Furnace, Roof'), 'Dishwasher');
    await fireEvent.press(getByLabelText('Save and continue'));
    await fireEvent.press(getByLabelText('Save and continue'));

    expect(createAsset).toHaveBeenCalledTimes(1);

    await act(async () => {
      if (!resolveCreate) {
        throw new Error('createAsset promise did not start.');
      }

      resolveCreate({
        id: 'asset-1',
        propertyId: 'property-1',
        name: 'Dishwasher',
        category: 'Appliance',
        status: 'ready',
      });
      await Promise.resolve();
    });

    await waitFor(() => expect(getByLabelText('Finish to dashboard')).toBeTruthy());
    await fireEvent.press(getByText('Finish to dashboard'));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
  });

  it('offers an optional photo after the asset is saved', async () => {
    const updateAsset = jest.fn().mockResolvedValue(undefined);
    mockGetHomeVaultRepository.mockResolvedValue({
      getRooms: jest.fn().mockResolvedValue([]),
      createAsset: jest.fn().mockResolvedValue({
        id: 'asset-1',
        propertyId: 'property-1',
        name: 'Dishwasher',
        category: 'Appliance',
        status: 'ready',
      }),
      updateAsset,
    } as never);
    const onSaved = jest.fn();
    const { getByPlaceholderText, getByText } = await render(
      <FirstAssetScreen property={property} onSaved={onSaved} onBack={jest.fn()} />,
    );

    await fireEvent.changeText(getByPlaceholderText('e.g. Dishwasher, Furnace, Roof'), 'Dishwasher');
    await fireEvent.press(getByText('Save and continue'));
    await waitFor(() => expect(getByText('Your first item is saved')).toBeTruthy());

    await fireEvent.press(getByText('Choose asset photo'));
    await fireEvent.press(getByText('Save photo and finish'));

    await waitFor(() =>
      expect(updateAsset).toHaveBeenCalledWith({
        id: 'asset-1',
        propertyId: 'property-1',
        name: 'Dishwasher',
        category: 'Appliance',
        status: 'ready',
        photoUri: 'file:///selected-asset-photo.jpg',
      }),
    );
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('cleans up a selected onboarding photo when skipping it', async () => {
    mockGetHomeVaultRepository.mockResolvedValue({
      getRooms: jest.fn().mockResolvedValue([]),
      createAsset: jest.fn().mockResolvedValue({
        id: 'asset-1',
        propertyId: 'property-1',
        name: 'Dishwasher',
        category: 'Appliance',
        status: 'ready',
      }),
      updateAsset: jest.fn().mockResolvedValue(undefined),
    } as never);
    const onSaved = jest.fn();
    const { getByPlaceholderText, getByText } = await render(
      <FirstAssetScreen property={property} onSaved={onSaved} onBack={jest.fn()} />,
    );

    await fireEvent.changeText(getByPlaceholderText('e.g. Dishwasher, Furnace, Roof'), 'Dishwasher');
    await fireEvent.press(getByText('Save and continue'));
    await waitFor(() => expect(getByText('Your first item is saved')).toBeTruthy());

    await fireEvent.press(getByText('Choose asset photo'));
    await fireEvent.press(getByText('Skip photo for now'));

    expect(mockDeleteAppOwnedPhoto).toHaveBeenCalledWith('file:///selected-asset-photo.jpg');
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('calls onBack when back is pressed', async () => {
    const onBack = jest.fn();
    const { getByText } = await render(
      <FirstAssetScreen property={property} onSaved={jest.fn()} onBack={onBack} />,
    );

    await fireEvent.press(getByText('← Back'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
