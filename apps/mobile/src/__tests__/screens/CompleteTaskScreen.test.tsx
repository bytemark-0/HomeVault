import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { CompleteTaskScreen } from '../../screens/CompleteTaskScreen';
import type { TaskListItem } from '../../data/homeVaultSampleData';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///documents/',
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('CompleteTaskScreen', () => {
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

  it('requires a completed date before saving', async () => {
    const onSave = jest.fn();
    const { getByPlaceholderText, getByText } = await render(
      <CompleteTaskScreen task={task} onCancel={jest.fn()} onSave={onSave} />,
    );

    await fireEvent.changeText(getByPlaceholderText('2026-06-12'), '');
    await fireEvent.press(getByText('Save completion'));

    expect(getByText('Completed date is required.')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves a completion payload', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getByPlaceholderText, getByText } = await render(
      <CompleteTaskScreen task={task} onCancel={jest.fn()} onSave={onSave} />,
    );

    await fireEvent.changeText(getByPlaceholderText('2026-06-12'), '2026-06-12');
    await fireEvent.changeText(getByPlaceholderText('49.99'), '49.99');
    await fireEvent.changeText(getByPlaceholderText('What was done, parts used, condition found'), ' Filter replaced ');
    await fireEvent.press(getByText('Save completion'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        taskId: 'task-1',
        completedAt: expect.stringContaining('2026-06-12'),
        costCents: 4999,
        notes: 'Filter replaced',
        photoUri: undefined,
      }),
    );
  });
});
