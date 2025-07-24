import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInCalendarDays, isSameDay, isYesterday, parseISO } from 'date-fns';
import type { Activity } from '@/lib/types';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateStreak(activityLogs: Activity[]): number {
  if (!activityLogs || activityLogs.length === 0) {
    return 0;
  }

  const activityDates = activityLogs
    .map((log) => parseISO(log.date))
    .sort((a, b) => b.getTime() - a.getTime());
  
  const uniqueDates = activityDates.filter(
    (date, index, self) => self.findIndex(d => isSameDay(d, date)) === index
  );

  if (uniqueDates.length === 0) {
    return 0;
  }

  const today = new Date();
  const mostRecentActivityDate = uniqueDates[0];

  if (!isSameDay(mostRecentActivityDate, today) && !isYesterday(mostRecentActivityDate)) {
    return 0;
  }

  let streak = 1;
  let currentExpectedDate = mostRecentActivityDate;

  for (let i = 1; i < uniqueDates.length; i++) {
    const nextActivityDate = uniqueDates[i];
    if (differenceInCalendarDays(currentExpectedDate, nextActivityDate) === 1) {
      streak++;
      currentExpectedDate = nextActivityDate;
    } else {
      break;
    }
  }

  return streak;
}
