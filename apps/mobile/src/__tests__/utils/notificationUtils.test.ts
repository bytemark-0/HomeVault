const mockCancelAllScheduledNotificationsAsync = jest.fn().mockResolvedValue(undefined);
const mockGetPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
const mockRequestPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
const mockScheduleNotificationAsync = jest.fn().mockResolvedValue('notification-1');
const mockSetBadgeCountAsync = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: {
    DATE: 'date',
  },
  cancelAllScheduledNotificationsAsync: () => mockCancelAllScheduledNotificationsAsync(),
  getPermissionsAsync: () => mockGetPermissionsAsync(),
  requestPermissionsAsync: () => mockRequestPermissionsAsync(),
  scheduleNotificationAsync: (...args: unknown[]) => mockScheduleNotificationAsync(...args),
  setBadgeCountAsync: (...args: unknown[]) => mockSetBadgeCountAsync(...args),
  setNotificationHandler: jest.fn(),
}));

import { syncTaskNotifications } from '../../utils/notificationUtils';

describe('notificationUtils privacy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });
  });

  it('uses generic notification copy instead of task titles or scope labels', async () => {
    await syncTaskNotifications([
      {
        id: 'task-1',
        propertyId: 'property-1',
        scope: 'property',
        scopeId: 'property-1',
        title: 'Reset Primary email with backup codes',
        dueDate: '2099-07-10',
        dueLabel: 'Jul 10',
        recurrenceKind: 'one_time',
        recurrenceLabel: 'One time',
        state: 'upcoming',
        scopeLabel: 'Main Wi-Fi router',
      },
    ]);

    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'task-task-1',
        content: expect.objectContaining({
          title: 'HomeVault reminder',
          body: 'Due Jul 10. Open HomeVault to review.',
          data: { taskId: 'task-1' },
        }),
      }),
    );

    const scheduledPayload = JSON.stringify(mockScheduleNotificationAsync.mock.calls[0]?.[0]);
    expect(scheduledPayload).not.toContain('Reset Primary email with backup codes');
    expect(scheduledPayload).not.toContain('Main Wi-Fi router');
  });

  it('keeps due-today reminders generic as well', async () => {
    await syncTaskNotifications([
      {
        id: 'task-2',
        propertyId: 'property-1',
        scope: 'asset',
        scopeId: 'asset-1',
        title: 'Check lockbox code',
        dueDate: '2099-07-10',
        dueLabel: 'Today',
        recurrenceKind: 'one_time',
        recurrenceLabel: 'One time',
        state: 'due_today',
        scopeLabel: 'Front porch lockbox',
      },
    ]);

    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: 'HomeVault reminder',
          body: 'Due today. Open HomeVault to review.',
        }),
      }),
    );

    const scheduledPayload = JSON.stringify(mockScheduleNotificationAsync.mock.calls[0]?.[0]);
    expect(scheduledPayload).not.toContain('Check lockbox code');
    expect(scheduledPayload).not.toContain('Front porch lockbox');
  });
});
