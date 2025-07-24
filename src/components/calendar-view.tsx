
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
                        <div className={cn(
                            "relative h-8 w-8 flex items-center justify-center rounded-full",
                            isCompleted && "bg-primary/20"
                        )}>
                            <span className={cn(isCompleted && "font-bold text-primary")}>{date.getDate()}</span>
                            {isCompleted && (
                                <CheckCircle2 className="absolute -bottom-1 -right-1 h-4 w-4 text-primary bg-background rounded-full" />
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
                    height: '2.5rem',
                    width: '2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                 }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
