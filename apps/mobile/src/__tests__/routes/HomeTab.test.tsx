import { fireEvent, render } from '@testing-library/react-native';

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///documents/',
  getInfoAsync: jest.fn(async () => ({ exists: false })),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

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
        documentCount: 1,
        activeTaskCount: 1,
        healthScore: null,
        rooms: [],
        assets: [
          {
            id: 'asset-1',
            propertyId: 'property-1',
            roomId: 'room-1',
            name: 'Water heater',
            category: 'Appliance',
            roomName: 'Utility',
            documentCount: 1,
            lastServiceLabel: 'Not serviced',
            nextTaskLabel: 'Flush tank',
            warrantyExpiringSoon: false,
            status: 'ready' as const,
          },
        ],
        dueTasks: [
          {
            id: 'task-1',
            propertyId: 'property-1',
            scope: 'asset' as const,
            scopeId: 'asset-1',
            title: 'Flush tank',
            state: 'upcoming' as const,
            recurrenceKind: 'interval' as const,
            recurrenceLabel: 'Yearly',
            scopeLabel: 'Water heater',
            dueLabel: 'Jul 10',
          },
        ],
        recentAssets: [],
        recentActivity: [],
        savedCostLabel: '$0',
        documents: [
          {
            id: 'document-1',
            propertyId: 'property-1',
            title: 'Water heater manual',
            type: 'manual' as const,
            typeLabel: 'Manual',
            linkedToLabel: 'Water heater',
            dateLabel: 'Jun 27, 2026',
            linkedRecords: [{ id: 'asset-1', label: 'Water heater', kind: 'asset' as const }],
            linkedRecordIds: ['asset-1'],
          },
        ],
        accessItems: [],
        emergencyContacts: [],
        importantAccounts: [],
        continuityPlaybooks: [],
        tasks: [
          {
            id: 'task-1',
            propertyId: 'property-1',
            scope: 'asset' as const,
            scopeId: 'asset-1',
            title: 'Flush tank',
            state: 'upcoming' as const,
            recurrenceKind: 'interval' as const,
            recurrenceLabel: 'Yearly',
            scopeLabel: 'Water heater',
            dueLabel: 'Jul 10',
          },
        ],
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

    expect(getByText('What this already protects')).toBeTruthy();
    expect(getByText('1 device documented')).toBeTruthy();
    expect(getByText('1 reminder scheduled')).toBeTruthy();
    expect(getByText('Next best step')).toBeTruthy();
    expect(getByText('Save Wi-Fi details')).toBeTruthy();

    fireEvent.press(getByText('Access details'));
    fireEvent.press(getByText('Emergency contacts'));
    fireEvent.press(getByText('Annual review'));
    fireEvent.press(getByText('Insurance records'));
    fireEvent.press(getByText('Add device'));

    expect(mockRouter.push).toHaveBeenNthCalledWith(1, '/(tabs)/access');
    expect(mockRouter.push).toHaveBeenNthCalledWith(2, '/contact');
    expect(mockRouter.push).toHaveBeenNthCalledWith(3, '/annual-review');
    expect(mockRouter.push).toHaveBeenNthCalledWith(4, {
      pathname: '/(tabs)/documents',
      params: { collection: 'insurance' },
    });
    expect(mockRouter.push).toHaveBeenNthCalledWith(5, {
      pathname: '/asset/new',
      params: { mode: 'device' },
    });
  });
});
