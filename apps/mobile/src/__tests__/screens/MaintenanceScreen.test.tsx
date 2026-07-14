import { fireEvent, render } from '@testing-library/react-native';

import { MaintenanceScreen } from '../../screens/MaintenanceScreen';

describe('MaintenanceScreen', () => {
  it('shows the no-tasks empty state and calls new task', async () => {
    const onAddTask = jest.fn();
    const { getByText } = await render(
      <MaintenanceScreen
        tasks={[]}
        onAddTask={onAddTask}
        onCompleteTask={jest.fn()}
        onRecordRepair={jest.fn()}
        onSnoozeTask={jest.fn()}
        onTaskPress={jest.fn()}
      />,
    );

    expect(getByText('Save the first readiness reminder')).toBeTruthy();
    await fireEvent.press(getByText('Add reminder'));
    expect(onAddTask).toHaveBeenCalledTimes(1);
  });

  it('filters tasks by state and highlights snoozed-task guidance', async () => {
    const { getByText, queryByText } = await render(
      <MaintenanceScreen
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
            state: 'due_today',
            scopeLabel: 'Air handler',
            dueLabel: 'Today',
          },
          {
            id: 'task-2',
            propertyId: 'property-1',
            scope: 'property',
            scopeId: 'property-1',
            title: 'Check shutoffs',
            dueDate: '2026-07-01',
            recurrenceKind: 'one_time',
            recurrenceLabel: 'One time',
            state: 'snoozed',
            scopeLabel: 'Whole home',
            dueLabel: 'Snoozed to Jul 1, 2026',
          },
        ]}
        onAddTask={jest.fn()}
        onCompleteTask={jest.fn()}
        onRecordRepair={jest.fn()}
        onSnoozeTask={jest.fn()}
        onTaskPress={jest.fn()}
      />,
    );

    expect(getByText('Snoozed tasks are still visible')).toBeTruthy();
    expect(getByText(/asks for notification permission only/)).toBeTruthy();

    await fireEvent.press(getByText('Snoozed'));

    expect(getByText('Check shutoffs')).toBeTruthy();
    expect(getByText('Snoozed to Jul 1, 2026')).toBeTruthy();
    expect(queryByText('No tasks found')).toBeNull();
  });
});
