import { fireEvent, render } from '@testing-library/react-native';

const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
};
const mockUseHomeVault = jest.fn();

jest.mock('expo-router', () => ({
  router: mockRouter,
}));

jest.mock('../../context/HomeVaultContext', () => ({
  useHomeVault: () => mockUseHomeVault(),
}));

const QuickAddRoute = require('../../../app/quick-add').default;

describe('QuickAddRoute', () => {
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

  it('prioritizes access, emergency, and device workflows', async () => {
    const { getByText } = await render(<QuickAddRoute />);

    expect(getByText('Start with the essentials')).toBeTruthy();

    fireEvent.press(getByText('Access'));
    fireEvent.press(getByText('Emergency'));
    fireEvent.press(getByText('Device'));

    expect(mockRouter.back).toHaveBeenCalledTimes(3);
    expect(mockRouter.push).toHaveBeenNthCalledWith(1, '/(tabs)/access');
    expect(mockRouter.push).toHaveBeenNthCalledWith(2, '/(tabs)/emergency');
    expect(mockRouter.push).toHaveBeenNthCalledWith(3, {
      pathname: '/asset/new',
      params: { mode: 'device' },
    });
  });
});
