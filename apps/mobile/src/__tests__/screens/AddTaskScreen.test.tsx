import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

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

  it('creates a recurring task with the selected repeat cadence', async () => {
    const { getAllByPlaceholderText, getByText } = await render(<AddTaskScreen {...defaultProps} />);
    const [titleInput] = getAllByPlaceholderText(/Replace filter/i);
    const [dateInput] = getAllByPlaceholderText(/^\d{4}-\d{2}-\d{2}$/);

    await fireEvent.changeText(titleInput, 'Flush water heater');
    await fireEvent.changeText(dateInput, '2026-12-15');
    await fireEvent.press(getByText('Yearly'));
    await fireEvent.press(getByText('Save task'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Flush water heater',
          dueDate: '2026-12-15',
          recurrenceKind: 'interval',
          recurrenceLabel: 'Yearly',
        }),
      ),
    );

    expect(
      getByText('Best for annual inspections, flushing, and warranty checkups.'),
    ).toBeTruthy();
    expect(
      getByText(
        'HomeVault can ask for notification permission after you save a dated task. You can decline and still track the task normally.',
      ),
    ).toBeTruthy();
  });

  it('prevents duplicate submissions while saving', async () => {
    let resolveSave: (() => void) | null = null;
    const pendingSave = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );
    const { getAllByPlaceholderText, getByText } = await render(
      <AddTaskScreen
        propertyId={propertyId}
        assets={[]}
        rooms={[]}
        onCancel={onCancel}
        onSave={pendingSave}
      />,
    );

    const [titleInput] = getAllByPlaceholderText(/Replace filter/i);
    const [dateInput] = getAllByPlaceholderText(/^\d{4}-\d{2}-\d{2}$/);
    await fireEvent.changeText(titleInput, 'Inspect fire extinguisher');
    await fireEvent.changeText(dateInput, '2026-12-01');
    const saveButton = getByText('Save task');
    await act(async () => {
      fireEvent.press(saveButton);
      await Promise.resolve();
    });
    await waitFor(() => expect(pendingSave).toHaveBeenCalledTimes(1));
    fireEvent.press(getByText('Saving'));

    await act(async () => {
      if (!resolveSave) {
        throw new Error('save promise did not start.');
      }

      resolveSave();
      await Promise.resolve();
    });

    await waitFor(() => expect(pendingSave).toHaveBeenCalledTimes(1));
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
