import { fireEvent, render } from '@testing-library/react-native';

import { ContinuityPlaybookDetailScreen } from '../../screens/ContinuityPlaybookDetailScreen';

describe('ContinuityPlaybookDetailScreen', () => {
  it('surfaces the first missing required record as the primary action', async () => {
    const onOpenTarget = jest.fn();
    const onRunDrill = jest.fn();
    const { getAllByText, getByText } = await render(
      <ContinuityPlaybookDetailScreen
        canRunDrill
        guide={{
          id: 'guide-home-lockout',
          source: 'guided',
          title: 'Home lockout recovery',
          category: 'handoff',
          state: 'not_started',
          whenToUse: 'Use this when someone is locked out.',
          summary: 'Missing 1 key record before this playbook is fully ready.',
          steps: [
            {
              id: 'step-1',
              label: 'Open the saved entry instructions first.',
              isRequired: true,
              isComplete: false,
            },
          ],
          readyRecords: [],
          missingRecords: [
            {
              key: 'lockout_access',
              label: 'Lockbox or entry note',
              detail: 'Save one lockbox, spare-key, or entry instruction record.',
              priority: 'required',
              status: 'missing',
              target: { kind: 'new_access', category: 'lockbox' },
            },
          ],
        }}
        onBack={jest.fn()}
        onOpenTarget={onOpenTarget}
        onRunDrill={onRunDrill}
      />,
    );

    expect(getByText('Do this first')).toBeTruthy();
    expect(getAllByText('Lockbox or entry note').length).toBeGreaterThan(0);
    expect(getByText('Fix missing record')).toBeTruthy();

    await fireEvent.press(getByText('Fix missing record'));
    await fireEvent.press(getByText('Run a drill'));

    expect(onOpenTarget).toHaveBeenCalledWith({ kind: 'new_access', category: 'lockbox' });
    expect(onRunDrill).toHaveBeenCalledTimes(1);
  });

  it('opens the first ready required record when the playbook is already usable', async () => {
    const onOpenTarget = jest.fn();
    const onOpenIncidentWorkspace = jest.fn();
    const { getAllByText, getByText } = await render(
      <ContinuityPlaybookDetailScreen
        canStartIncidentWorkspace
        guide={{
          id: 'guide-internet-outage',
          source: 'guided',
          title: 'Internet outage recovery',
          category: 'emergency',
          state: 'ready',
          whenToUse: 'Use this when Wi-Fi is down.',
          summary: 'Core records are linked and ready to use.',
          steps: [
            {
              id: 'step-1',
              label: 'Open the saved router instructions.',
              isRequired: true,
              isComplete: true,
            },
          ],
          readyRecords: [
            {
              key: 'internet_access',
              label: 'Router admin',
              detail: 'admin',
              priority: 'required',
              status: 'ready',
              target: { kind: 'access', id: 'access-router' },
            },
          ],
          missingRecords: [],
        }}
        onBack={jest.fn()}
        onOpenIncidentWorkspace={onOpenIncidentWorkspace}
        onOpenTarget={onOpenTarget}
      />,
    );

    expect(getByText('Do this first')).toBeTruthy();
    expect(getAllByText('Router admin').length).toBeGreaterThan(0);
    expect(getAllByText('Open linked record').length).toBeGreaterThan(0);
    expect(getByText('Start incident workspace')).toBeTruthy();

    await fireEvent.press(getAllByText('Open linked record')[0]);
    await fireEvent.press(getByText('Start incident workspace'));

    expect(onOpenTarget).toHaveBeenCalledWith({ kind: 'access', id: 'access-router' });
    expect(onOpenIncidentWorkspace).toHaveBeenCalledTimes(1);
  });
});
