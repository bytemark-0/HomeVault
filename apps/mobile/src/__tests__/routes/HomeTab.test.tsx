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

jest.mock('../../components/SetupChecklistCard', () => ({
  SetupChecklistCard: () => null,
}));

const HomeTab = require('../../../app/(tabs)/index').default;

describe('HomeTab quick actions', () => {
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
        tasks: [],
        taskCompletions: [],
        repairEvents: [],
        parts: [],
      },
      backupSummary: null,
      loadError: false,
      reload: jest.fn(),
    });
  });

  it('routes quick actions with one tap from the dashboard', async () => {
    const { getByText } = await render(<HomeTab />);

    fireEvent.press(getByText('Add asset'));
    fireEvent.press(getByText('Add task'));
    fireEvent.press(getByText('Add document'));

    expect(mockRouter.push).toHaveBeenNthCalledWith(1, '/asset/new');
    expect(mockRouter.push).toHaveBeenNthCalledWith(2, '/task/new');
    expect(mockRouter.push).toHaveBeenNthCalledWith(3, '/document/new');
  });
});
