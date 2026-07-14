import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///documents/',
  getInfoAsync: jest.fn(async () => ({ exists: false })),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockUseHomeVault = jest.fn();
const mockGetHomeVaultRepository = jest.fn();
const mockReadAnnualReviewState = jest.fn();
const mockWriteAnnualReviewState = jest.fn();

jest.mock('expo-router', () => ({
  router: mockRouter,
}));

jest.mock('../../context/HomeVaultContext', () => ({
  useHomeVault: () => mockUseHomeVault(),
}));

jest.mock('../../data/localHomeVaultRepository', () => ({
  getHomeVaultRepository: () => mockGetHomeVaultRepository(),
}));

jest.mock('../../utils/annualReviewStorage', () => ({
  readAnnualReviewState: (...args: unknown[]) => mockReadAnnualReviewState(...args),
  writeAnnualReviewState: (...args: unknown[]) => mockWriteAnnualReviewState(...args),
}));

jest.mock('../../components/SampleModeNotice', () => ({
  SampleModeNotice: () => null,
}));

jest.mock('../../screens/AnnualReviewScreen', () => ({
  AnnualReviewScreen: ({
    priorityReviewItems,
    practicePrompts: mockPracticePrompts,
    remindersEnabled,
    onToggleReminders,
    onCompleteReview,
    onOpenChecklistItem,
    onOpenPracticePrompt,
    onOpenPriorityReviewItem,
  }: {
    priorityReviewItems?: Array<{ key: string; title: string }>;
    practicePrompts?: Array<{ guideId: string; title: string; actionLabel: string }>;
    remindersEnabled: boolean;
    onToggleReminders: (enabled: boolean) => void;
    onCompleteReview: () => void;
    onOpenChecklistItem: (
      key: 'insurance' | 'access' | 'contacts' | 'devices' | 'digital_safety' | 'ownership' | 'packet'
    ) => void;
    onOpenPracticePrompt?: (guideId: string) => void;
    onOpenPriorityReviewItem?: (key: string) => void;
  }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <>
        <Text>{remindersEnabled ? 'reminders-on' : 'reminders-off'}</Text>
        {priorityReviewItems?.[0] ? <Text>{priorityReviewItems[0].title}</Text> : null}
        {mockPracticePrompts?.[0] ? <Text>{mockPracticePrompts[0].title}</Text> : null}
        <Pressable accessibilityRole="button" onPress={() => onToggleReminders(!remindersEnabled)}>
          <Text>toggle reminders</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onCompleteReview}>
          <Text>complete review</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onOpenChecklistItem('insurance')}>
          <Text>open insurance</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onOpenChecklistItem('access')}>
          <Text>open access</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onOpenChecklistItem('contacts')}>
          <Text>open contacts</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onOpenChecklistItem('devices')}>
          <Text>open devices</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onOpenChecklistItem('digital_safety')}>
          <Text>open digital safety</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onOpenChecklistItem('ownership')}>
          <Text>open ownership</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onOpenChecklistItem('packet')}>
          <Text>open packet</Text>
        </Pressable>
        {priorityReviewItems?.[0] ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpenPriorityReviewItem?.(priorityReviewItems[0].key)}
          >
            <Text>open priority review</Text>
          </Pressable>
        ) : null}
        {mockPracticePrompts?.[0] ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpenPracticePrompt?.(mockPracticePrompts[0].guideId)}
          >
            <Text>open practice prompt</Text>
          </Pressable>
        ) : null}
      </>
    );
  },
}));

const AnnualReviewRoute = require('../../../app/annual-review').default;

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
      emergencyContacts: [],
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

