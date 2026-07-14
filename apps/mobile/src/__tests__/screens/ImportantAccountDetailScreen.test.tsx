import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { ImportantAccountDetailScreen } from '../../screens/ImportantAccountDetailScreen';

describe('ImportantAccountDetailScreen', () => {
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

  it('shows recovery metadata and linked documents without implying password storage', async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const { getAllByText, getByText, queryByText } = await render(
      <ImportantAccountDetailScreen
        account={{
          id: 'account-1',
          propertyId: 'property-1',
          kind: 'banking',
          providerName: 'River Bank',
          label: 'Primary bank login',
          accountNumber: 'CHK-1024',
          website: 'https://bank.example.com',
          managerRole: 'shared_household',
          backupHelperName: 'Taylor Reed',
          isSharedHouseholdAccount: true,
          mfaEnabled: true,
          recoveryCodesStored: false,
          managedInPasswordManager: true,
          recoveryNotes: 'Recovery contact is up to date.',
          linkedDocumentIds: ['document-1'],
          lastReviewedAt: '2026-01-01',
        }}
        linkedDocuments={[
          {
            id: 'document-1',
            propertyId: 'property-1',
            title: 'Banking recovery checklist',
            type: 'emergency',
            typeLabel: 'Emergency',
            linkedToLabel: 'Primary bank login',
            dateLabel: 'Jul 1, 2026',
            linkedRecords: [],
            linkedRecordIds: ['account-1'],
          },
        ]}
        onBack={jest.fn()}
        onDelete={onDelete}
        onEdit={jest.fn()}
        onShare={jest.fn()}
        onLinkedDocumentPress={jest.fn()}
      />,
    );

    expect(getByText('Passwords stay out of HomeVault')).toBeTruthy();
    expect(getAllByText('High sensitivity').length).toBeGreaterThan(0);
    expect(
      getByText(
        'Recovery notes can help someone regain access quickly and should be protected like a high-risk handoff detail.',
      ),
    ).toBeTruthy();
    expect(getByText('Recovery notes stay hidden by default')).toBeTruthy();
    expect(getByText('Shared household')).toBeTruthy();
    expect(getByText('Taylor Reed')).toBeTruthy();
    expect(getByText('Shared household account')).toBeTruthy();
    expect(queryByText('Recovery contact is up to date.')).toBeNull();
    expect(queryByText('Password')).toBeNull();
    expect(getAllByText('Yes').length).toBeGreaterThan(0);
    expect(getAllByText('No').length).toBeGreaterThan(0);
    expect(getByText('Banking recovery checklist')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('Reveal recovery notes'));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Reveal sensitive recovery notes?',
      'Recovery notes can help someone regain account access quickly. If device authentication is unavailable in this preview, confirm locally before revealing them on this device.',
      expect.any(Array),
    );
    await waitFor(() => expect(getByText('Recovery contact is up to date.')).toBeTruthy());

    await fireEvent.press(getByText('Delete'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete account?',
      '"Primary bank login" will be removed from this local HomeVault preview.',
      expect.any(Array),
    );
  });

  it('shows a share action for encrypted account bundles', async () => {
    const onShare = jest.fn();
    const onMarkReviewed = jest.fn();
    const { getByText } = await render(
      <ImportantAccountDetailScreen
        account={{
          id: 'account-1',
          propertyId: 'property-1',
          kind: 'insurance',
          providerName: 'Prairie Mutual',
          label: 'Home policy',
          managerRole: 'self',
          isSharedHouseholdAccount: false,
          linkedDocumentIds: [],
        }}
        linkedDocuments={[]}
        onBack={jest.fn()}
        onDelete={jest.fn().mockResolvedValue(undefined)}
        onEdit={jest.fn()}
        onMarkReviewed={onMarkReviewed}
        onShare={onShare}
        reviewStatusLabel="Reviewed 5 days ago."
      />,
    );

    fireEvent.press(getByText('Review'));
    expect(onMarkReviewed).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Share'));

    expect(onShare).toHaveBeenCalledTimes(1);
    expect(getByText('Reviewed 5 days ago.')).toBeTruthy();
  });
});
