export function cleanOptional(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

export function parseYear(value: string) {
  const parsed = Number(value.trim());

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function isValidYear(value: string) {
  const parsed = Number(value.trim());
  const currentYear = new Date().getFullYear();

  return Number.isInteger(parsed) && parsed >= 1700 && parsed <= currentYear + 1;
}

export function isValidDateInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (!match) {
    return false;
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}
