
'use client';

import { useApp } from '@/hooks/use-app';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { isSameDay, parseISO } from 'date-fns';
import { Check } from 'lucide-react';
import type { DayContentProps } from 'react-day-picker';

interface CalendarViewProps {
  userId?: string;
}

function DayContent(props: DayContentProps) {
    const { user: loggedInUser, getWorkoutsForUser } = useApp();
    const targetUserId = (props as any).userId || loggedInUser?.id;
    const userActivities = getWorkoutsForUser(targetUserId);
    const activityDates = userActivities.map(w => parseISO(w.date));
    const isCompleted = activityDates.some(d => isSameDay(d, props.date));
  
    if (isCompleted) {
      return (
        <div className="relative flex items-center justify-center h-full w-full">
          <span className="absolute inset-0 bg-green-600 rounded-md z-0"></span>
          <span className="relative text-white z-10">{props.date.getDate()}</span>
          <Check className="absolute bottom-1 right-1 h-3 w-3 text-white z-10" />
        </div>
      );
    }
  
    return <div className="relative flex items-center justify-center h-full w-full">{props.date.getDate()}</div>;
  }

export function CalendarView({ userId }: CalendarViewProps) {
  const { user: loggedInUser, getWorkoutsForUser, getUserById } = useApp();

  const targetUserId = userId || loggedInUser?.id;
  const targetUser = targetUserId ? getUserById(targetUserId) : null;
  
  if (!targetUser) return null;

  const cardTitle = userId ? `Activity Calendar` : 'Your Activity Calendar';
  const cardDescription = userId ? `A look at ${targetUser.name}'s progress.` : 'A look back at your progress.';

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{cardTitle}</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            className="p-0"
            components={{
                DayContent: (props) => <DayContent {...props} userId={userId} />
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
