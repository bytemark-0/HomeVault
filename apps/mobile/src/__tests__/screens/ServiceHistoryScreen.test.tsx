import { fireEvent, render } from '@testing-library/react-native';

import { ServiceHistoryScreen } from '../../screens/ServiceHistoryScreen';

describe('ServiceHistoryScreen', () => {
  it('shows a helpful empty state when no service history exists', async () => {
    const { getByText } = await render(
      <ServiceHistoryScreen
        repairEvents={[]}
        taskCompletions={[]}
        tasks={[]}
        assets={[]}
        onBack={jest.fn()}
        onAssetPress={jest.fn()}
      />,
    );

    expect(getByText('No service history')).toBeTruthy();
    expect(
      getByText('Complete a task or record a repair from Maintenance to build service history.'),
    ).toBeTruthy();
  });

  it('renders consistent whole-dollar costs for repairs and maintenance', async () => {
    const onAssetPress = jest.fn();
    const { getByText } = await render(
      <ServiceHistoryScreen
        repairEvents={[
          {
            id: 'repair-1',
            propertyId: 'property-1',
            assetId: 'asset-1',
            issue: 'Drain pump jam',
            date: '2026-06-04',
            dateLabel: 'Jun 4, 2026',
            costCents: 14900,
            costLabel: '$149',
            summaryLabel: 'Provider · $149',
            documentIds: [],
          },
        ]}
        taskCompletions={[
          {
            id: 'completion-1',
            taskId: 'task-1',
            completedAt: '2026-06-02T12:00:00.000Z',
            completedAtLabel: 'Jun 2, 2026',
            costCents: 1500,
            costLabel: '$15',
          },
        ]}
        tasks={[
          {
            id: 'task-1',
            propertyId: 'property-1',
            scope: 'asset',
            scopeId: 'asset-1',
            title: 'Replace filter',
            dueDate: '2026-06-23',
            recurrenceKind: 'interval',
            recurrenceLabel: 'Monthly',
            state: 'completed',
            scopeLabel: 'Air handler',
            dueLabel: 'Completed',
          },
        ]}
        assets={[
          {
            id: 'asset-1',
            propertyId: 'property-1',
            name: 'Air handler',
            category: 'Heating & cooling',
            status: 'ready',
            roomName: 'Utility',
            documentCount: 0,
            lastServiceLabel: 'Jun 4, 2026',
            nextTaskLabel: 'No open tasks',
            warrantyExpiringSoon: false,
          },
        ]}
        onBack={jest.fn()}
        onAssetPress={onAssetPress}
      />,
    );

    expect(getByText('Air handler · $149')).toBeTruthy();
    expect(getByText('Air handler · $15')).toBeTruthy();

    await fireEvent.press(getByText('Drain pump jam'));
    expect(onAssetPress).toHaveBeenCalledWith('asset-1');
  });
});
