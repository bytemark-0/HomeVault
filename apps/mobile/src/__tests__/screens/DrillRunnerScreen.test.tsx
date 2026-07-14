import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { DrillRunnerScreen } from '../../screens/DrillRunnerScreen';

describe('DrillRunnerScreen', () => {
  it('runs a guided drill with timer, protected record cues, and completion summary', async () => {
    const onOpenTarget = jest.fn();
    const { getAllByText, getByText, queryByText } = await render(
      <DrillRunnerScreen
        scenario={{
          id: 'guide-home-lockout',
          title: 'Home lockout recovery',
          summary: 'Core records are linked and ready to use.',
          whenToUse: 'Use this when someone is locked out.',
          steps: [
            {
              id: 'step-1',
              label: 'Open the saved entry or lockbox instructions first.',
              isRequired: true,
              isComplete: true,
              requiredResourceKeys: ['lockout_access'],
              resources: [
                {
                  key: 'lockout_access',
                  label: 'Front porch lockbox',
                  detail: 'Protected details stay inside the linked record until you intentionally open it.',
                  freshness: {
                    status: 'stale',
                    label: 'Needs review',
                    detail: 'Last reviewed 240 days ago. Refresh this record at least every 180 days.',
                    lastReviewedAt: '2025-11-12',
                  },
                  priority: 'required',
                  status: 'ready',
                  actionLabel: 'Open linked record',
                  sensitivity: 'protected',
                  target: { kind: 'access', id: 'access-lockbox' },
                },
              ],
            },
            {
              id: 'step-2',
              label: 'Call the listed helper if the saved note is not enough.',
              isRequired: false,
              isComplete: false,
              requiredResourceKeys: ['lockout_contact'],
              resources: [
                {
                  key: 'lockout_contact',
                  label: 'Emergency contact with access',
                  detail: 'Keep one person listed who can help during a lockout.',
                  priority: 'recommended',
                  status: 'missing',
                  actionLabel: 'Fix missing record',
                  sensitivity: 'standard',
                  target: { kind: 'screen', screen: 'emergency' },
                },
              ],
            },
          ],
          missingRecordLabels: ['Emergency contact with access'],
        }}
        onBack={jest.fn()}
        onOpenTarget={onOpenTarget}
      />,
    );

    expect(getByText('Guided drill')).toBeTruthy();
    expect(getByText('00:00')).toBeTruthy();
    expect(getByText('Protected details stay gated in the linked record.')).toBeTruthy();
    expect(
      getByText('Needs review - Last reviewed 240 days ago. Refresh this record at least every 180 days.'),
    ).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('Start timer'));
    });
    await waitFor(() => expect(getByText('Pause timer')).toBeTruthy());

    await act(async () => {
      fireEvent.press(getByText('Open linked record'));
    });
    expect(onOpenTarget).toHaveBeenCalledWith({ kind: 'access', id: 'access-lockbox' });

    await act(async () => {
      fireEvent.press(getByText('Mark confusing'));
    });
    await act(async () => {
      fireEvent.press(getByText('Next step'));
    });

    await waitFor(() =>
      expect(getByText('Call the listed helper if the saved note is not enough.')).toBeTruthy(),
    );
    expect(getByText('Fix missing record')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('Pause timer'));
    });
    await act(async () => {
      fireEvent.press(getByText('Finish drill'));
    });

    await waitFor(() => expect(getByText('Drill summary')).toBeTruthy());
    expect(getAllByText('Needs data').length).toBeGreaterThan(0);
    expect(getByText('Restart drill')).toBeTruthy();
    expect(getByText('- Emergency contact with access')).toBeTruthy();
    expect(getByText('- Front porch lockbox - Needs review - Last reviewed 240 days ago. Refresh this record at least every 180 days.')).toBeTruthy();
    expect(getByText('- Review and refresh "Front porch lockbox" before the next drill.')).toBeTruthy();
    expect(queryByText('Finish drill')).toBeNull();
  });
});
