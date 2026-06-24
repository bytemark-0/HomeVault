import { fireEvent, render } from '@testing-library/react-native';

import { InventoryScreen } from '../../screens/InventoryScreen';

describe('InventoryScreen', () => {
  it('shows the no-assets empty state and calls add asset', async () => {
    const onAddAsset = jest.fn();
    const { getAllByText, getByText } = await render(
      <InventoryScreen assets={[]} onAddAsset={onAddAsset} onAssetPress={jest.fn()} />,
    );

    expect(getByText('Start with one asset')).toBeTruthy();
    await fireEvent.press(getAllByText('Add asset')[1]!);
    expect(onAddAsset).toHaveBeenCalledTimes(1);
  });
});
