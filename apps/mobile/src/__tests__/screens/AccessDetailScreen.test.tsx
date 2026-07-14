import { fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { AccessDetailScreen } from '../../screens/AccessDetailScreen';

describe('AccessDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      if (Array.isArray(buttons)) {
        const confirm = buttons[1];
        if (confirm && 'onPress' in confirm && typeof confirm.onPress === 'function') {
          confirm.onPress();
        }
      }
    });
  });

  it('hides sensitive values until the user reveals them', async () => {
    const { getAllByText, getByText, queryByText } = await render(
      <AccessDetailScreen
        accessItem={{
          id: 'access-1',
          propertyId: 'property-1',
          category: 'wifi',
          label: 'Main Wi-Fi',
          username: 'OakStreet-5G',
          accessCode: '9274',
          location: 'Hall closet top shelf',
          instructions: 'Restart only if both lights are red.',
          notes: 'Guest network is on a separate SSID.',
          linkedDocumentIds: [],
        }}
        linkedDocuments={[]}
        onBack={jest.fn()}
        onDelete={jest.fn().mockResolvedValue(undefined)}
        onEdit={jest.fn()}
        onShare={jest.fn()}
      />,
    );

    expect(getByText('Sensitive details are hidden by default')).toBeTruthy();
    expect(getAllByText('High sensitivity').length).toBeGreaterThan(0);
    expect(
      getByText(
        'Codes, entry details, or network access in this record should require step-up protection before reveal or share.',
      ),
    ).toBeTruthy();
    expect(getAllByText('Hidden until revealed').length).toBeGreaterThan(0);
    expect(queryByText('9274')).toBeNull();
    expect(queryByText('Hall closet top shelf')).toBeNull();

    await fireEvent.press(getByText('Reveal details'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Reveal sensitive access details?',
      'Codes, locations, and entry details should only be revealed when you are ready to use them. If device authentication is unavailable in this preview, confirm locally before showing them on this device.',
      expect.any(Array),
    );
    expect(getByText('9274')).toBeTruthy();
    expect(getByText('Hall closet top shelf')).toBeTruthy();
    expect(getByText('Restart only if both lights are red.')).toBeTruthy();

    await fireEvent.press(getByText('Hide details'));

    expect(queryByText('9274')).toBeNull();
    expect(queryByText('Hall closet top shelf')).toBeNull();
  });

  it('shows a share action for encrypted item bundles', async () => {
    const onShare = jest.fn();
    const onMarkReviewed = jest.fn();
    const { getByText } = await render(
      <AccessDetailScreen
        accessItem={{
          id: 'access-1',
          propertyId: 'property-1',
          category: 'wifi',
          label: 'Main Wi-Fi',
          linkedDocumentIds: [],
        }}
        linkedDocuments={[]}
        onBack={jest.fn()}
        onDelete={jest.fn().mockResolvedValue(undefined)}
        onEdit={jest.fn()}
        onMarkReviewed={onMarkReviewed}
        onShare={onShare}
        reviewStatusLabel="Reviewed 3 days ago."
      />,
    );

    fireEvent.press(getByText('Review'));
    expect(onMarkReviewed).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Share'));

    expect(onShare).toHaveBeenCalledTimes(1);
    expect(getByText('Reviewed 3 days ago.')).toBeTruthy();
  });
});
