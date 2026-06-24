import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { ExportManifestScreen } from '../../screens/ExportManifestScreen';

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('../../utils/exportZip', () => ({
  shareZipExport: jest.fn(),
}));

const DocumentPicker = require('expo-document-picker');

describe('ExportManifestScreen', () => {
  const property = {
    id: 'property-1',
    householdId: 'household-1',
    label: 'Oak Street home',
    type: 'single_family' as const,
  };

  const baseProps = {
    property,
    assets: [],
    documents: [],
    parts: [],
    repairEvents: [],
    rooms: [],
    taskCompletions: [],
    tasks: [],
    onBackupCreated: jest.fn(),
    onBack: jest.fn(),
    onFixPress: jest.fn(),
    onRestoreBackup: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a clear not-homevault warning for invalid backup files', async () => {
    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          name: 'notes.json',
          uri: 'file:///tmp/notes.json',
          file: {
            text: async () => JSON.stringify({ note: 'not a backup package' }),
          },
        },
      ],
    });

    const { getByText } = await render(<ExportManifestScreen {...baseProps} />);

    await act(async () => {
      fireEvent.press(getByText('Choose backup'));
    });

    await waitFor(() =>
      expect(
        getByText(
          'This file does not appear to be a HomeVault backup. Choose a file exported from the HomeVault app.',
        ),
      ).toBeTruthy(),
    );
    expect(getByText('Needs attention before continuing.')).toBeTruthy();
  });

  it('warns that restore will replace local records before restoring', async () => {
    const { getByText } = await render(
      <ExportManifestScreen {...baseProps} />,
    );

    await act(async () => {
      fireEvent.press(getByText('Load sample'));
    });

    await waitFor(() =>
      expect(getByText('Backup package is ready to restore.')).toBeTruthy(),
    );
    await waitFor(() =>
      expect(getByText('Restore will overwrite this preview')).toBeTruthy(),
    );
    expect(
      getByText(
        'Current rooms, assets, documents, tasks, service history, and repairs will be replaced with the validated backup package.',
      ),
    ).toBeTruthy();
    expect(getByText('Type RESTORE to enable restore.')).toBeTruthy();
  });
});
