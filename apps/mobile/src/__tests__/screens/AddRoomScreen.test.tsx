import { fireEvent, render, waitFor } from '@testing-library/react-native';

import type { RoomArea } from '@homevault/domain';
import { AddRoomScreen } from '../../screens/AddRoomScreen';

jest.mock('../../components/PhotoPickerField', () => ({
  PhotoPickerField: () => null,
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
});
