import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { AddRepairEventScreen } from '../../screens/AddRepairEventScreen';
import type { AssetListItem } from '../../data/homeVaultSampleData';

describe('AddRepairEventScreen', () => {
  const assets: AssetListItem[] = [
    {
      id: 'asset-hvac',
      propertyId: 'property-1',
      roomId: 'room-utility',
      name: 'Main HVAC',
      category: 'Heating & cooling',
      status: 'ready',
      roomName: 'Utility',
      documentCount: 1,
      lastServiceLabel: 'Apr 18, 2026',
      nextTaskLabel: 'Replace filter',
      warrantyExpiringSoon: false,
    },
  ];

  it('requires an issue before saving', async () => {
    const onSave = jest.fn();
    const { getByText } = await render(
      <AddRepairEventScreen
        assets={assets}
        propertyId="property-1"
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    await fireEvent.press(getByText('Main HVAC'));
    await fireEvent.press(getByText('Save repair'));

    expect(getByText('Issue is required.')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves a repair for the selected asset', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getByPlaceholderText, getByText } = await render(
      <AddRepairEventScreen
        assets={assets}
        propertyId="property-1"
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    await fireEvent.press(getByText('Main HVAC'));
    await fireEvent.changeText(getByPlaceholderText('Leak, error code, weak airflow'), '  Weak airflow ');
    await fireEvent.changeText(getByPlaceholderText('Contractor, shop, or self'), ' Local HVAC ');
    await fireEvent.changeText(getByPlaceholderText('249.00'), '249');
    await fireEvent.changeText(getByPlaceholderText('2026-06-12'), '2026-06-12');
    await fireEvent.press(getByText('Save repair'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        propertyId: 'property-1',
        assetId: 'asset-hvac',
        issue: 'Weak airflow',
        provider: 'Local HVAC',
        diagnosis: undefined,
        resolution: undefined,
        costCents: 24900,
        date: '2026-06-12',
        documentIds: [],
      }),
    );
  });
});
