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

jest.mock('../../utils/navigation', () => ({
  navigateBackOrReplace: jest.fn(),
}));

const ContactIndexRoute = require('../../../app/contact/index').default;

describe('ContactIndexRoute', () => {
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
        documents: [],
        accessItems: [],
        emergencyContacts: [
          {
            id: 'contact-1',
            propertyId: 'property-1',
            name: 'Jamie Lee',
            role: 'Neighbor with spare key',
            priority: 'primary' as const,
            phone: '555-0101',
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
  });

  it('routes contact detail and item-share actions', async () => {
    const { getByText } = await render(<ContactIndexRoute />);

    await fireEvent.press(getByText('Jamie Lee'));
    await fireEvent.press(getByText('Share contact'));

    expect(mockRouter.push).toHaveBeenNthCalledWith(1, '/contact/contact-1');
    expect(mockRouter.push).toHaveBeenNthCalledWith(2, {
      pathname: '/share/item',
      params: { id: 'contact-1', recordType: 'emergency_contact' },
    });
  });
});
