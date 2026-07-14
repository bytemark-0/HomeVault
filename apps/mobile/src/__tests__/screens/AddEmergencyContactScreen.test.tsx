import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { AddEmergencyContactScreen } from '../../screens/AddEmergencyContactScreen';

describe('AddEmergencyContactScreen', () => {
  it('saves ownership and backup helper fields for responsibility contacts', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getByLabelText, getByText } = await render(
      <AddEmergencyContactScreen
        propertyId="property-1"
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    await fireEvent.changeText(getByLabelText('Contact name'), ' Maple Kids Daycare ');
    await fireEvent.changeText(getByLabelText('Relationship or provider'), ' School pickup office ');
    await fireEvent.press(getByText('School / daycare'));
    await fireEvent.press(getByText('Partner'));
    await fireEvent.changeText(getByLabelText('Backup helper (optional)'), ' Jamie ');
    await fireEvent.changeText(getByLabelText('Phone'), ' 555-0144 ');
    await fireEvent.press(getByText('Save contact'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        id: undefined,
        propertyId: 'property-1',
        priority: 'primary',
        name: 'Maple Kids Daycare',
        role: 'School pickup office',
        responsibilityCategory: 'school',
        ownerRole: 'partner',
        backupHelperName: 'Jamie',
        phone: '555-0144',
        email: undefined,
        address: undefined,
        notes: undefined,
      }),
    );
  });
});
