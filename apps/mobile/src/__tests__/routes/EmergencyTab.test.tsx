import { fireEvent, render } from '@testing-library/react-native';

const mockRouter = {
  push: jest.fn(),
};
const mockUseHomeVault = jest.fn();

jest.mock('expo-router', () => ({
  router: mockRouter,
}));

jest.mock('../../context/HomeVaultContext', () => ({
  useHomeVault: () => mockUseHomeVault(),
}));

jest.mock('../../components/SampleModeNotice', () => ({
  SampleModeNotice: () => null,
}));

const EmergencyTab = require('../../../app/(tabs)/emergency').default;

describe('EmergencyTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHomeVault.mockReturnValue({
      appData: {
        property: {
          id: 'property-1',
          householdId: 'household-1',
          label: 'Oak Street home',
          type: 'single_family' as const,
        },
        assetCount: 0,
        roomCount: 0,
        documentCount: 0,
        activeTaskCount: 0,
        healthScore: null,
        rooms: [],
        assets: [],
        dueTasks: [],
        recentAssets: [],
        recentActivity: [],
        savedCostLabel: '$0',
        documents: [
          {
            id: 'document-1',
            propertyId: 'property-1',
            title: 'Prairie Mutual home policy',
            type: 'insurance' as const,
            typeLabel: 'Insurance',
            linkedToLabel: 'Property',
            dateLabel: 'Jul 1, 2026',
            linkedRecords: [{ id: 'property-1', label: 'Oak Street home', kind: 'property' as const }],
            linkedRecordIds: ['property-1'],
          },
          {
            id: 'document-2',
            propertyId: 'property-1',
            title: 'Water shutoff map',
            type: 'emergency' as const,
            typeLabel: 'Emergency',
            linkedToLabel: 'Property',
            dateLabel: 'Jul 1, 2026',
            linkedRecords: [{ id: 'property-1', label: 'Oak Street home', kind: 'property' as const }],
            linkedRecordIds: ['property-1'],
          },
        ],
        accessItems: [
          {
            id: 'access-1',
            propertyId: 'property-1',
            category: 'utility_shutoff' as const,
            label: 'Main water shutoff',
            location: 'Garage south wall',
            instructions: 'Turn clockwise until water stops.',
            linkedDocumentIds: ['document-2'],
            lastVerifiedAt: '2026-07-01',
            lastReviewedAt: '2026-07-01',
          },
        ],
        emergencyContacts: [
          {
            id: 'contact-1',
            propertyId: 'property-1',
            name: 'Jamie Lee',
            role: 'Neighbor with spare key',
            priority: 'primary' as const,
            phone: '555-0101',
            lastReviewedAt: '2026-07-01',
          },
        ],
        importantAccounts: [
          {
            id: 'account-1',
            propertyId: 'property-1',
            kind: 'insurance' as const,
            providerName: 'Prairie Mutual',
            label: 'Home policy',
            phone: '555-0119',
            managerRole: 'self' as const,
            isSharedHouseholdAccount: false,
            mfaEnabled: true,
            recoveryCodesStored: false,
            managedInPasswordManager: true,
            linkedDocumentIds: [],
            lastReviewedAt: '2026-07-01',
          },
        ],
        continuityPlaybooks: [
          {
            id: 'playbook-1',
            propertyId: 'property-1',
            category: 'storm' as const,
            title: 'Storm outage restart',
            state: 'in_progress' as const,
            linkedRecordIds: [],
            steps: [
              { id: 'step-1', label: 'Check router lights', isRequired: true, isComplete: true },
              { id: 'step-2', label: 'Reset breaker if needed', isRequired: true, isComplete: false },
            ],
          },
        ],
        tasks: [],
        taskCompletions: [],
        repairEvents: [],
        parts: [],
      },
    });
  });

  it('surfaces emergency records and routes to export tools', async () => {
    const { getByText } = await render(<EmergencyTab />);

    expect(getByText('Who to call and what to hand off')).toBeTruthy();
    expect(getByText('What to do now')).toBeTruthy();
    expect(getByText('4 of 6 emergency essentials ready')).toBeTruthy();
    expect(getByText('Start from an incident')).toBeTruthy();
    expect(getByText('Digital safety checklist')).toBeTruthy();
    expect(getByText('Primary recovery accounts')).toBeTruthy();
    expect(getByText('Turn on multi-factor authentication')).toBeTruthy();
    expect(getByText('Track a phone, router, or other critical device')).toBeTruthy();
    expect(getByText('Prepare a trusted handoff')).toBeTruthy();
    expect(getByText('Main water shutoff')).toBeTruthy();
    expect(getByText('Documents: Water shutoff map')).toBeTruthy();
    expect(getByText('Prairie Mutual home policy')).toBeTruthy();
    expect(getByText('Jamie Lee')).toBeTruthy();
    expect(getByText('Storm outage restart')).toBeTruthy();
    expect(getByText('Home lockout recovery')).toBeTruthy();
    expect(getByText('Internet outage recovery')).toBeTruthy();
    expect(getByText('Manage contacts')).toBeTruthy();
    expect(getByText('Open sharing tools')).toBeTruthy();

    await fireEvent.press(getByText('Turn on multi-factor authentication'));
    await fireEvent.press(getByText('Track a phone, router, or other critical device'));
    await fireEvent.press(getByText('Prepare a trusted handoff'));
    await fireEvent.press(getByText('Main water shutoff'));
    await fireEvent.press(getByText('Prairie Mutual home policy'));
    await fireEvent.press(getByText('Jamie Lee'));
    await fireEvent.press(getByText('Home policy'));
    await fireEvent.press(getByText('Primary email'));
    await fireEvent.press(getByText('Home lockout recovery'));
    await fireEvent.press(getByText('Open Documents'));
    await fireEvent.press(getByText('Open Access'));
    await fireEvent.press(getByText('Manage contacts'));
    await fireEvent.press(getByText('Open full emergency packet'));
    await fireEvent.press(getByText('Start trusted handoff'));
    await fireEvent.press(getByText('Open sharing tools'));
    await fireEvent.press(getByText('Share account'));
    await fireEvent.press(getByText('Review household settings and backup'));

    expect(mockRouter.push).toHaveBeenNthCalledWith(1, '/account/new');
    expect(mockRouter.push).toHaveBeenNthCalledWith(2, '/(tabs)/devices');
    expect(mockRouter.push).toHaveBeenNthCalledWith(3, {
      pathname: '/export',
      params: { focus: 'trusted-share' },
    });
    expect(mockRouter.push).toHaveBeenNthCalledWith(4, '/access/access-1');
    expect(mockRouter.push).toHaveBeenNthCalledWith(5, '/document/document-1');
    expect(mockRouter.push).toHaveBeenNthCalledWith(6, '/contact/contact-1');
    expect(mockRouter.push).toHaveBeenNthCalledWith(7, '/account/account-1');
    expect(mockRouter.push).toHaveBeenNthCalledWith(8, {
      pathname: '/account/new',
      params: { kind: 'email' },
    });
    expect(mockRouter.push).toHaveBeenNthCalledWith(9, '/playbook/guide-home-lockout');
    expect(mockRouter.push).toHaveBeenNthCalledWith(10, {
      pathname: '/(tabs)/documents',
      params: { collection: 'critical' },
    });
    expect(mockRouter.push).toHaveBeenNthCalledWith(11, '/(tabs)/access');
    expect(mockRouter.push).toHaveBeenNthCalledWith(12, '/contact');
    expect(mockRouter.push).toHaveBeenNthCalledWith(13, '/export');
    expect(mockRouter.push).toHaveBeenNthCalledWith(14, {
      pathname: '/export',
      params: { focus: 'trusted-share' },
    });
    expect(mockRouter.push).toHaveBeenNthCalledWith(15, '/share');
    expect(mockRouter.push).toHaveBeenNthCalledWith(16, {
      pathname: '/share/item',
      params: { id: 'account-1', recordType: 'important_account' },
    });
    expect(mockRouter.push).toHaveBeenNthCalledWith(17, '/(tabs)/household');
  });

  it('opens the matching trusted-share preset for a teen helper handoff', async () => {
    const { getByTestId, getByText } = await render(<EmergencyTab />);

    await fireEvent.press(getByTestId('audience-view-teen_helper'));
    await fireEvent.press(getByText('Open matching handoff'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/export',
      params: { focus: 'trusted-share', audience: 'house_sitter' },
    });
  });

  it('surfaces direct stale-record nudges for high-risk emergency records', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-09T12:00:00.000Z'));

    mockUseHomeVault.mockReturnValue({
      appData: {
        property: {
          id: 'property-1',
          householdId: 'household-1',
          label: 'Oak Street home',
          type: 'single_family' as const,
        },
        assetCount: 1,
        roomCount: 0,
        documentCount: 0,
        activeTaskCount: 0,
        healthScore: null,
        rooms: [],
        assets: [
          {
            id: 'asset-router',
            propertyId: 'property-1',
            name: 'Main router',
            category: 'Networking',
            status: 'ready' as const,
            roomName: 'Office',
            documentCount: 0,
            lastServiceLabel: 'Never',
            nextTaskLabel: 'No open tasks',
            warrantyExpiringSoon: false,
          },
        ],
        dueTasks: [],
        recentAssets: [],
        recentActivity: [],
        savedCostLabel: '$0',
        documents: [],
        accessItems: [
          {
            id: 'access-1',
            propertyId: 'property-1',
            category: 'wifi' as const,
            label: 'Main Wi-Fi',
            linkedDocumentIds: [],
            lastReviewedAt: '2025-12-01',
          },
        ],
        emergencyContacts: [
          {
            id: 'contact-1',
            propertyId: 'property-1',
            name: 'Jamie Lee',
            role: 'Neighbor',
            priority: 'primary' as const,
          },
        ],
        importantAccounts: [],
        continuityPlaybooks: [],
        tasks: [],
        taskCompletions: [],
        repairEvents: [],
        parts: [],
      },
    });

    const { getAllByText, getByText } = await render(<EmergencyTab />);

    expect(getByText('Review now')).toBeTruthy();
    expect(getAllByText('Jamie Lee').length).toBeGreaterThan(0);

    fireEvent.press(getAllByText('Jamie Lee')[0]!);

    expect(mockRouter.push).toHaveBeenCalledWith('/contact/contact-1');

    jest.useRealTimers();
  });

  it('guides an empty household toward setup instead of dead ends', async () => {
    mockUseHomeVault.mockReturnValue({
      appData: {
        property: {
          id: 'property-1',
          householdId: 'household-1',
          label: 'Oak Street home',
          type: 'single_family' as const,
        },
        assetCount: 0,
        roomCount: 0,
        documentCount: 0,
        activeTaskCount: 0,
        healthScore: null,
        rooms: [],
        assets: [],
        dueTasks: [],
        recentAssets: [],
        recentActivity: [],
        savedCostLabel: '$0',
        documents: [],
        accessItems: [],
        emergencyContacts: [],
        importantAccounts: [],
        continuityPlaybooks: [],
        tasks: [],
        taskCompletions: [],
        repairEvents: [],
        parts: [],
      },
    });

    const { getByText } = await render(<EmergencyTab />);

    expect(getByText('0 of 6 emergency essentials ready')).toBeTruthy();
    expect(getByText('Save a home entry or shutoff note')).toBeTruthy();
    expect(getByText('Add the first trusted contact')).toBeTruthy();
    expect(getByText('Add the insurance account')).toBeTruthy();
    expect(getByText('Add contacts')).toBeTruthy();
    expect(getByText('Add first contact')).toBeTruthy();
    expect(
      getByText(
        'Save utility shutoffs, lockbox notes, spare key locations, and entry instructions so someone can act fast without digging through inventory.',
      ),
    ).toBeTruthy();
    expect(
      getByText(
        'Keep insurance policies, claim files, emergency plans, and other critical paperwork one tap away here.',
      ),
    ).toBeTruthy();
    expect(getByText('Open sharing tools')).toBeTruthy();

    await fireEvent.press(getByText('Save a home entry or shutoff note'));
    await fireEvent.press(getByText('Add the first trusted contact'));
    await fireEvent.press(getByText('Add the insurance account'));
    await fireEvent.press(getByText('Add first contact'));
    await fireEvent.press(getByText('Open sharing tools'));

    expect(mockRouter.push).toHaveBeenNthCalledWith(1, '/(tabs)/access');
    expect(mockRouter.push).toHaveBeenNthCalledWith(2, '/contact/new');
    expect(mockRouter.push).toHaveBeenNthCalledWith(3, '/account/new');
    expect(mockRouter.push).toHaveBeenNthCalledWith(4, '/contact/new');
    expect(mockRouter.push).toHaveBeenNthCalledWith(5, '/share');
  });

  it('prioritizes the next missing emergency basics for a partially prepared household', async () => {
    mockUseHomeVault.mockReturnValue({
      appData: {
        property: {
          id: 'property-1',
          householdId: 'household-1',
          label: 'Oak Street home',
          type: 'single_family' as const,
        },
        assetCount: 0,
        roomCount: 0,
        documentCount: 0,
        activeTaskCount: 0,
        healthScore: null,
        rooms: [],
        assets: [],
        dueTasks: [],
        recentAssets: [],
        recentActivity: [],
        savedCostLabel: '$0',
        documents: [],
        accessItems: [
          {
            id: 'access-1',
            propertyId: 'property-1',
            category: 'wifi' as const,
            label: 'Main Wi-Fi',
            linkedDocumentIds: [],
            lastReviewedAt: '2026-07-01',
          },
        ],
        emergencyContacts: [
          {
            id: 'contact-1',
            propertyId: 'property-1',
            name: 'Jamie Lee',
            role: 'Neighbor with spare key',
            priority: 'primary' as const,
            phone: '555-0101',
            lastReviewedAt: '2026-07-01',
          },
        ],
        importantAccounts: [],
        continuityPlaybooks: [],
        tasks: [],
        taskCompletions: [],
        repairEvents: [],
        parts: [],
      },
    });

    const { getByText, queryByText } = await render(<EmergencyTab />);

    expect(getByText('2 of 6 emergency essentials ready')).toBeTruthy();
    expect(getByText('Add the insurance account')).toBeTruthy();
    expect(getByText('Track a phone, router, or other critical device')).toBeTruthy();
    expect(getByText('Add digital recovery notes')).toBeTruthy();
    expect(queryByText('Save a home entry or shutoff note')).toBeNull();
    expect(queryByText('Add the first trusted contact')).toBeNull();

    await fireEvent.press(getByText('Add the insurance account'));
    await fireEvent.press(getByText('Track a phone, router, or other critical device'));
    await fireEvent.press(getByText('Add digital recovery notes'));

    expect(mockRouter.push).toHaveBeenNthCalledWith(1, '/account/new');
    expect(mockRouter.push).toHaveBeenNthCalledWith(2, '/(tabs)/devices');
    expect(mockRouter.push).toHaveBeenNthCalledWith(3, '/account/new');
  });
});
