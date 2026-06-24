import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { AddDocumentScreen } from '../../screens/AddDocumentScreen';
import type { AssetListItem } from '../../data/homeVaultSampleData';
import type { RoomArea } from '@homevault/domain';

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///documents/',
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('AddDocumentScreen', () => {
  const DocumentPicker = require('expo-document-picker');

  const assets: AssetListItem[] = [
    {
      id: 'asset-dishwasher',
      propertyId: 'property-1',
      roomId: 'room-kitchen',
      name: 'Dishwasher',
      category: 'Appliance',
      status: 'ready',
      roomName: 'Kitchen',
      documentCount: 0,
      lastServiceLabel: 'Not serviced',
      nextTaskLabel: 'No open tasks',
      warrantyExpiringSoon: false,
    },
  ];

  const rooms: RoomArea[] = [
    { id: 'room-kitchen', propertyId: 'property-1', name: 'Kitchen', type: 'room' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires a document title before saving', async () => {
    const onSave = jest.fn();
    const { getByText } = await render(
      <AddDocumentScreen
        propertyId="property-1"
        assets={assets}
        rooms={rooms}
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    await fireEvent.press(getByText('Save document'));

    expect(getByText('Title is required.')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves a picked attachment with linked asset and room ids', async () => {
    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          name: 'dishwasher-manual.pdf',
          uri: 'file:///tmp/dishwasher-manual.pdf',
          mimeType: 'application/pdf',
          size: 2048,
        },
      ],
    });

    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getByLabelText, getByText } = await render(
      <AddDocumentScreen
        propertyId="property-1"
        assets={assets}
        rooms={rooms}
        initialLinkedRecordId="asset-dishwasher"
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    await fireEvent.press(getByText('Choose file'));
    expect(
      getByText(
        "HomeVault will open your device's file picker so you can choose a PDF, photo, or document copy. The selected file stays local to this device, and you can still save this record without an attachment.",
      ),
    ).toBeTruthy();
    await fireEvent.press(getByText('Continue'));
    await fireEvent.changeText(getByLabelText('Vendor'), ' Bosch ');
    await fireEvent.changeText(getByLabelText('Amount'), '129.99');
    await fireEvent.press(getByText('Kitchen'));
    await fireEvent.press(getByText('Save document'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: undefined,
          propertyId: 'property-1',
          title: 'dishwasher manual',
          type: 'receipt',
          vendor: 'Bosch',
          amountCents: 12999,
          linkedRecordIds: ['asset-dishwasher', 'room-kitchen'],
          attachment: expect.objectContaining({
            storageKind: 'app_copy',
            fileName: 'dishwasher-manual.pdf',
            mimeType: 'application/pdf',
          }),
        }),
      ),
    );
  });

  it('can link a document to the property, a room, and an asset in one save', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getByLabelText, getByText } = await render(
      <AddDocumentScreen
        propertyId="property-1"
        assets={assets}
        rooms={rooms}
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    await fireEvent.changeText(getByLabelText('Title'), 'Main warranty packet');
    await fireEvent.press(getByText('Property'));
    await fireEvent.press(getByText('Kitchen'));
    await fireEvent.press(getByText('Save document'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Main warranty packet',
          linkedRecordIds: expect.arrayContaining(['property-1', 'room-kitchen', 'asset-dishwasher']),
        }),
      ),
    );
  });

  it('shows next-step guidance when file import fails', async () => {
    DocumentPicker.getDocumentAsync.mockRejectedValue(new Error('Picker failed'));

    const { getByText } = await render(
      <AddDocumentScreen
        propertyId="property-1"
        assets={assets}
        rooms={rooms}
        onCancel={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    await fireEvent.press(getByText('Choose file'));
    await fireEvent.press(getByText('Continue'));

    await waitFor(() =>
      expect(
        getByText(
          'Could not import this file. Keep it available on this device and try again, or save the document without an attachment.',
        ),
      ).toBeTruthy(),
    );
  });

  it('lets the user back out before the file picker opens', async () => {
    const { getAllByText, getByText, queryByText } = await render(
      <AddDocumentScreen
        propertyId="property-1"
        assets={assets}
        rooms={rooms}
        onCancel={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    await fireEvent.press(getByText('Choose file'));
    expect(DocumentPicker.getDocumentAsync).not.toHaveBeenCalled();

    const cancelButtons = getAllByText('Cancel');

    if (!cancelButtons[1]) {
      throw new Error('Expected the attachment education card to render its own cancel button.');
    }

    await fireEvent.press(cancelButtons[1]);

    expect(DocumentPicker.getDocumentAsync).not.toHaveBeenCalled();
    expect(queryByText(/device's file picker/)).toBeNull();
  });

  it('prevents duplicate submissions while saving', async () => {
    let resolveSave: (() => void) | null = null;
    const pendingSave = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );
    const { getByLabelText, getByText } = await render(
      <AddDocumentScreen
        propertyId="property-1"
        assets={assets}
        rooms={rooms}
        onCancel={jest.fn()}
        onSave={pendingSave}
      />,
    );

    await fireEvent.changeText(getByLabelText('Title'), 'Warranty packet');
    const saveButton = getByText('Save document');
    await act(async () => {
      fireEvent.press(saveButton);
      await Promise.resolve();
    });
    await waitFor(() => expect(pendingSave).toHaveBeenCalledTimes(1));
    fireEvent.press(getByText('Saving'));

    await act(async () => {
      if (!resolveSave) {
        throw new Error('save promise did not start.');
      }

      resolveSave();
      await Promise.resolve();
    });

    await waitFor(() => expect(pendingSave).toHaveBeenCalledTimes(1));
  });
});
