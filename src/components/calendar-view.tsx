'use client';

import { useApp } from '@/hooks/use-app';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { isSameDay, parseISO } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';

export function CalendarView() {
  const { user, getWorkoutsForUser } = useApp();

  if (!user) return null;

  const userWorkouts = getWorkoutsForUser(user.id);
  const workoutDates = userWorkouts.map(w => parseISO(w.date));

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Your Workout Calendar</CardTitle>
          <CardDescription>A look back at all your hard work.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="multiple"
            selected={workoutDates}
            className="p-0"
            components={{
                DayContent: ({ date, ...props }) => {
                    const isCompleted = workoutDates.some(d => isSameDay(d, date));
                    return (
                        <div className="relative h-full w-full flex items-center justify-center">
                            <span>{date.getDate()}</span>
                            {isCompleted && (
                                <CheckCircle2 className="absolute bottom-0 right-0 h-3 w-3 text-primary" />
                            )}
                        </div>
                    );
                }
            }}
            styles={{
                day_selected: { 
                    backgroundColor: 'hsl(var(--primary) / 0.2)',
                    color: 'hsl(var(--primary-foreground))',
                    fontWeight: 'bold',
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
