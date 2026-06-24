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
    healthScore: null,
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
    onViewInventory: jest.fn(),
    onViewMaintenance: jest.fn(),
    onViewServiceHistory: jest.fn(),
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
        key: 'add-asset',
        label: 'Add asset',
        detail: 'Appliance, system, or tool',
        onPress: onAddAsset,
        tone: 'primary' as const,
      },
      {
        key: 'add-task',
        label: 'Add task',
        detail: 'Set a reminder',
        onPress: onAddTask,
      },
      {
        key: 'add-document',
        label: 'Add document',
        detail: 'Warranty, receipt, or manual',
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
    expect(getByText('Start building your home record')).toBeTruthy();
    expect(getByText('In progress')).toBeTruthy();
    expect(getByText('Nothing yet')).toBeTruthy();
    expect(getByText('Not started')).toBeTruthy();
    expect(getByText('Quick actions')).toBeTruthy();
    expect(getByText('Add asset')).toBeTruthy();
    expect(getByText('Add task')).toBeTruthy();
    expect(getByText('Add document')).toBeTruthy();

    expect(queryByText('Tracked costs')).toBeNull();
    expect(getByText('No urgent tasks')).toBeTruthy();
    expect(getByText('No activity yet')).toBeTruthy();
    expect(getByText('No asset records yet')).toBeTruthy();
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

    expect(getByText('1 task needs attention')).toBeTruthy();
    expect(getByText('2 of 6 starter steps done.')).toBeTruthy();
    expect(getByText('1 open')).toBeTruthy();
    expect(getByText('1 updates')).toBeTruthy();
  });

  it('shows summary metrics and routes section actions for an established vault', async () => {
    const onViewMaintenance = jest.fn();
    const onViewInventory = jest.fn();
    const onViewServiceHistory = jest.fn();
    const onViewCostSummary = jest.fn();
    const { getAllByText, getByText } = await render(
      <HomeScreen
        {...baseProps}
        activeTasks={2}
        assetCount={4}
        documentCount={3}
        roomCount={5}
        healthScore={87}
        savedCostLabel="$412"
        onViewMaintenance={onViewMaintenance}
        onViewInventory={onViewInventory}
        onViewServiceHistory={onViewServiceHistory}
        onViewCostSummary={onViewCostSummary}
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

    expect(getByText('2 tasks need attention')).toBeTruthy();
    expect(getByText('Complete')).toBeTruthy();
    expect(getByText('Ready')).toBeTruthy();
    expect(getByText('Assets')).toBeTruthy();
    expect(getByText('Documents')).toBeTruthy();
    expect(getByText('Open tasks')).toBeTruthy();
    expect(getByText('Tracked costs')).toBeTruthy();

    const [dueNowAction, recentActivityAction] = getAllByText('View all');

    if (!dueNowAction || !recentActivityAction) {
      throw new Error('Expected the Home screen to render both View all actions.');
    }

    fireEvent.press(dueNowAction);
    expect(onViewMaintenance).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Search'));
    expect(onViewInventory).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Tracked costs'));
    expect(onViewCostSummary).toHaveBeenCalledTimes(1);

    fireEvent.press(recentActivityAction);
    expect(onViewServiceHistory).toHaveBeenCalledTimes(1);
  });
});
