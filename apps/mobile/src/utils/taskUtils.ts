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

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 100 === 0 ? 0 : 2,
  }).format(value / 100);
}
