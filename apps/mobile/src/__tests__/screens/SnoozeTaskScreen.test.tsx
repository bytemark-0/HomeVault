import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { SnoozeTaskScreen } from '../../screens/SnoozeTaskScreen';
import type { TaskListItem } from '../../data/homeVaultSampleData';

describe('SnoozeTaskScreen', () => {
  const task: TaskListItem = {
    id: 'task-1',
    propertyId: 'property-1',
    scope: 'asset',
    scopeId: 'asset-1',
    title: 'Replace filter',
    dueDate: '2026-07-01',
    dueLabel: 'Jul 1',
    recurrenceKind: 'interval',
    recurrenceLabel: 'Every 90 days',
    state: 'upcoming',
    scopeLabel: 'Dishwasher',
  };

  it('shows a validation error for an invalid custom snooze date', async () => {
    const { getAllByText, getByPlaceholderText, getByText } = await render(
      <SnoozeTaskScreen task={task} onCancel={jest.fn()} onSave={jest.fn()} />,
    );

    await fireEvent.press(getByText('Pick date'));
    await fireEvent.changeText(getByPlaceholderText('2026-09-01'), '2026-99-99');
    await fireEvent.press(getAllByText('Snooze task')[1]!);

    expect(getByText('Use YYYY-MM-DD.')).toBeTruthy();
  });

  it('saves a valid custom snooze date', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getAllByText, getByPlaceholderText, getByText } = await render(
      <SnoozeTaskScreen task={task} onCancel={jest.fn()} onSave={onSave} />,
    );

    await fireEvent.press(getByText('Pick date'));
    await fireEvent.changeText(getByPlaceholderText('2026-09-01'), '2026-09-01');
    await fireEvent.press(getAllByText('Snooze task')[1]!);

    await waitFor(() => expect(onSave).toHaveBeenCalledWith('task-1', '2026-09-01'));
  });
});
