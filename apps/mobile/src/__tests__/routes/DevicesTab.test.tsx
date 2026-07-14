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

const DevicesTab = require('../../../app/(tabs)/devices').default;

describe('DevicesTab', () => {
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
        documentCount: 0,
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
            assetType: 'device' as const,
          },
        ],
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
  });

  it('routes device detail and item-share actions', async () => {
    const { getByText } = await render(<DevicesTab />);

    await fireEvent.press(getByText('Wi-Fi router'));
    await fireEvent.press(getByText('Share device'));

    expect(mockRouter.push).toHaveBeenNthCalledWith(1, '/asset/asset-router?source=devices');
    expect(mockRouter.push).toHaveBeenNthCalledWith(2, {
      pathname: '/share/item',
      params: { id: 'asset-router', recordType: 'asset' },
    });
  });
});
