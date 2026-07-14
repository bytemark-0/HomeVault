import { fireEvent, render, waitFor } from '@testing-library/react-native';

import type { ImportantAccount } from '@homevault/domain';

import { AddImportantAccountScreen } from '../../screens/AddImportantAccountScreen';

describe('AddImportantAccountScreen', () => {
  const existingAccount: ImportantAccount = {
    id: 'account-1',
    propertyId: 'property-1',
    kind: 'insurance',
    providerName: 'Prairie Mutual',
    label: 'Home policy',
    accountNumber: 'POL-883492',
    managerRole: 'self',
    backupHelperName: 'Taylor',
    isSharedHouseholdAccount: false,
    mfaEnabled: true,
    recoveryCodesStored: true,
    managedInPasswordManager: false,
    recoveryNotes: 'Codes are in the family safe.',
    linkedDocumentIds: ['document-1'],
  };

  const documents = [
    {
      id: 'document-1',
      propertyId: 'property-1',
      title: 'Home policy PDF',
      type: 'insurance' as const,
      typeLabel: 'Insurance',
      linkedToLabel: 'Property',
      dateLabel: 'Jul 1, 2026',
      linkedRecords: [],
      linkedRecordIds: ['property-1'],
    },
  ];

  it('saves a new important account without any password field', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getAllByText, getByLabelText, getByText, queryByLabelText } = await render(
      <AddImportantAccountScreen
        propertyId="property-1"
        documents={documents}
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    expect(getByText(/tracks recovery readiness, not passwords/i)).toBeTruthy();
    expect(queryByLabelText('Password')).toBeNull();

    await fireEvent.changeText(getByLabelText('Provider name'), ' FiberCo ');
    await fireEvent.changeText(getByLabelText('Account label'), ' Internet service ');
    await fireEvent.changeText(getByLabelText('Website (optional)'), 'portal.fiberco.test');
    await fireEvent.press(getByText('You'));
    await fireEvent.changeText(getByLabelText('Backup helper (optional)'), ' Taylor ');
    await fireEvent.press(getAllByText('No')[0]!);
    await fireEvent.press(getAllByText('Yes')[1]!);
    await fireEvent.press(getAllByText('No')[2]!);
    await fireEvent.press(getAllByText('Yes')[3]!);
    await fireEvent.changeText(
      getByLabelText('Recovery notes'),
      'Recovery emails go to the family inbox.',
    );
    await fireEvent.press(getByText('Home policy PDF'));
    await fireEvent.press(getByText('Save account'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        id: undefined,
        propertyId: 'property-1',
        kind: 'insurance',
        providerName: 'FiberCo',
        label: 'Internet service',
        accountNumber: undefined,
        website: 'portal.fiberco.test',
        phone: undefined,
        email: undefined,
        managerRole: 'self',
        backupHelperName: 'Taylor',
        isSharedHouseholdAccount: false,
        mfaEnabled: true,
        recoveryCodesStored: false,
        managedInPasswordManager: true,
        recoveryNotes: 'Recovery emails go to the family inbox.',
        notes: undefined,
        linkedDocumentIds: ['document-1'],
      }),
    );
  });

  it('saves edits to an existing account', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getByLabelText, getByText } = await render(
      <AddImportantAccountScreen
        propertyId="property-1"
        documents={documents}
        account={existingAccount}
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    await fireEvent.changeText(getByLabelText('Provider name'), ' Prairie Mutual Claims ');
    await fireEvent.press(getByText('Save changes'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        ...existingAccount,
        providerName: 'Prairie Mutual Claims',
      }),
    );
  });
});
