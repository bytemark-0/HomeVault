import { fireEvent, render, waitFor } from '@testing-library/react-native';

import type {
  CreateEmergencyContactInput,
  UpdateEmergencyContactInput,
} from '@homevault/database';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockUseLocalSearchParams = jest.fn();
const mockUseHomeVault = jest.fn();
const mockGetHomeVaultRepository = jest.fn();
let mockContactSaveInput: CreateEmergencyContactInput | UpdateEmergencyContactInput = {
  propertyId: 'property-1',
  priority: 'primary',
  name: 'Jamie Lee',
  role: 'Neighbor with spare key',
  phone: '555-0101',
};

jest.mock('expo-router', () => ({
  router: mockRouter,
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock('../../context/HomeVaultContext', () => ({
  useHomeVault: () => mockUseHomeVault(),
}));

jest.mock('../../data/localHomeVaultRepository', () => ({
  getHomeVaultRepository: () => mockGetHomeVaultRepository(),
}));

jest.mock('../../screens/AddEmergencyContactScreen', () => ({
  AddEmergencyContactScreen: ({
    onCancel,
    onSave,
  }: {
    onCancel: () => void;
    onSave: (
      input: CreateEmergencyContactInput | UpdateEmergencyContactInput,
    ) => Promise<void>;
  }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <>
        <Pressable accessibilityRole="button" onPress={() => void onSave(mockContactSaveInput)}>
          <Text>trigger save</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onCancel}>
          <Text>trigger cancel</Text>
        </Pressable>
      </>
    );
  },
}));

jest.mock('../../screens/EmergencyContactDetailScreen', () => ({
  EmergencyContactDetailScreen: ({
    onBack,
    onDelete,
    onMarkReviewed,
    onShare,
  }: {
    onBack: () => void;
    onDelete: () => Promise<void>;
    onMarkReviewed: () => void;
    onShare: () => void;
  }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <>
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Text>trigger back</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => void onDelete()}>
          <Text>trigger delete</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onMarkReviewed}>
          <Text>trigger review</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onShare}>
          <Text>trigger share</Text>
        </Pressable>
      </>
    );
  },
}));

jest.mock('../../components/MissingRecordView', () => ({
  MissingRecordView: ({
    actionLabel,
    onActionPress,
  }: {
    actionLabel: string;
    onActionPress: () => void;
  }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <Pressable accessibilityRole="button" onPress={onActionPress}>
        <Text>{actionLabel}</Text>
      </Pressable>
    );
  },
}));

const ContactDetailRoute = require('../../../app/contact/[id]').default;
const EditContactRoute = require('../../../app/contact/[id]/edit').default;
const NewContactRoute = require('../../../app/contact/new').default;

function buildHomeVaultContext() {
  return {
    appData: {
      property: {
        id: 'property-1',
        householdId: 'household-1',
        label: 'Home',
        type: 'single_family' as const,
      },
      rooms: [],
      assets: [],
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
      assetCount: 0,
      roomCount: 0,
      documentCount: 0,
      activeTaskCount: 0,
      healthScore: null,
      dueTasks: [],
      recentAssets: [],
      recentActivity: [],
      savedCostLabel: '$0',
    },
    reload: jest.fn().mockResolvedValue(undefined),
    showToast: jest.fn(),
  };
}

describe('emergency contact routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ id: 'contact-1', priority: 'primary' });
    mockUseHomeVault.mockReturnValue(buildHomeVaultContext());
    mockRouter.canGoBack.mockReturnValue(false);
    mockContactSaveInput = {
      propertyId: 'property-1',
      priority: 'primary',
      name: 'Jamie Lee',
      role: 'Neighbor with spare key',
      phone: '555-0101',
    };
  });

  it('falls back to the new contact detail screen after create when there is no history', async () => {
    const context = buildHomeVaultContext();
    const repo = {
      createEmergencyContact: jest.fn().mockResolvedValue({ id: 'contact-new' }),
    };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { getByText } = await render(<NewContactRoute />);
    fireEvent.press(getByText('trigger save'));

    await waitFor(() => expect(repo.createEmergencyContact).toHaveBeenCalled());
    expect(context.reload).toHaveBeenCalledTimes(1);
    expect(context.showToast).toHaveBeenCalledWith('Emergency contact saved');
    expect(mockRouter.replace).toHaveBeenCalledWith('/contact/contact-new');
  });

  it('shows a recovery view when the contact detail route is stale', async () => {
    const context = buildHomeVaultContext();
    context.appData.emergencyContacts = [];
    mockUseHomeVault.mockReturnValue(context);

    const { getByText } = await render(<ContactDetailRoute />);
    fireEvent.press(getByText('Back to contacts'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/contact');
  });

  it('falls back to the contact detail screen after edit when there is no history', async () => {
    const context = buildHomeVaultContext();
    const repo = { updateEmergencyContact: jest.fn().mockResolvedValue({ id: 'contact-1' }) };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);
    mockContactSaveInput = {
      id: 'contact-1',
      propertyId: 'property-1',
      priority: 'secondary',
      name: 'Jamie Lee',
      role: 'Backup neighbor',
      phone: '555-0199',
    };

    const { getByText } = await render(<EditContactRoute />);
    fireEvent.press(getByText('trigger save'));

    await waitFor(() => expect(repo.updateEmergencyContact).toHaveBeenCalled());
    expect(context.showToast).toHaveBeenCalledWith('Emergency contact updated');
    expect(mockRouter.replace).toHaveBeenCalledWith('/contact/contact-1');
  });

  it('deletes the contact and returns to the contacts list', async () => {
    const context = buildHomeVaultContext();
    const repo = { deleteEmergencyContact: jest.fn().mockResolvedValue(undefined) };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { getByText } = await render(<ContactDetailRoute />);
    fireEvent.press(getByText('trigger delete'));

    await waitFor(() => expect(repo.deleteEmergencyContact).toHaveBeenCalledWith('contact-1'));
    expect(context.showToast).toHaveBeenCalledWith('Emergency contact deleted', 'error');
    expect(mockRouter.replace).toHaveBeenCalledWith('/contact');
  });

  it('opens the encrypted item-share flow from contact detail', async () => {
    const { getByText } = await render(<ContactDetailRoute />);

    fireEvent.press(getByText('trigger share'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/share/item',
      params: { id: 'contact-1', recordType: 'emergency_contact' },
    });
  });

  it('marks emergency contacts reviewed from the detail route', async () => {
    const context = buildHomeVaultContext();
    const repo = { updateEmergencyContact: jest.fn().mockResolvedValue({ id: 'contact-1' }) };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { getByText } = await render(<ContactDetailRoute />);
    fireEvent.press(getByText('trigger review'));

    await waitFor(() =>
      expect(repo.updateEmergencyContact).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'contact-1',
          lastReviewedAt: expect.any(String),
        }),
      ),
    );
    expect(context.showToast).toHaveBeenCalledWith('Emergency contact review updated');
  });
});
