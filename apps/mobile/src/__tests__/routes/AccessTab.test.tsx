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

const AccessTab = require('../../../app/(tabs)/access').default;

describe('AccessTab', () => {
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
        assetCount: 1,
        roomCount: 0,
        documentCount: 1,
        activeTaskCount: 0,
        healthScore: null,
        rooms: [],
        assets: [
          {
            id: 'asset-router',
            propertyId: 'property-1',
            name: 'Wi-Fi router',
            category: 'Network',
            status: 'ready' as const,
            roomName: 'Office',
            documentCount: 1,
            lastServiceLabel: 'Never',
            nextTaskLabel: 'No open tasks',
            warrantyExpiringSoon: false,
          },
        ],
        dueTasks: [],
        recentAssets: [],
        recentActivity: [],
        savedCostLabel: '$0',
        documents: [
          {
            id: 'document-1',
            propertyId: 'property-1',
            title: 'Router quick start',
            type: 'manual' as const,
            typeLabel: 'Manual',
            linkedToLabel: 'Wi-Fi router',
            dateLabel: 'Jul 1, 2026',
            linkedRecords: [{ id: 'asset-router', label: 'Wi-Fi router', kind: 'asset' as const }],
            linkedRecordIds: ['asset-router'],
          },
        ],
        accessItems: [
          {
            id: 'access-1',
            propertyId: 'property-1',
            category: 'wifi' as const,
            label: 'Main Wi-Fi',
            username: 'OakStreet-5G',
            accessCode: '9274',
            linkedAssetId: 'asset-router',
            linkedDocumentIds: ['document-1'],
            lastVerifiedAt: '2026-07-01',
          },
        ],
        emergencyContacts: [],
        importantAccounts: [],
        continuityPlaybooks: [],
        tasks: [],
        taskCompletions: [],
        repairEvents: [],
        parts: [],
      },
    });
  });

  it('shows access records and routes supporting actions', async () => {
    const { getByText } = await render(<AccessTab />);

    expect(getByText('Codes, logins, and entry notes')).toBeTruthy();
    expect(getByText('Main Wi-Fi')).toBeTruthy();
    expect(getByText('Linked device: Wi-Fi router')).toBeTruthy();

    await fireEvent.press(getByText('Save Wi-Fi'));
    await fireEvent.press(getByText('Review devices'));
    await fireEvent.press(getByText('Open documents'));
    await fireEvent.press(getByText('Main Wi-Fi'));
    await fireEvent.press(getByText('Share item'));

    expect(mockRouter.push).toHaveBeenNthCalledWith(1, {
      pathname: '/access/new',
      params: { category: 'wifi' },
    });
    expect(mockRouter.push).toHaveBeenNthCalledWith(2, '/(tabs)/devices');
    expect(mockRouter.push).toHaveBeenNthCalledWith(3, '/(tabs)/documents');
    expect(mockRouter.push).toHaveBeenNthCalledWith(4, '/access/access-1');
    expect(mockRouter.push).toHaveBeenNthCalledWith(5, {
      pathname: '/share/item',
      params: { id: 'access-1', recordType: 'access_item' },
    });
  });
});
