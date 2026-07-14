import { fireEvent, render } from '@testing-library/react-native';

const mockUseHomeVault = jest.fn();
const mockNavigateBackOrReplace = jest.fn();
const mockCareCardsScreen = jest.fn();

jest.mock('../../context/HomeVaultContext', () => ({
  useHomeVault: () => mockUseHomeVault(),
}));

jest.mock('../../utils/navigation', () => ({
  navigateBackOrReplace: (...args: unknown[]) => mockNavigateBackOrReplace(...args),
}));

jest.mock('../../components/MissingRecordView', () => ({
  MissingRecordView: ({
    actionLabel,
    onActionPress,
    title,
  }: {
    actionLabel: string;
    onActionPress: () => void;
    title: string;
  }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <>
        <Text>{title}</Text>
        <Pressable accessibilityRole="button" onPress={onActionPress}>
          <Text>{actionLabel}</Text>
        </Pressable>
      </>
    );
  },
}));

jest.mock('../../screens/CareCardsScreen', () => ({
  CareCardsScreen: (props: unknown) => {
    mockCareCardsScreen(props);
    const { Pressable, Text } = require('react-native');
    const {
      onBack,
      onShared,
      property,
    } = props as {
      onBack: () => void;
      onShared: (message: string) => void;
      property: { label: string };
    };

    return (
      <>
        <Text>{property.label}</Text>
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Text>Back</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onShared('Caregiver plan shared.')}
        >
          <Text>share callback</Text>
        </Pressable>
      </>
    );
  },
}));

const CareCardsRoute = require('../../../app/share/care-cards').default;

function buildHomeVaultContext() {
  return {
    appData: {
      property: {
        id: 'property-1',
        householdId: 'household-1',
        label: 'Oak Street home',
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
          role: 'Neighbor',
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
    showToast: jest.fn(),
  };
}

describe('CareCardsRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHomeVault.mockReturnValue(buildHomeVaultContext());
  });

  it('passes household data into the care-card screen and forwards shared messages to toast', async () => {
    const context = buildHomeVaultContext();
    mockUseHomeVault.mockReturnValue(context);

    const { getByText } = await render(<CareCardsRoute />);

    expect(getByText('Oak Street home')).toBeTruthy();
    expect(mockCareCardsScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        emergencyContacts: expect.arrayContaining([
          expect.objectContaining({ name: 'Jamie Lee' }),
        ]),
        property: expect.objectContaining({ label: 'Oak Street home' }),
      }),
    );

    fireEvent.press(getByText('share callback'));

    expect(context.showToast).toHaveBeenCalledWith('Caregiver plan shared.');
  });

  it('lets the screen back action return to the share hub', async () => {
    const { getByText } = await render(<CareCardsRoute />);

    fireEvent.press(getByText('Back'));

    expect(mockNavigateBackOrReplace).toHaveBeenCalledWith('/share');
  });

  it('falls back cleanly when no household is loaded', async () => {
    mockUseHomeVault.mockReturnValue({
      appData: null,
      showToast: jest.fn(),
    });

    const { getByText } = await render(<CareCardsRoute />);

    expect(getByText('Care-card details unavailable')).toBeTruthy();

    fireEvent.press(getByText('Go back'));

    expect(mockNavigateBackOrReplace).toHaveBeenCalledWith('/share');
  });
});
