import { fireEvent, render } from '@testing-library/react-native';

import { InventoryScreen } from '../../screens/InventoryScreen';

describe('InventoryScreen', () => {
  it('shows the device empty state and calls add asset', async () => {
    const onAddAsset = jest.fn();
    const { getAllByText, getByText } = await render(
      <InventoryScreen
        assets={[]}
        mode="device"
        onAddAsset={onAddAsset}
        onAssetPress={jest.fn()}
      />,
    );

    expect(getByText('Start with one essential device')).toBeTruthy();
    const addDeviceButtons = getAllByText('Add device');
    const emptyStateButton = addDeviceButtons[1];
    if (!emptyStateButton) {
      throw new Error('Expected the empty-state Add device button to render.');
    }
    await fireEvent.press(emptyStateButton);
    expect(onAddAsset).toHaveBeenCalledTimes(1);
  });

  it('shows asset language in inventory mode', async () => {
    const { getAllByText, getByText } = await render(
      <InventoryScreen assets={[]} onAddAsset={jest.fn()} onAssetPress={jest.fn()} />,
    );

    expect(getAllByText('Add asset').length).toBeGreaterThan(0);
    expect(getByText('Start with one essential device or system')).toBeTruthy();
  });
});
