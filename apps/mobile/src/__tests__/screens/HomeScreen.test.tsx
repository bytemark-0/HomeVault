import { fireEvent, render } from '@testing-library/react-native';

import { HomeScreen } from '../../screens/HomeScreen';

describe('HomeScreen', () => {
  const onAddAsset = jest.fn();
  const onAddTask = jest.fn();
  const onAddDocument = jest.fn();

  const baseProps = {
    propertyLabel: 'Oak Street home',
    propertyPhotoUri: undefined,
    activeTasks: 0,
    assetCount: 0,
    documentCount: 0,
    readinessScore: null,
    recentActivity: [],
    roomCount: 0,
    savedCostLabel: '$0',
    dueTasks: [],
    warrantyAlerts: [],
    recentAssets: [],
    onActivityPress: jest.fn(),
    onAssetPress: jest.fn(),
    onTaskPress: jest.fn(),
    onViewCostSummary: jest.fn(),
    onViewDevices: jest.fn(),
    onViewMaintenance: jest.fn(),
    onViewServiceHistory: jest.fn(),
    nextOpportunity: null,
    statusCards: [
      {
        key: 'setup',
        label: 'Setup',
        value: 'In progress',
        detail: '0 of 6 starter steps done.',
      },
      {
        key: 'tasks',
        label: 'Due now',
        value: 'All clear',
        detail: 'No urgent maintenance reminders.',
      },
      {
        key: 'recent',
        label: 'Recent records',
        value: 'Nothing yet',
        detail: 'New records will appear here as you build your vault.',
      },
      {
        key: 'backup',
        label: 'Backup',
        value: 'Not started',
        detail: 'Create a backup after your first records.',
      },
    ],
    quickActions: [
      {
        key: 'open-access',
        label: 'Access details',
        detail: 'Wi-Fi, codes, and shutoff notes',
        onPress: onAddAsset,
        tone: 'primary' as const,
      },
      {
        key: 'open-emergency',
        label: 'Emergency contacts',
        detail: 'Who to call and what to export',
        onPress: onAddTask,
      },
      {
        key: 'add-device',
        label: 'Add device',
        detail: 'Router, system, or appliance',
        onPress: onAddDocument,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the property header, summary guidance, and quick actions for a new vault', async () => {
    const { getByText, queryByText } = await render(<HomeScreen {...baseProps} />);

    expect(getByText('Oak Street home')).toBeTruthy();
    expect(getByText('Start building the household guide')).toBeTruthy();
    expect(getByText('In progress')).toBeTruthy();
    expect(getByText('Nothing yet')).toBeTruthy();
    expect(getByText('Not started')).toBeTruthy();
    expect(getByText('Build readiness')).toBeTruthy();
    expect(getByText('Access details')).toBeTruthy();
    expect(getByText('Emergency contacts')).toBeTruthy();
    expect(getByText('Add device')).toBeTruthy();

    expect(queryByText('Tracked costs')).toBeNull();
    expect(getByText('No urgent readiness steps')).toBeTruthy();
    expect(getByText('No activity yet')).toBeTruthy();
    expect(getByText('No critical equipment saved yet')).toBeTruthy();
  });

  it('shows a partial-account summary state when setup is still underway', async () => {
    const { getByText } = await render(
      <HomeScreen
        {...baseProps}
        activeTasks={1}
        assetCount={1}
        roomCount={1}
        statusCards={[
          {
            key: 'setup',
            label: 'Setup',
            value: 'In progress',
            detail: '2 of 6 starter steps done.',
          },
          {
            key: 'tasks',
            label: 'Due now',
            value: '1 open',
            detail: '1 task needs attention.',
            tone: 'warning',
          },
          {
            key: 'recent',
            label: 'Recent records',
            value: '1 updates',
            detail: 'Latest documents, repairs, and completions are ready to review.',
            tone: 'success',
          },
          {
            key: 'backup',
            label: 'Backup',
            value: 'Not started',
            detail: 'Create a backup after your first records.',
          },
        ]}
      />,
    );

    expect(getByText('1 readiness step needs attention')).toBeTruthy();
    expect(getByText('2 of 6 starter steps done.')).toBeTruthy();
    expect(getByText('1 open')).toBeTruthy();
    expect(getByText('1 updates')).toBeTruthy();
  });

  it('shows summary metrics and routes section actions for an established vault', async () => {
    const onViewMaintenance = jest.fn();
    const onViewDevices = jest.fn();
    const onViewServiceHistory = jest.fn();
    const onViewCostSummary = jest.fn();
    const { getAllByText, getByText } = await render(
      <HomeScreen
        {...baseProps}
        activeTasks={2}
        assetCount={4}
        documentCount={3}
        roomCount={5}
        readinessScore={87}
        savedCostLabel="$412"
        onViewMaintenance={onViewMaintenance}
        onViewDevices={onViewDevices}
        onViewServiceHistory={onViewServiceHistory}
        onViewCostSummary={onViewCostSummary}
        nextOpportunity={{
          label: 'Add an emergency contact',
          detail: 'Keep one trusted person listed before you need them.',
          impactLabel: '+12 pts',
          onPress: jest.fn(),
        }}
        payoffCards={[
          {
            key: 'break-fix-ready',
            label: 'When Something Breaks',
            value: '2 assets documented',
            detail: 'Manuals, receipts, and warranties are already tied to the right equipment.',
            tone: 'success',
          },
          {
            key: 'maintenance-memory',
            label: 'Work You Won’t Forget',
            value: '3 reminders scheduled',
            detail: 'Recurring work no longer has to live in your head.',
            tone: 'success',
          },
          {
            key: 'service-history',
            label: 'History You Can Prove',
            value: '$412',
            detail: 'Repair and maintenance costs are starting to add up in one timeline.',
            tone: 'success',
          },
        ]}
        statusCards={[
          {
            key: 'setup',
            label: 'Setup',
            value: 'Complete',
            detail: 'All starter steps are done.',
            tone: 'success',
          },
          {
            key: 'tasks',
            label: 'Due now',
            value: '2 open',
            detail: '2 tasks need attention.',
            tone: 'warning',
          },
          {
            key: 'recent',
            label: 'Recent records',
            value: '3 updates',
            detail: 'Latest documents, repairs, and completions are ready to review.',
            tone: 'success',
          },
          {
            key: 'backup',
            label: 'Backup',
            value: 'Ready',
            detail: 'Last updated Jun 23, 2026.',
            tone: 'success',
          },
        ]}
      />,
    );

    expect(getByText('2 readiness steps need attention')).toBeTruthy();
    expect(getByText('Complete')).toBeTruthy();
    expect(getAllByText('Ready').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Next best step')).toBeTruthy();
    expect(getByText('Add an emergency contact')).toBeTruthy();
    expect(getByText('What this already protects')).toBeTruthy();
    expect(getByText('When Something Breaks')).toBeTruthy();
    expect(getByText('3 reminders scheduled')).toBeTruthy();
    expect(getByText('History You Can Prove')).toBeTruthy();
    expect(getByText('Devices')).toBeTruthy();
    expect(getByText('Records')).toBeTruthy();
    expect(getByText('Open steps')).toBeTruthy();
    expect(getByText('Tracked costs')).toBeTruthy();

    const [dueNowAction, recentActivityAction] = getAllByText('View all');

    if (!dueNowAction || !recentActivityAction) {
      throw new Error('Expected the Home screen to render both View all actions.');
    }

    fireEvent.press(dueNowAction);
    expect(onViewMaintenance).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Search'));
    expect(onViewDevices).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Tracked costs'));
    expect(onViewCostSummary).toHaveBeenCalledTimes(1);

    fireEvent.press(recentActivityAction);
    expect(onViewServiceHistory).toHaveBeenCalledTimes(1);
  });
});
