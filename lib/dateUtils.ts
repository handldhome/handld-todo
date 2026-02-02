// Date utilities with proper timezone handling (Los Angeles PST/PDT)

/**
 * Get today's date in YYYY-MM-DD format using local timezone
 */
export function getLocalToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string as local date (not UTC)
 * Input: "2025-02-03" -> Date object at midnight local time
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Check if a date string is today (local timezone)
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getLocalToday();
}

/**
 * Check if a date string is tomorrow (local timezone)
 */
export function isTomorrow(dateStr: string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return dateStr === `${year}-${month}-${day}`;
}

/**
 * Check if a date string is overdue (before today, local timezone)
 */
export function isOverdue(dateStr: string): boolean {
  const today = getLocalToday();
  return dateStr < today;
}

/**
 * Format a date string for display
 */
export function formatDueDate(dateStr: string): string {
  if (isToday(dateStr)) return 'Today';
  if (isTomorrow(dateStr)) return 'Tomorrow';

  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
