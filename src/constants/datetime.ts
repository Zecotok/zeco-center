/**
 * Constants for date, time, and timezone handling across the application
 */

// Default timezone (Indian Standard Time - UTC+5:30)
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

// Default due time (10:00 PM in 24-hour format)
export const DEFAULT_DUE_TIME = '22:00:00';

/**
 * Sets a default due date at 10:00 PM IST
 * If no date is provided, uses today's date
 * @param dateStr Optional date string (YYYY-MM-DD format)
 * @returns Date object set to 10:00 PM IST on the specified date (or today)
 */
export function getDefaultDueDate(dateStr?: string): Date {
  // Create date in IST timezone
  const now = new Date();
  
  // If no date specified, use today's date + 1 day (tomorrow)
  let targetDate: Date;
  
  if (dateStr) {
    // Use the provided date
    targetDate = new Date(dateStr);
  } else {
    // Use tomorrow
    targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + 1);
  }
  
  // Parse the default time components
  const [hours, minutes, seconds] = DEFAULT_DUE_TIME.split(':').map(Number);
  
  // Set the time to 10:00 PM
  targetDate.setHours(hours, minutes, seconds);
  
  return targetDate;
}

/**
 * Checks if a date is overdue (in the past)
 * @param dateStr Date string to check
 * @returns Boolean indicating if the date is in the past
 */
export function isOverdue(dateStr: string): boolean {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const now = new Date();
  return due < now;
}

/**
 * Format a date as a readable string with timezone consideration
 * @param dateStr Date string to format
 * @param includeTime Whether to include the time in the formatted result
 * @returns Formatted date string
 */
export function formatDate(dateStr: string, includeTime: boolean = false): string {
  if (!dateStr) return 'Not set';
  
  const date = new Date(dateStr);
  
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    timeZone: DEFAULT_TIMEZONE
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = true;
  }
  
  return new Date(dateStr).toLocaleString('en-US', options);
} 