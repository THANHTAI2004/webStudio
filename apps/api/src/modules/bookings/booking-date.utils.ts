const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidLocalDate(value: string): boolean {
  if (!LOCAL_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function getTodayInTimezone(timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const year = getPart(parts, 'year');
  const month = getPart(parts, 'month');
  const day = getPart(parts, 'day');

  return `${year}-${month}-${day}`;
}

export function getInclusiveDaysBetween(from: string, to: string): number {
  const fromDate = toUtcDate(from);
  const toDate = toUtcDate(to);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return (
    Math.floor((toDate.getTime() - fromDate.getTime()) / millisecondsPerDay) + 1
  );
}

export function parseCreatedDateBound(
  value: string,
  endOfDay: boolean,
): Date | null {
  if (isValidLocalDate(value)) {
    const suffix = endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z';

    return new Date(`${value}${suffix}`);
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function toUtcDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function getPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((part) => part.type === type)?.value ?? '';
}
