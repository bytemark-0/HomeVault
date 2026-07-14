import { fireEvent, render } from '@testing-library/react-native';

const mockRouter = {
  push: jest.fn(),
  setParams: jest.fn(),
};
const mockUseHomeVault = jest.fn();
const mockUseLocalSearchParams = jest.fn();

jest.mock('expo-router', () => ({
  router: mockRouter,
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock('../../context/HomeVaultContext', () => ({
  useHomeVault: () => mockUseHomeVault(),
}));

jest.mock('../../components/SampleModeNotice', () => ({
  SampleModeNotice: () => null,
}));

const DocumentsTab = require('../../../app/(tabs)/documents').default;

describe('DocumentsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({});
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
        documentCount: 2,
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
            title: 'Prairie Mutual home policy',
            type: 'insurance' as const,
            typeLabel: 'Insurance',
            linkedToLabel: 'Property',
            dateLabel: 'Jun 2026',
            linkedRecords: [{ id: 'property-1', label: 'Property', kind: 'property' as const }],
            linkedRecordIds: ['property-1'],
          },
          {
            id: 'document-2',
            propertyId: 'property-1',
            title: 'Router manual',
            type: 'manual' as const,
            typeLabel: 'Manual',
            linkedToLabel: 'Wi-Fi router',
            dateLabel: 'May 2026',
            linkedRecords: [{ id: 'asset-router', label: 'Wi-Fi router', kind: 'asset' as const }],
            linkedRecordIds: ['asset-router'],
          },
        ],
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

  it('routes typed document quick actions and detail links', async () => {
    const { getAllByText, getByText } = await render(<DocumentsTab />);

    expect(getByText('Policies, warranties, manuals, emergency files, and general home records in one vault.')).toBeTruthy();
    expect(getByText('Prairie Mutual home policy')).toBeTruthy();

    await fireEvent.press(getByText('Save insurance policy'));
    await fireEvent.press(getAllByText('Add warranty file')[0]);
    await fireEvent.press(getByText('Prairie Mutual home policy'));
    await fireEvent.press(getByText('Share file'));

    expect(mockRouter.push).toHaveBeenNthCalledWith(1, {
      pathname: '/document/new',
      params: { type: 'insurance' },
    });
    expect(mockRouter.push).toHaveBeenNthCalledWith(2, {
      pathname: '/document/new',
      params: { type: 'warranty' },
    });
    expect(mockRouter.push).toHaveBeenNthCalledWith(3, '/document/document-1');
    expect(mockRouter.push).toHaveBeenNthCalledWith(4, {
      pathname: '/share/item',
      params: { id: 'document-1', recordType: 'document' },
    });
  });
});
