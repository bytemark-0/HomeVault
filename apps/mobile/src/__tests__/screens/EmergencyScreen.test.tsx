import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockShareTextFile = jest.fn();

jest.mock('../../utils/textShare', () => ({
  shareTextFile: (...args: unknown[]) => mockShareTextFile(...args),
}));

import { EmergencyScreen } from '../../screens/EmergencyScreen';

describe('EmergencyScreen', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockShareTextFile.mockResolvedValue('shared');
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((message?: unknown) => {
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

  it('shows ownership coverage and exports a responsibility handoff', async () => {
    const { getAllByText, getByText } = await render(
      <EmergencyScreen
        accessItems={[
          {
            id: 'access-1',
            propertyId: 'property-1',
            category: 'utility_shutoff',
            label: 'Main water shutoff',
            linkedDocumentIds: [],
          },
        ]}
        assets={[
          {
            id: 'asset-1',
            propertyId: 'property-1',
            name: 'Family router',
            category: 'Networking',
            ownerName: 'Jamie',
            status: 'ready',
            roomName: 'Office',
            documentCount: 0,
            lastServiceLabel: 'Never',
            nextTaskLabel: 'No open tasks',
            warrantyExpiringSoon: false,
          },
        ]}
        documents={[
          {
            id: 'document-1',
            propertyId: 'property-1',
            title: 'Prairie Mutual home policy',
            type: 'insurance',
            typeLabel: 'Insurance',
            linkedToLabel: 'Property',
            dateLabel: 'Jul 1, 2026',
            linkedRecords: [],
            linkedRecordIds: ['property-1'],
          },
        ]}
        emergencyContacts={[
          {
            id: 'contact-1',
            propertyId: 'property-1',
            name: 'Taylor Reed',
            role: 'Backup household helper',
            priority: 'secondary',
          },
          {
            id: 'contact-2',
            propertyId: 'property-1',
            name: 'River City Plumbing',
            role: 'Emergency plumber',
            priority: 'service_provider',
          },
        ]}
        importantAccounts={[
          {
            id: 'account-1',
            propertyId: 'property-1',
            kind: 'insurance',
            providerName: 'Prairie Mutual',
            label: 'Home policy',
            managerRole: 'self',
            linkedDocumentIds: [],
            lastReviewedAt: '2026-07-01',
          },
          {
            id: 'account-2',
            propertyId: 'property-1',
            kind: 'utility',
            providerName: 'Maple Utilities',
            label: 'Electric and water billing',
            managerRole: 'shared_household',
            isSharedHouseholdAccount: true,
            linkedDocumentIds: [],
            lastReviewedAt: '2026-07-01',
          },
        ]}
        continuityPlaybooks={[]}
        propertyId="property-1"
        propertyLabel="Oak Street home"
        onAddEmergencyContact={jest.fn()}
        onAddImportantAccount={jest.fn()}
        onOpenAccessArea={jest.fn()}
        onOpenAccessItem={jest.fn()}
        onOpenAsset={jest.fn()}
        onOpenDevices={jest.fn()}
        onOpenDocumentArea={jest.fn()}
        onOpenDocument={jest.fn()}
        onOpenEmergencyContact={jest.fn()}
        onOpenEmergencyContacts={jest.fn()}
        onOpenExport={jest.fn()}
        onOpenHousehold={jest.fn()}
        onOpenImportantAccount={jest.fn()}
        onOpenPlaybook={jest.fn()}
        onOpenShareHub={jest.fn()}
        onOpenTrustedHandoff={jest.fn()}
        onShareImportantAccount={jest.fn()}
      />,
    );

    expect(getByText('Ownership and backup roles')).toBeTruthy();
    expect(getByText('Insurance claims')).toBeTruthy();
    expect(getByText('Utilities and home systems')).toBeTruthy();
    expect(getAllByText('Owner: You').length).toBeGreaterThan(0);
    expect(getByText('Backup: Shared household access')).toBeTruthy();

    fireEvent.press(getByText('Share roles'));

    await waitFor(() =>
      expect(mockShareTextFile).toHaveBeenCalledWith(
        expect.objectContaining({
          dialogTitle: 'Share HomeVault responsibility handoff',
          fileName: expect.stringContaining('homevault-responsibility-handoff-oak-street-home-'),
          text: expect.stringContaining('HomeVault Responsibility Handoff'),
        }),
      ),
    );

    expect(getByText('Responsibility handoff shared.')).toBeTruthy();
  });

  it('switches to the teen helper view and hides sensitive sections by default', async () => {
    const onOpenTrustedHandoff = jest.fn();
    const { getByTestId, getByText, queryByText } = await render(
      <EmergencyScreen
        accessItems={[
          {
            id: 'access-1',
            propertyId: 'property-1',
            category: 'utility_shutoff',
            label: 'Main water shutoff',
            linkedDocumentIds: [],
          },
        ]}
        assets={[
          {
            id: 'asset-1',
            propertyId: 'property-1',
            name: 'Family router',
            category: 'Networking',
            ownerName: 'Jamie',
            status: 'ready',
            roomName: 'Office',
            documentCount: 0,
            lastServiceLabel: 'Never',
            nextTaskLabel: 'No open tasks',
            warrantyExpiringSoon: false,
          },
        ]}
        documents={[
          {
            id: 'document-1',
            propertyId: 'property-1',
            title: 'Prairie Mutual home policy',
            type: 'insurance',
            typeLabel: 'Insurance',
            linkedToLabel: 'Property',
            dateLabel: 'Jul 1, 2026',
            linkedRecords: [],
            linkedRecordIds: ['property-1'],
          },
        ]}
        emergencyContacts={[
          {
            id: 'contact-1',
            propertyId: 'property-1',
            name: 'Taylor Reed',
            role: 'Backup household helper',
            priority: 'secondary',
          },
          {
            id: 'contact-2',
            propertyId: 'property-1',
            name: 'River City Plumbing',
            role: 'Emergency plumber',
            priority: 'service_provider',
          },
        ]}
        importantAccounts={[
          {
            id: 'account-1',
            propertyId: 'property-1',
            kind: 'insurance',
            providerName: 'Prairie Mutual',
            label: 'Home policy',
            managerRole: 'self',
            linkedDocumentIds: [],
            lastReviewedAt: '2026-07-01',
          },
        ]}
        continuityPlaybooks={[]}
        propertyId="property-1"
        propertyLabel="Oak Street home"
        onAddEmergencyContact={jest.fn()}
        onAddImportantAccount={jest.fn()}
        onOpenAccessArea={jest.fn()}
        onOpenAccessItem={jest.fn()}
        onOpenAsset={jest.fn()}
        onOpenDevices={jest.fn()}
        onOpenDocumentArea={jest.fn()}
        onOpenDocument={jest.fn()}
        onOpenEmergencyContact={jest.fn()}
        onOpenEmergencyContacts={jest.fn()}
        onOpenExport={jest.fn()}
        onOpenHousehold={jest.fn()}
        onOpenImportantAccount={jest.fn()}
        onOpenPlaybook={jest.fn()}
        onOpenShareHub={jest.fn()}
        onOpenTrustedHandoff={onOpenTrustedHandoff}
        onShareImportantAccount={jest.fn()}
      />,
    );

    fireEvent.press(getByTestId('audience-view-teen_helper'));

    await waitFor(() => {
      expect(getByText('Authority reminder')).toBeTruthy();
      expect(getByText(/support-only/i)).toBeTruthy();
      expect(queryByText('Ownership and backup roles')).toBeNull();
      expect(queryByText('Digital safety checklist')).toBeNull();
      expect(queryByText('Primary recovery accounts')).toBeNull();
      expect(queryByText('Critical documents')).toBeNull();
      expect(queryByText('Important accounts')).toBeNull();
      expect(getByText('Open matching handoff')).toBeTruthy();
    });

    fireEvent.press(getByText('Open matching handoff'));

    expect(onOpenTrustedHandoff).toHaveBeenCalledWith('house_sitter');
  });
});
