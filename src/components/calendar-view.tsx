'use client';

import { useApp } from '@/hooks/use-app';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { isSameDay, parseISO } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  userId?: string;
}

export function CalendarView({ userId }: CalendarViewProps) {
  const { user: loggedInUser, getWorkoutsForUser, getUserById } = useApp();

  const targetUserId = userId || loggedInUser?.id;
  const targetUser = targetUserId ? getUserById(targetUserId) : null;
  
  if (!targetUser) return null;

  const userActivities = getWorkoutsForUser(targetUser.id);
  const activityDates = userActivities.map(w => parseISO(w.date));
  
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
            mode="multiple"
            selected={activityDates}
            className="p-0"
            components={{
                DayContent: ({ date, ...props }) => {
                    const isCompleted = activityDates.some(d => isSameDay(d, date));
                    return (
                        <div className="relative h-full w-full flex items-center justify-center">
                            <span className={cn(isCompleted && "text-green-600 font-bold")}>{date.getDate()}</span>
                            {isCompleted && (
                                <CheckCircle2 className="absolute bottom-0 right-0 h-3 w-3 text-green-500" />
                            )}
                        </div>
                    );
                }
            }}
            styles={{
                day_selected: { 
                    backgroundColor: 'transparent',
                    color: 'hsl(var(--foreground))',
                    fontWeight: 'normal',
                },
                 day: {
                    position: 'relative',
                 }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
