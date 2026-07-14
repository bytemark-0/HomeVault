import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockShareTextFile = jest.fn();

jest.mock('../../utils/textShare', () => ({
  shareTextFile: (...args: unknown[]) => mockShareTextFile(...args),
}));

import { IncidentWorkspaceScreen } from '../../screens/IncidentWorkspaceScreen';

describe('IncidentWorkspaceScreen', () => {
  let consoleErrorSpy: jest.SpyInstance;

  const property = {
    id: 'property-1',
    householdId: 'household-1',
    label: 'Oak Street home',
    type: 'single_family' as const,
  };

  const guide = {
    id: 'guide-insurance-incident',
    source: 'guided' as const,
    title: 'Insurance incident response',
    category: 'emergency' as const,
    state: 'ready' as const,
    whenToUse: 'Use this after damage, theft, or another claim-worthy incident at home.',
    summary: 'This playbook links the insurer, policy documents, and emergency packet export path.',
    notes: 'Start here when the incident may become a claim.',
    steps: [
      {
        id: 'step-1',
        label: 'Open the insurance account and confirm the right provider and phone number.',
        isRequired: true,
        isComplete: true,
        requiredResourceKeys: ['insurance_account'],
      },
    ],
    readyRecords: [
      {
        key: 'insurance_account',
        label: 'Home policy',
        detail: 'Prairie Mutual',
        priority: 'required' as const,
        status: 'ready' as const,
        target: { kind: 'account' as const, id: 'account-1' },
      },
      {
        key: 'insurance_document',
        label: 'Prairie Mutual home policy',
        detail: 'Insurance',
        priority: 'required' as const,
        status: 'ready' as const,
        target: { kind: 'document' as const, id: 'document-policy' },
      },
    ],
    missingRecords: [
      {
        key: 'emergency_packet',
        label: 'Emergency packet',
        detail: 'Share or print the current emergency packet for a spouse, sitter, or helper.',
        priority: 'recommended' as const,
        status: 'missing' as const,
        target: { kind: 'screen' as const, screen: 'export' as const, focus: 'packet' as const },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockShareTextFile.mockResolvedValue('shared');
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((message?: unknown) => {
      if (
        typeof message === 'string' &&
        message.includes('overlapping act() calls')
      ) {
        return;
      }

      if (
        typeof message === 'string' &&
        message.includes('The current testing environment is not configured to support act')
      ) {
        return;
      }
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('exports a focused incident summary and opens linked records', async () => {
    const onShared = jest.fn();
    const onOpenTarget = jest.fn();
    const { getAllByText, getByPlaceholderText, getByText } = await render(
      <IncidentWorkspaceScreen
        documents={[
          {
            id: 'document-policy',
            propertyId: property.id,
            title: 'Prairie Mutual home policy',
            type: 'insurance',
            typeLabel: 'Insurance',
            linkedToLabel: 'Property',
            dateLabel: 'Jul 1, 2026',
            linkedRecords: [],
            linkedRecordIds: [property.id],
          },
        ]}
        emergencyContacts={[
          {
            id: 'contact-1',
            propertyId: property.id,
            name: 'Jamie Lee',
            role: 'Neighbor',
            priority: 'primary',
            phone: '555-0101',
          },
        ]}
        guide={guide}
        onBack={jest.fn()}
        onOpenTarget={onOpenTarget}
        onShared={onShared}
        property={property}
      />,
    );

    fireEvent.changeText(getByPlaceholderText('CLM-2026-0142 or utility ticket'), 'CLM-2026-0142');

    expect(getByText('Photo evidence')).toBeTruthy();
    expect(getByText('Document links')).toBeTruthy();
    expect(getByText('Contact interactions')).toBeTruthy();
    expect(getByText('Recovery tracker')).toBeTruthy();
    expect(getByText('Recovery checklist')).toBeTruthy();
    expect(getByText('Unresolved reminders')).toBeTruthy();
    expect(getByText('Return to ready')).toBeTruthy();
    expect(getAllByText('Prairie Mutual home policy').length).toBeGreaterThan(0);
    expect(getByText('Jamie Lee')).toBeTruthy();

    fireEvent.press(getByText('Share incident summary'));

    await waitFor(() =>
      expect(mockShareTextFile).toHaveBeenCalledWith(
        expect.objectContaining({
          dialogTitle: 'Share HomeVault incident summary',
          fileName: expect.stringContaining('homevault-incident-summary-insurance-insurer-oak-street-home-'),
          text: expect.stringContaining('HomeVault Incident Summary'),
        }),
      ),
    );
    expect(onShared).toHaveBeenCalledWith('Incident summary shared.');

    fireEvent.press(getByText('Home policy'));

    expect(onOpenTarget).toHaveBeenCalledWith({ kind: 'account', id: 'account-1' });
  });
});
