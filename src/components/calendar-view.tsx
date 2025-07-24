
'use client';

import { useApp } from '@/hooks/use-app';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import type { User } from '@/lib/types';
import { isSameDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { DayContentProps } from 'react-day-picker';

interface CalendarViewProps {
  userId?: string;
}

function DayContent({ date, activeModifiers }: DayContentProps) {
  const { getWorkoutsForUser, user: loggedInUser } = useApp();
  // This is a bit inefficient to call in a loop, but for the scope of this calendar it is acceptable.
  // For larger scale apps, consider moving this logic higher up.
  const workouts = getWorkoutsForUser(loggedInUser!.id);
  const isCompleted = workouts.some(workout => isSameDay(parseISO(workout.date), date));

  return (
    <div className={cn("relative h-full w-full flex items-center justify-center")}>
      {date.getDate()}
      {isCompleted && <Check className="absolute top-1 right-1 h-3 w-3 text-white" />}
    </div>
  );
}


export function CalendarView({ userId }: CalendarViewProps) {
  const { user: loggedInUser, getUserById, getWorkoutsForUser } = useApp();

  const targetUserId = userId || loggedInUser?.id;
  const targetUser = targetUserId ? getUserById(targetUserId) : null;
  const userWorkouts = targetUserId ? getWorkoutsForUser(targetUserId) : [];
  
  if (!targetUser) return null;

  const cardTitle = userId ? `Activity Calendar` : 'Your Activity Calendar';
  const cardDescription = userId ? `A look at ${targetUser.name}'s progress.` : 'A look back at your progress.';

  const completedDays = userWorkouts.map(workout => parseISO(workout.date));

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{cardTitle}</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="multiple"
            selected={completedDays}
            className="p-0"
            components={{
              DayContent: DayContent
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
