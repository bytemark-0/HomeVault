import { fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { TaskDetailScreen } from '../../screens/TaskDetailScreen';
import { sampleTasks } from '../../data/homeVaultSampleData';

jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
  // Auto-confirm destructive alerts in tests.
  const confirmButton = buttons?.find((b) => b.style === 'destructive');
  if (confirmButton?.onPress) confirmButton.onPress();
});

const task = sampleTasks[0]; // 'Replace HVAC filter', state: 'overdue'

describe('TaskDetailScreen', () => {
  const onBack = jest.fn();
  const onComplete = jest.fn();
  const onDelete = jest.fn().mockResolvedValue(undefined);
  const onSkip = jest.fn();
  const onSnooze = jest.fn();
  const onEdit = jest.fn();
  const onEditCompletion = jest.fn();
  const onDeleteCompletion = jest.fn().mockResolvedValue(undefined);

  const defaultProps = {
    task,
    completions: [],
    onBack,
    onComplete,
    onDelete,
    onSkip,
    onSnooze,
    onEdit,
    onEditCompletion,
    onDeleteCompletion,
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders the task title', async () => {
    const { getByText } = await render(<TaskDetailScreen {...defaultProps} />);
    expect(getByText('Replace HVAC filter')).toBeTruthy();
  });

  it('calls onBack when back button is pressed', async () => {
    const { getByText } = await render(<TaskDetailScreen {...defaultProps} />);
    await fireEvent.press(getByText('Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete with task id when complete is pressed', async () => {
    const { getByText } = await render(<TaskDetailScreen {...defaultProps} />);
    await fireEvent.press(getByText('Complete'));
    expect(onComplete).toHaveBeenCalledWith(task.id);
  });

  it('calls onEdit when edit is pressed', async () => {
    const { getByText } = await render(<TaskDetailScreen {...defaultProps} />);
    await fireEvent.press(getByText('Edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete after confirming destructive alert', async () => {
    const { getByText } = await render(<TaskDetailScreen {...defaultProps} />);
    await fireEvent.press(getByText('Delete'));
    expect(Alert.alert).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('shows recurrence label', async () => {
    const { getByText } = await render(<TaskDetailScreen {...defaultProps} />);
    expect(getByText(/Every 90 days/i)).toBeTruthy();
  });
});
