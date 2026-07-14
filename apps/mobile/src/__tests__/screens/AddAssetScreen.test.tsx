import { fireEvent, render, waitFor } from '@testing-library/react-native';

import type { Asset, RoomArea } from '@homevault/domain';

import { AddAssetScreen } from '../../screens/AddAssetScreen';
import { deleteAppOwnedPhoto } from '../../utils/photoStorage';

jest.mock('expo-camera', () => ({
  CameraView: () => null,
  useCameraPermissions: () => [{ granted: false }, jest.fn()],
}));

jest.mock('../../components/PhotoPickerField', () => ({
  PhotoPickerField: ({ onChange }: { onChange: (photoUri: string) => void }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <Pressable accessibilityRole="button" onPress={() => onChange('file:///selected-asset-photo.jpg')}>
        <Text>Choose photo</Text>
      </Pressable>
    );
  },
}));

jest.mock('../../utils/photoStorage', () => ({
  deleteAppOwnedPhoto: jest.fn(),
}));

describe('AddAssetScreen', () => {
  const rooms: RoomArea[] = [
    { id: 'room-kitchen', propertyId: 'property-1', name: 'Kitchen', type: 'room' },
    { id: 'room-garage', propertyId: 'property-1', name: 'Garage', type: 'area' },
  ];

  const existingAsset: Asset = {
    id: 'asset-dishwasher',
    propertyId: 'property-1',
    roomId: 'room-kitchen',
    name: 'Dishwasher',
    category: 'Appliance',
    brand: 'Bosch',
    model: 'SHX',
    serial: 'SER-1',
    installDate: '2021-03-18',
    purchaseDate: '2021-03-10',
    warrantyExpiry: '2026-08-01',
    photoUri: 'file:///dishwasher.jpg',
    costCents: 89900,
    status: 'warranty_soon',
    notes: 'Existing note',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires an asset name before saving', async () => {
    const onSave = jest.fn();
    const { getByText } = await render(
      <AddAssetScreen
        propertyId="property-1"
        rooms={rooms}
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    await fireEvent.press(getByText('Save asset'));

    expect(getByText('Name is required.')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves a new asset with the selected room and photo', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getByLabelText, getByText } = await render(
      <AddAssetScreen
        propertyId="property-1"
        rooms={rooms}
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    await fireEvent.changeText(getByLabelText('Name'), '  Utility sink  ');
    await fireEvent.press(getByText('Garage'));
    await fireEvent.press(getByText(/More details/));
    await fireEvent.press(getByText('Choose photo'));
    await fireEvent.changeText(getByLabelText('Brand (optional)'), '  Elkay ');
    await fireEvent.changeText(getByLabelText('Purchase cost (optional)'), '199.95');
    await fireEvent.press(getByText('Save asset'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        id: undefined,
        propertyId: 'property-1',
        roomId: 'room-garage',
        name: 'Utility sink',
        category: 'Appliance',
        ownerName: undefined,
        backupHelperName: undefined,
        brand: 'Elkay',
        model: undefined,
        serial: undefined,
        installDate: undefined,
        purchaseDate: undefined,
        costCents: 19995,
        status: 'ready',
        warrantyExpiry: undefined,
        backupEnabled: undefined,
        screenLockEnabled: undefined,
        findMyDeviceEnabled: undefined,
        networkName: undefined,
        internetProvider: undefined,
        networkAdminUrl: undefined,
        photoUri: 'file:///selected-asset-photo.jpg',
        notes: undefined,
      }),
    );
  });

  it('saves edited asset fields with the existing asset id', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getByLabelText, getByText } = await render(
      <AddAssetScreen
        propertyId="property-1"
        rooms={rooms}
        asset={existingAsset}
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    await fireEvent.changeText(getByLabelText('Name'), ' Dishwasher upstairs ');
    await fireEvent.press(getByText('Garage'));
    await fireEvent.changeText(getByLabelText('Brand (optional)'), ' Bosch Premium ');
    await fireEvent.changeText(getByLabelText('Purchase cost (optional)'), '999');
    await fireEvent.press(getByText('Save changes'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        id: 'asset-dishwasher',
        propertyId: 'property-1',
        roomId: 'room-garage',
        name: 'Dishwasher upstairs',
        category: 'Appliance',
        ownerName: undefined,
        backupHelperName: undefined,
        brand: 'Bosch Premium',
        model: 'SHX',
        serial: 'SER-1',
        installDate: '2021-03-18',
        purchaseDate: '2021-03-10',
        costCents: 99900,
        status: 'warranty_soon',
        warrantyExpiry: '2026-08-01',
        backupEnabled: undefined,
        screenLockEnabled: undefined,
        findMyDeviceEnabled: undefined,
        networkName: undefined,
        internetProvider: undefined,
        networkAdminUrl: undefined,
        photoUri: 'file:///dishwasher.jpg',
        notes: 'Existing note',
      }),
    );
  });

  it('saves a device with recovery metadata and router details', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getAllByText, getByLabelText, getByText } = await render(
      <AddAssetScreen
        propertyId="property-1"
        rooms={rooms}
        mode="device"
        deviceTemplate="router"
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    await fireEvent.changeText(getByLabelText('Name'), ' Main Wi-Fi router ');
    await fireEvent.changeText(getByLabelText('Owner (optional)'), ' Household ');
    await fireEvent.changeText(getByLabelText('Backup helper (optional)'), ' Taylor ');
    await fireEvent.press(getAllByText('Yes')[0]!);
    await fireEvent.press(getAllByText('No')[1]!);
    await fireEvent.press(getAllByText('Not sure')[2]!);
    await fireEvent.changeText(getByLabelText('Network name (optional)'), 'OakStreet-5G');
    await fireEvent.changeText(getByLabelText('Internet provider (optional)'), 'FiberCo');
    await fireEvent.changeText(getByLabelText('Admin address (optional)'), 'http://192.168.1.1');
    await fireEvent.press(getByText('Save device'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        id: undefined,
        propertyId: 'property-1',
        roomId: 'room-kitchen',
        name: 'Main Wi-Fi router',
        category: 'Router',
        ownerName: 'Household',
        backupHelperName: 'Taylor',
        brand: undefined,
        model: undefined,
        serial: undefined,
        installDate: undefined,
        purchaseDate: undefined,
        costCents: undefined,
        status: 'ready',
        warrantyExpiry: undefined,
        backupEnabled: true,
        screenLockEnabled: false,
        findMyDeviceEnabled: undefined,
        networkName: 'OakStreet-5G',
        internetProvider: 'FiberCo',
        networkAdminUrl: 'http://192.168.1.1',
        photoUri: undefined,
        notes: undefined,
      }),
    );
  });

  it('cleans up a newly selected photo when canceling', async () => {
    const onCancel = jest.fn();
    const { getByText } = await render(
      <AddAssetScreen
        propertyId="property-1"
        rooms={rooms}
        onCancel={onCancel}
        onSave={jest.fn()}
      />,
    );

    await fireEvent.press(getByText(/More details/));
    await fireEvent.press(getByText('Choose photo'));
    await fireEvent.press(getByText('Cancel'));

    expect(deleteAppOwnedPhoto).toHaveBeenCalledWith('file:///selected-asset-photo.jpg');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
