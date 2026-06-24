import { fireEvent, render, waitFor } from '@testing-library/react-native';

import type { RoomArea } from '@homevault/domain';
import { AddRoomScreen } from '../../screens/AddRoomScreen';
import { deleteAppOwnedPhoto } from '../../utils/photoStorage';

jest.mock('../../components/PhotoPickerField', () => ({
  PhotoPickerField: ({ onChange }: { onChange: (photoUri: string) => void }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <Pressable accessibilityRole="button" onPress={() => onChange('file:///selected-room-photo.jpg')}>
        <Text>Choose photo</Text>
      </Pressable>
    );
  },
}));

jest.mock('../../utils/photoStorage', () => ({
  deleteAppOwnedPhoto: jest.fn(),
}));

describe('AddRoomScreen', () => {
  const existingRoom: RoomArea = {
    id: 'room-kitchen',
    propertyId: 'property-1',
    name: 'Kitchen',
    type: 'room',
    floor: 'Main',
    photoUri: 'file:///kitchen.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires a room name before saving', async () => {
    const onSave = jest.fn();
    const { getByText } = await render(
      <AddRoomScreen propertyId="property-1" onCancel={jest.fn()} onSave={onSave} />,
    );

    await fireEvent.press(getByText('Save area'));

    expect(getByText('Name is required.')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows an actionable error and allows retrying after a failed create', async () => {
    const onSave = jest
      .fn()
      .mockRejectedValueOnce(new Error('write failed'))
      .mockResolvedValueOnce(undefined);
    const { getByLabelText, getByText } = await render(
      <AddRoomScreen propertyId="property-1" onCancel={jest.fn()} onSave={onSave} />,
    );

    await fireEvent.changeText(getByLabelText('Name'), '  Kitchen  ');
    await fireEvent.press(getByText('Save area'));

    await waitFor(() =>
      expect(
        getByText(
          'Could not save this area. Your details are still here. Check storage permissions and try again.',
        ),
      ).toBeTruthy(),
    );

    expect(getByLabelText('Name').props.value).toBe('  Kitchen  ');

    await fireEvent.press(getByText('Save area'));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    expect(onSave).toHaveBeenLastCalledWith({
      id: undefined,
      propertyId: 'property-1',
      name: 'Kitchen',
      type: 'room',
      floor: undefined,
      photoUri: undefined,
    });
  });

  it('includes a selected photo when saving a new room', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getByLabelText, getByText } = await render(
      <AddRoomScreen propertyId="property-1" onCancel={jest.fn()} onSave={onSave} />,
    );

    await fireEvent.press(getByText('Choose photo'));
    await fireEvent.changeText(getByLabelText('Name'), 'Kitchen');
    await fireEvent.press(getByText('Save area'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        id: undefined,
        propertyId: 'property-1',
        name: 'Kitchen',
        type: 'room',
        floor: undefined,
        photoUri: 'file:///selected-room-photo.jpg',
      }),
    );
  });

  it('saves edited room fields with the existing room id', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getByLabelText, getByText } = await render(
      <AddRoomScreen
        propertyId="property-1"
        room={existingRoom}
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    await fireEvent.changeText(getByLabelText('Name'), 'Kitchen and dining');
    await fireEvent.changeText(getByLabelText('Floor (optional)'), 'Main level');
    await fireEvent.press(getByText('Area'));
    await fireEvent.press(getByText('Save changes'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        id: 'room-kitchen',
        propertyId: 'property-1',
        name: 'Kitchen and dining',
        type: 'area',
        floor: 'Main level',
        photoUri: 'file:///kitchen.jpg',
      }),
    );
  });

  it('cleans up a newly selected photo when canceling', async () => {
    const onCancel = jest.fn();
    const { getByText } = await render(
      <AddRoomScreen propertyId="property-1" onCancel={onCancel} onSave={jest.fn()} />,
    );

    await fireEvent.press(getByText('Choose photo'));
    await fireEvent.press(getByText('Cancel'));

    expect(deleteAppOwnedPhoto).toHaveBeenCalledWith('file:///selected-room-photo.jpg');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