describe('annual review route', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((message?: unknown) => {
      if (
        typeof message === 'string' &&
        message.includes('overlapping act() calls')
      ) {
        return;
      }
    });
    mockReadAnnualReviewState.mockResolvedValue({
      lastCompletedAt: null,
      remindersEnabled: false,
    });
    mockWriteAnnualReviewState.mockResolvedValue(undefined);
    mockUseHomeVault.mockReturnValue(buildHomeVaultContext());
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.useRealTimers();
  });

  it('creates the yearly reminder task when reminders are enabled from the review flow', async () => {
    const context = buildHomeVaultContext();
    const repo = {
      createTask: jest.fn().mockResolvedValue(undefined),
    };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);

    const { findByText, getByText } = await render(<AnnualReviewRoute />);
    await findByText('reminders-off');

    await act(async () => {
      fireEvent.press(getByText('toggle reminders'));
    });

    await waitFor(() =>
      expect(repo.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'annual-review-property-1',
          title: 'Run annual household review',
          recurrenceLabel: 'Yearly',
        }),
      ),
    );
    expect(mockWriteAnnualReviewState).toHaveBeenCalledWith('property-1', {
      lastCompletedAt: null,
      remindersEnabled: true,
    });
    expect(context.reload).toHaveBeenCalledTimes(1);
    expect(context.showToast).toHaveBeenCalledWith('Yearly annual review reminder scheduled');
  });

  it('records completion and reschedules the next review when reminders are enabled', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-08T12:00:00.000Z'));

    const context = buildHomeVaultContext();
    const repo = {
      createTask: jest.fn().mockResolvedValue({
        id: 'annual-review-property-1',
        propertyId: 'property-1',
        scope: 'property',
        scopeId: 'property-1',
        title: 'Run annual household review',
        dueDate: '2026-07-08',
        recurrenceKind: 'interval',
        recurrenceLabel: 'Yearly',
        state: 'due_today',
        instructions: 'Review the continuity records.',
      }),
      completeTask: jest.fn().mockResolvedValue(undefined),
      updateTask: jest.fn().mockResolvedValue(undefined),
    };
    mockUseHomeVault.mockReturnValue(context);
    mockGetHomeVaultRepository.mockResolvedValue(repo);
    mockReadAnnualReviewState.mockResolvedValue({
      lastCompletedAt: '2025-07-08T12:00:00.000Z',
      remindersEnabled: true,
    });

    const { getByText } = await render(<AnnualReviewRoute />);
    await waitFor(() => expect(getByText('reminders-on')).toBeTruthy());

    await act(async () => {
      fireEvent.press(getByText('complete review'));
    });

    await waitFor(() => expect(repo.completeTask).toHaveBeenCalled());
    expect(repo.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        dueDate: '2026-07-08',
        state: 'due_today',
      }),
    );
    expect(repo.updateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'annual-review-property-1',
        recurrenceLabel: 'Yearly',
      }),
    );
    expect(mockWriteAnnualReviewState).toHaveBeenCalledWith('property-1', {
      lastCompletedAt: '2026-07-08T12:00:00.000Z',
      remindersEnabled: true,
    });
    expect(context.showToast).toHaveBeenCalledWith(
      'Annual review completed — next reminder scheduled',
    );
  });

  it('routes annual-review checklist items to fallback setup areas when records are missing', async () => {
    const screen = await render(<AnnualReviewRoute />);
    await waitFor(() => expect(screen.getByText('open insurance')).toBeTruthy());

    fireEvent.press(screen.getByText('open insurance'));
    fireEvent.press(screen.getByText('open access'));
    fireEvent.press(screen.getByText('open contacts'));
    fireEvent.press(screen.getByText('open devices'));
    fireEvent.press(screen.getByText('open digital safety'));
    fireEvent.press(screen.getByText('open ownership'));
    fireEvent.press(screen.getByText('open packet'));

    expect(mockRouter.push).toHaveBeenNthCalledWith(1, {
      pathname: '/account/new',
      params: { kind: 'insurance' },
    });
    expect(mockRouter.push).toHaveBeenNthCalledWith(2, '/(tabs)/access');
    expect(mockRouter.push).toHaveBeenNthCalledWith(3, '/contact');
    expect(mockRouter.push).toHaveBeenNthCalledWith(4, '/(tabs)/devices');
    expect(mockRouter.push).toHaveBeenNthCalledWith(5, '/(tabs)/emergency');
    expect(mockRouter.push).toHaveBeenNthCalledWith(6, '/(tabs)/emergency');
    expect(mockRouter.push).toHaveBeenNthCalledWith(7, '/export');
  });
});
