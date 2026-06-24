import { fireEvent, render } from '@testing-library/react-native';

import { DocumentsScreen } from '../../screens/DocumentsScreen';

describe('DocumentsScreen', () => {
  it('shows the no-documents empty state and calls import document', async () => {
    const onAddDocument = jest.fn();
    const { getByText } = await render(
      <DocumentsScreen
        documents={[]}
        documentCount={0}
        onAddDocument={onAddDocument}
        onDocumentPress={jest.fn()}
      />,
    );

    expect(getByText('Build the document vault')).toBeTruthy();
    await fireEvent.press(getByText('Import document'));
    expect(onAddDocument).toHaveBeenCalledTimes(1);
  });
});
