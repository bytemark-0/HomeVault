import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { AddTaskScreen } from '../../screens/AddTaskScreen';
import { sampleTasks } from '../../data/homeVaultSampleData';

const propertyId = 'prop-1';

describe('AddTaskScreen — new task', () => {
  const onCancel = jest.fn();
  const onSave = jest.fn().mockResolvedValue(undefined);

  const defaultProps = {
    propertyId,
    assets: [],
    rooms: [],
    onCancel,
    onSave,
  };

  beforeEach(() => jest.clearAllMocks());

  it('shows "New task" heading', async () => {
    const { getByText } = await render(<AddTaskScreen {...defaultProps} />);
    expect(getByText('New task')).toBeTruthy();
  });

  it('calls onCancel when cancel is pressed', async () => {
    const { getByText } = await render(<AddTaskScreen {...defaultProps} />);
    await fireEvent.press(getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onSave when title is empty', async () => {
    const { getByText } = await render(<AddTaskScreen {...defaultProps} />);
    await fireEvent.press(getByText('Save task'));
    await waitFor(() => expect(onSave).not.toHaveBeenCalled());
  });

  it('calls onSave with valid input when title and due date are provided', async () => {
    const { getAllByPlaceholderText, getByText } = await render(<AddTaskScreen {...defaultProps} />);
    // Title field has an example placeholder; due date uses today's date as placeholder.
    const [titleInput] = getAllByPlaceholderText(/Replace filter/i);
    const [dateInput] = getAllByPlaceholderText(/^\d{4}-\d{2}-\d{2}$/);
    await fireEvent.changeText(titleInput, 'Inspect fire extinguisher');
    await fireEvent.changeText(dateInput, '2026-12-01');
    await fireEvent.press(getByText('Save task'));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Inspect fire extinguisher', dueDate: '2026-12-01' }),
      ),
    );
  });
});

describe('AddTaskScreen — edit task', () => {
  const onCancel = jest.fn();
  const onSave = jest.fn().mockResolvedValue(undefined);
  const task = sampleTasks[1]; // 'Test smoke detectors'

  beforeEach(() => jest.clearAllMocks());

  it('shows "Edit task" heading', async () => {
    const { getByText } = await render(
      <AddTaskScreen propertyId={propertyId} assets={[]} rooms={[]} task={task} onCancel={onCancel} onSave={onSave} />,
    );
    expect(getByText('Edit task')).toBeTruthy();
  });

  it('pre-fills the task title', async () => {
    const { getByDisplayValue } = await render(
      <AddTaskScreen propertyId={propertyId} assets={[]} rooms={[]} task={task} onCancel={onCancel} onSave={onSave} />,
    );
    expect(getByDisplayValue('Test smoke detectors')).toBeTruthy();
  });
});
