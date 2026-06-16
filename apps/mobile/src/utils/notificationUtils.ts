import * as Notifications from 'expo-notifications';

import type { TaskListItem } from '../data/homeVaultSampleData';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function syncTaskNotifications(tasks: TaskListItem[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  const overdueCount = tasks.filter((t) => t.state === 'overdue').length;
  await Notifications.setBadgeCountAsync(overdueCount);

  for (const task of tasks) {
    if (task.state === 'completed' || task.state === 'overdue' || !task.dueDate) continue;

    const triggerDate = getTriggerDate(task.dueDate, task.state, now);
    if (!triggerDate) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `task-${task.id}`,
      content: {
        title: task.title,
        body: buildNotificationBody(task),
        data: { taskId: task.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  }
}

export async function clearAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.setBadgeCountAsync(0);
}

function buildNotificationBody(task: TaskListItem): string {
  const scope = task.scopeLabel;
  if (task.state === 'snoozed') return `Reminder · ${scope}`;
  if (task.state === 'due_today') return `Due today · ${scope}`;
  return `Due ${task.dueLabel} · ${scope}`;
}

function getTriggerDate(
  dueDate: string,
  state: TaskListItem['state'],
  now: Date,
): Date | null {
  const due = new Date(`${dueDate}T09:00:00`);

  if (state === 'due_today') {
    if (due > now) return due;
    // Already past 9am — fire in 2 minutes so the user sees it immediately
    const soon = new Date(now.getTime() + 2 * 60 * 1000);
    return soon;
  }

  if (state === 'upcoming' || state === 'snoozed') {
    return due > now ? due : null;
  }

  return null;
}
