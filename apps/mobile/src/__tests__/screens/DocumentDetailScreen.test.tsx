import { Alert, Linking } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { DocumentDetailScreen } from '../../screens/DocumentDetailScreen';
import type { DocumentListItem } from '../../data/homeVaultSampleData';

describe('DocumentDetailScreen', () => {
  const document: DocumentListItem = {
    id: 'document-1',
    propertyId: 'property-1',
    title: 'HVAC Manual',
    type: 'manual',
    typeLabel: 'Manual',
    linkedRecordIds: ['asset-1', 'room-1'],
    linkedToLabel: 'Dishwasher',
    dateLabel: 'Apr 2026',
    linkedRecords: [
      { id: 'asset-1', label: 'Dishwasher', kind: 'asset' },
      { id: 'room-1', label: 'Kitchen', kind: 'room' },
    ],
    attachment: {
      storageKind: 'app_copy',
      storedUri: 'file:///documents/homevault-documents/manual.pdf',
      attachedAt: '2026-06-23T12:00:00.000Z',
      fileName: 'manual.pdf',
      mimeType: 'application/pdf',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    jest.spyOn(Linking, 'openURL').mockResolvedValue();
  });

  it('renders linked records and opens the attached file', async () => {
    const { getAllByText, getByText } = await render(
      <DocumentDetailScreen
        document={document}
        onBack={jest.fn()}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
        onLinkedRecordPress={jest.fn()}
      />,
    );

    expect(getByText('Kitchen')).toBeTruthy();
    expect(getByText('Stored in HomeVault')).toBeTruthy();
    expect(getAllByText('Dishwasher').length).toBeGreaterThan(0);

    await fireEvent.press(getByText('Open file'));
    expect(Linking.openURL).toHaveBeenCalledWith('file:///documents/homevault-documents/manual.pdf');
  });

  it('explains how to recover when opening the attachment fails', async () => {
    (Linking.openURL as jest.Mock).mockRejectedValueOnce(new Error('Missing file'));

    const { getByText } = await render(
      <DocumentDetailScreen
        document={document}
        onBack={jest.fn()}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
        onLinkedRecordPress={jest.fn()}
      />,
    );

    await fireEvent.press(getByText('Open file'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Could not open file',
      'Check that the file is still available on this device, or edit this document and attach it again.',
    );
  });
});
