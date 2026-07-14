import { fireEvent, render } from '@testing-library/react-native';

import { AnnualReviewScreen } from '../../screens/AnnualReviewScreen';

describe('AnnualReviewScreen', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((message?: unknown) => {
      if (
        typeof message === 'string' &&
        message.includes('overlapping act() calls')
      ) {
        return;
      }
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('shows checklist categories and routes actions through the provided handlers', async () => {
    const onOpenChecklistItem = jest.fn();
    const onOpenPriorityReviewItem = jest.fn();
    const onCompleteReview = jest.fn();
    const onToggleReminders = jest.fn();
    const onBack = jest.fn();

    const { getByText } = await render(
      <AnnualReviewScreen
        checklist={[
          {
            key: 'insurance',
            title: 'Insurance records',
            detail: 'Review policies.',
            actionLabel: 'Review coverage',
            status: 'ready',
          },
          {
            key: 'contacts',
            title: 'Emergency contacts',
            detail: 'Review contacts.',
            actionLabel: 'Review contacts',
            status: 'ready',
          },
          {
            key: 'access',
            title: 'Access info',
            detail: 'Review access.',
            actionLabel: 'Review access',
            status: 'needs_attention',
          },
          {
            key: 'devices',
            title: 'Critical devices',
            detail: 'Review devices.',
            actionLabel: 'Review devices',
            status: 'ready',
          },
          {
            key: 'digital_safety',
            title: 'Digital safety',
            detail: 'Review MFA and backups.',
            actionLabel: 'Review digital safety',
            status: 'needs_attention',
          },
          {
            key: 'ownership',
            title: 'Ownership and backup roles',
            detail: 'Review who owns claims, devices, and helper handoffs.',
            actionLabel: 'Review ownership',
            status: 'needs_attention',
          },
          {
            key: 'packet',
            title: 'Emergency packet',
            detail: 'Regenerate packet.',
            actionLabel: 'Regenerate packet',
            status: 'needs_attention',
          },
        ]}
        lastCompletedLabel="Jul 8, 2026"
        nextReminderLabel="Jul 8, 2027"
        priorityReviewItems={[
          {
            key: 'contact:contact-1',
            title: 'Jamie Lee',
            detail: 'Primary contact · No review has been recorded in the last 180 days.',
            actionLabel: 'Open record',
          },
        ]}
        propertyLabel="Oak Street home"
        remindersEnabled={false}
        onBack={onBack}
        onCompleteReview={onCompleteReview}
        onOpenChecklistItem={onOpenChecklistItem}
        onOpenPriorityReviewItem={onOpenPriorityReviewItem}
        onToggleReminders={onToggleReminders}
      />,
    );

    expect(getByText('Annual review')).toBeTruthy();
    expect(getByText('Insurance records')).toBeTruthy();
    expect(getByText('Emergency contacts')).toBeTruthy();
    expect(getByText('Access info')).toBeTruthy();
    expect(getByText('Critical devices')).toBeTruthy();
    expect(getByText('Digital safety')).toBeTruthy();
    expect(getByText('Ownership and backup roles')).toBeTruthy();
    expect(getByText('Emergency packet')).toBeTruthy();
    expect(getByText('Highest-risk stale records')).toBeTruthy();
    expect(getByText('Jamie Lee')).toBeTruthy();

    fireEvent.press(getByText('Back'));
    fireEvent.press(getByText('Turn on yearly reminder'));
    fireEvent.press(getByText('Mark review complete'));
    fireEvent.press(getByText('Review coverage'));
    fireEvent.press(getByText('Open record'));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onToggleReminders).toHaveBeenCalledWith(true);
    expect(onCompleteReview).toHaveBeenCalledTimes(1);
    expect(onOpenChecklistItem).toHaveBeenCalledWith('insurance');
    expect(onOpenPriorityReviewItem).toHaveBeenCalledWith('contact:contact-1');
  });
});
