import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { EmergencyContactDetailScreen } from '../../screens/EmergencyContactDetailScreen';

describe('EmergencyContactDetailScreen', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((message?: unknown) => {
      if (
        typeof message === 'string' &&
        message.includes('overlapping act() calls')
      ) {
        return;
      }
    });
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      if (Array.isArray(buttons)) {
        const confirm = buttons[1];
        if (confirm && 'onPress' in confirm && typeof confirm.onPress === 'function') {
          confirm.onPress();
        }
      }
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('shows share and delete actions for a contact handoff', async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const onShare = jest.fn();
    const onMarkReviewed = jest.fn();
    const { getByText } = await render(
      <EmergencyContactDetailScreen
        contact={{
          id: 'contact-1',
          propertyId: 'property-1',
          name: 'Jamie Lee',
          role: 'Neighbor',
          priority: 'primary',
          responsibilityCategory: 'school',
          ownerRole: 'partner',
          backupHelperName: 'Dana Smith',
          phone: '555-0101',
          notes: 'Has a spare key.',
        }}
        onBack={jest.fn()}
        onDelete={onDelete}
        onEdit={jest.fn()}
        onMarkReviewed={onMarkReviewed}
        onShare={onShare}
        reviewStatusLabel="Needs review."
      />,
    );

    fireEvent.press(getByText('Review'));
    expect(onMarkReviewed).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Share'));
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(getByText('Needs review.')).toBeTruthy();
    expect(getByText('School / daycare')).toBeTruthy();
    expect(getByText('Partner or spouse')).toBeTruthy();
    expect(getByText('Dana Smith')).toBeTruthy();

    fireEvent.press(getByText('Delete'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete emergency contact?',
      '"Jamie Lee" will be removed from this local HomeVault preview.',
      expect.any(Array),
    );
  });
});
