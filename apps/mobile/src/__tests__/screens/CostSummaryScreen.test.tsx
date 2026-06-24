import { render } from '@testing-library/react-native';

import { CostSummaryScreen } from '../../screens/CostSummaryScreen';

describe('CostSummaryScreen', () => {
  it('shows a helpful empty state with no tracked costs', async () => {
    const { getByText } = await render(
      <CostSummaryScreen
        repairEvents={[]}
        taskCompletions={[]}
        tasks={[]}
        assets={[]}
        rooms={[]}
        onBack={jest.fn()}
      />,
    );

    expect(getByText('No cost data')).toBeTruthy();
    expect(
      getByText('Record costs when completing tasks or logging repairs to see a breakdown here.'),
    ).toBeTruthy();
  });

  it('uses the same currency formatting as detail views', async () => {
    const { getAllByText, getByText } = await render(
      <CostSummaryScreen
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
            scopeId: 'asset-2',
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
            roomId: 'room-1',
            name: 'Air handler',
            category: 'Heating & cooling',
            status: 'ready',
            roomName: 'Utility',
            documentCount: 0,
            lastServiceLabel: 'Jun 4, 2026',
            nextTaskLabel: 'No open tasks',
            warrantyExpiringSoon: false,
          },
          {
            id: 'asset-2',
            propertyId: 'property-1',
            roomId: 'room-1',
            name: 'Water softener',
            category: 'Plumbing',
            status: 'ready',
            roomName: 'Utility',
            documentCount: 0,
            lastServiceLabel: 'Jun 2, 2026',
            nextTaskLabel: 'No open tasks',
            warrantyExpiringSoon: false,
          },
        ]}
        rooms={[
          {
            id: 'room-1',
            propertyId: 'property-1',
            name: 'Utility',
            type: 'room',
            assetCount: 1,
            activeTaskCount: 0,
            attentionCount: 0,
          },
        ]}
        onBack={jest.fn()}
      />,
    );

    expect(getByText('Total tracked')).toBeTruthy();
    expect(getAllByText('$164').length).toBeGreaterThan(0);
    expect(getByText('By year')).toBeTruthy();
  });
});
