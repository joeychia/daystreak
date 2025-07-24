import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInCalendarDays, isSameDay, isYesterday, parseISO } from 'date-fns';
import type { Workout } from '@/lib/types';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateStreak(workoutLogs: Workout[]): number {
  if (!workoutLogs || workoutLogs.length === 0) {
    return 0;
  }

  const workoutDates = workoutLogs
    .map((log) => parseISO(log.date))
    .sort((a, b) => b.getTime() - a.getTime());
  
  const uniqueDates = workoutDates.filter(
    (date, index, self) => self.findIndex(d => isSameDay(d, date)) === index
  );

  if (uniqueDates.length === 0) {
    return 0;
  }

  const today = new Date();
  const mostRecentWorkoutDate = uniqueDates[0];

  if (!isSameDay(mostRecentWorkoutDate, today) && !isYesterday(mostRecentWorkoutDate)) {
    return 0;
  }

  let streak = 1;
  let currentExpectedDate = mostRecentWorkoutDate;

  for (let i = 1; i < uniqueDates.length; i++) {
    const nextWorkoutDate = uniqueDates[i];
    if (differenceInCalendarDays(currentExpectedDate, nextWorkoutDate) === 1) {
      streak++;
      currentExpectedDate = nextWorkoutDate;
    } else {
      break;
    }
  }

  return streak;
}
