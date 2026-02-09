// src/application/common/utils/date-formatter.util.ts

/**
 * Utility functions for formatting dates to match frontend expectations
 */

/**
 * Formats a date to relative day string (Today, Tomorrow) or day of week
 * @param date The date to format
 * @returns String like "Today", "Tomorrow", "Monday", etc.
 */
export function formatDayString(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';

  // Return day of week for dates within next 7 days
  if (diffDays > 1 && diffDays < 7) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[targetDate.getDay()]!;
  }

  // For dates further out, return day of week
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[targetDate.getDay()]!;
}

/**
 * Formats a date to short date string
 * @param date The date to format
 * @returns String like "Jan 29"
 */
export function formatDateString(date: Date): string {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const month = months[date.getMonth()]!;
  const day = date.getDate();

  return `${month} ${day}`;
}

/**
 * Formats start and end times to time range string
 * @param startTime Start time
 * @param endTime End time
 * @returns String like "18:00 - 19:00"
 */
export function formatTimeRange(startTime: Date, endTime: Date): string {
  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/**
 * Formats ClassType enum to lowercase string for frontend
 * @param type ClassType enum value
 * @returns 'regular' | 'workshop'
 */
export function formatClassType(type: string): string {
  return type.toLowerCase();
}
