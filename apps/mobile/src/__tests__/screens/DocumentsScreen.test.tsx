import { fireEvent, render } from '@testing-library/react-native';

import { DocumentsScreen } from '../../screens/DocumentsScreen';

describe('DocumentsScreen', () => {
  it('shows the policy-first empty state and calls typed quick actions', async () => {
    const onAddDocumentOfType = jest.fn();
    const onAddDocument = jest.fn();
    const { getAllByText, getByText } = await render(
      <DocumentsScreen
        documents={[]}
        documentCount={0}
        onAddDocument={onAddDocument}
        onAddDocumentOfType={onAddDocumentOfType}
        onDocumentPress={jest.fn()}
      />,
    );

    expect(getByText('Save the first policy or recovery file')).toBeTruthy();
    await fireEvent.press(getAllByText('Save insurance policy')[1]);
    await fireEvent.press(getAllByText('Add warranty file')[1]);
    expect(onAddDocument).not.toHaveBeenCalled();
    expect(onAddDocumentOfType).toHaveBeenNthCalledWith(1, 'insurance');
    expect(onAddDocumentOfType).toHaveBeenNthCalledWith(2, 'warranty');
  });

  it('filters documents by insurance collection', async () => {
    const { getByText, queryByText } = await render(
      <DocumentsScreen
        documents={[
          {
            id: 'document-1',
            propertyId: 'property-1',
            title: 'Prairie Mutual home policy',
            type: 'insurance',
            typeLabel: 'Insurance',
            linkedToLabel: 'Property',
            dateLabel: 'Jun 2026',
            linkedRecords: [],
            linkedRecordIds: ['property-1'],
          },
          {
            id: 'document-2',
            propertyId: 'property-1',
            title: 'Router manual',
            type: 'manual',
            typeLabel: 'Manual',
            linkedToLabel: 'Wi-Fi router',
            dateLabel: 'May 2026',
            linkedRecords: [],
            linkedRecordIds: ['asset-router'],
          },
        ]}
        documentCount={2}
        collection="insurance"
        onAddDocument={jest.fn()}
        onDocumentPress={jest.fn()}
      />,
    );

    expect(getByText('Prairie Mutual home policy')).toBeTruthy();
    expect(getByText('Insurance · Insurance · Property')).toBeTruthy();
    expect(queryByText('Router manual')).toBeNull();
  });
});
