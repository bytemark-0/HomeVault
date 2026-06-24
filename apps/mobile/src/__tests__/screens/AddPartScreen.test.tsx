import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { AddPartScreen } from '../../screens/AddPartScreen';
import type { PartSupply } from '@homevault/domain';

describe('AddPartScreen', () => {
  const existingPart: PartSupply = {
    id: 'part-1',
    propertyId: 'property-1',
    assetId: 'asset-hvac',
    name: 'Filter',
    partNumber: 'F-100',
    size: '20x25x1',
    quantity: 2,
    link: 'example.com/filter',
  };

  it('requires a part name before saving', async () => {
    const onSave = jest.fn();
    const { getByText } = await render(
      <AddPartScreen
        propertyId="property-1"
        assetId="asset-hvac"
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    await fireEvent.press(getByText('Save'));

    expect(getByText('Part name is required.')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves a new part payload', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getByPlaceholderText, getByText } = await render(
      <AddPartScreen
        propertyId="property-1"
        assetId="asset-hvac"
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    await fireEvent.changeText(getByPlaceholderText(/HVAC filter/i), '  Carbon filter ');
    await fireEvent.changeText(getByPlaceholderText(/DA29-00020B/i), ' CF-200 ');
    await fireEvent.changeText(getByPlaceholderText(/20x25x1/i), ' 16x20x1 ');
    await fireEvent.changeText(getByPlaceholderText(/e.g. 3/i), '4');
    await fireEvent.changeText(getByPlaceholderText(/https:\/\/amazon.com/i), 'shop.example/filter');
    await fireEvent.press(getByText('Save'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        propertyId: 'property-1',
        assetId: 'asset-hvac',
        name: 'Carbon filter',
        partNumber: 'CF-200',
        size: '16x20x1',
        quantity: 4,
        link: 'shop.example/filter',
      }),
    );
  });

  it('saves edits with the existing part id', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getByDisplayValue, getByText } = await render(
      <AddPartScreen
        propertyId="property-1"
        assetId="asset-hvac"
        part={existingPart}
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    await fireEvent.changeText(getByDisplayValue('Filter'), 'Premium filter');
    await fireEvent.press(getByText('Save'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        id: 'part-1',
        propertyId: 'property-1',
        assetId: 'asset-hvac',
        name: 'Premium filter',
        partNumber: 'F-100',
        size: '20x25x1',
        quantity: 2,
        link: 'example.com/filter',
      }),
    );
  });
});
