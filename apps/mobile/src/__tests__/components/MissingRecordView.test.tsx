import { fireEvent, render } from '@testing-library/react-native';

import { MissingRecordView } from '../../components/MissingRecordView';

describe('MissingRecordView', () => {
  it('shows recovery copy and action', async () => {
    const onActionPress = jest.fn();
    const { getByText } = await render(
      <MissingRecordView
        title="Room not found"
        detail="This room may have been deleted."
        actionLabel="Back to Household"
        onActionPress={onActionPress}
      />,
    );

    expect(getByText('Record unavailable')).toBeTruthy();
    expect(getByText('Room not found')).toBeTruthy();
    expect(getByText('This room may have been deleted.')).toBeTruthy();

    await fireEvent.press(getByText('Back to Household'));

    expect(onActionPress).toHaveBeenCalledTimes(1);
  });
});
