import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { AccessScreen } from '../../screens/AccessScreen';

describe('AccessScreen', () => {
  it('shows the empty state and quick actions when no access records exist', async () => {
    const onAddAccess = jest.fn();
    const { getAllByText, getByText } = await render(
      <AccessScreen
        accessItems={[]}
        assets={[]}
        documents={[]}
        onAddAccess={onAddAccess}
        onAccessItemPress={jest.fn()}
        onViewDevices={jest.fn()}
        onViewDocuments={jest.fn()}
      />,
    );

    expect(getByText('Save the first access record')).toBeTruthy();
    await fireEvent.press(getAllByText('Save Wi-Fi')[1]);
    await fireEvent.press(getByText('Add alarm code'));

    expect(onAddAccess).toHaveBeenNthCalledWith(1, 'wifi');
    expect(onAddAccess).toHaveBeenNthCalledWith(2, 'alarm');
  });

  it('filters and opens access records from the dedicated access area', async () => {
    const onAccessItemPress = jest.fn();
    const { findByPlaceholderText, getByText, queryByText } = await render(
      <AccessScreen
        accessItems={[
          {
            id: 'access-wifi',
            propertyId: 'property-1',
            category: 'wifi',
            label: 'Main Wi-Fi',
            username: 'OakStreet-5G',
            accessCode: '9274',
            linkedDocumentIds: [],
          },
          {
            id: 'access-garage',
            propertyId: 'property-1',
            category: 'garage',
            label: 'Garage keypad',
            accessCode: '1942',
            linkedDocumentIds: [],
          },
        ]}
        assets={[]}
        documents={[]}
        onAddAccess={jest.fn()}
        onAccessItemPress={onAccessItemPress}
        onViewDevices={jest.fn()}
        onViewDocuments={jest.fn()}
      />,
    );

    await fireEvent.changeText(
      await findByPlaceholderText('Search labels, codes, locations, or notes'),
      'garage',
    );

    await waitFor(() => {
      expect(getByText('Garage keypad')).toBeTruthy();
      expect(queryByText('Main Wi-Fi')).toBeNull();
    });

    expect(queryByText('9274')).toBeNull();
    expect(getByText('Sensitive details hidden until opened')).toBeTruthy();

    await fireEvent.press(getByText('Garage keypad'));
    expect(onAccessItemPress).toHaveBeenCalledWith('access-garage');
  });
});
