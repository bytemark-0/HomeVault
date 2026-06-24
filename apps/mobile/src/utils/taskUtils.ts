import type { MaintenanceTaskState } from '@homevault/domain';

export function addDaysToDateInput(date: Date, days: number): string {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString().slice(0, 10);
}

export function computeNextDueDate(recurrenceLabel: string, completedAt?: string): string | null {
  const intervalDays: Record<string, number> = {
    'Monthly': 30,
    'Every 90 days': 90,
    'Twice a year': 182,
    'Yearly': 365,
  };

  const days = intervalDays[recurrenceLabel];

  if (!days) {
    return null;
  }

  const baseDate = completedAt ? new Date(completedAt) : new Date();

  return addDaysToDateInput(baseDate, days);
}

export function getTaskStateForDate(dueDate: string): 'overdue' | 'due_today' | 'upcoming' {
  const today = new Date().toISOString().slice(0, 10);

  if (dueDate < today) {
    return 'overdue';
  }

  if (dueDate === today) {
    return 'due_today';
  }

  return 'upcoming';
}

export function formatTaskDueLabel(
  dueDate: string,
  state: MaintenanceTaskState,
  now = new Date(),
): string {
  if (state === 'completed') {
    return 'Completed';
  }

  if (state === 'snoozed') {
    return `Snoozed to ${formatDateLabel(dueDate)}`;
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${dueDate}T00:00:00`);

  if (Number.isNaN(due.getTime())) {
    return dueDate;
  }

  const diffDays = Math.round((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    return 'Today';
  }

  if (diffDays === -1) {
    return 'Yesterday';
  }

  if (diffDays === 1) {
    return 'Tomorrow';
  }

  if (diffDays < 0 && diffDays >= -6) {
    return `${Math.abs(diffDays)} days ago`;
  }

  return formatDateLabel(dueDate);
}

export function formatDateLabel(value: string): string {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

export function formatCurrency(value?: number): string {
  if (value === undefined) {
    return 'No cost recorded';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 100 === 0 ? 0 : 2,
  }).format(value / 100);
}
