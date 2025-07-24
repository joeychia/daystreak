
'use client';

import { useApp } from '@/hooks/use-app';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { isSameDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { DayContentProps } from 'react-day-picker';

function DayContent({ date }: DayContentProps) {
  const { workouts } = useApp();

  const isCompleted = workouts.some(workout => isSameDay(parseISO(workout.date), date));

  return (
    <div className={cn("relative h-full w-full flex items-center justify-center")}>
      {date.getDate()}
      {isCompleted && <Check className="absolute bottom-1 right-1 h-3 w-3 text-green-600" />}
    </div>
  );
}


export function CalendarView() {
  const { user, workouts } = useApp();
  
  if (!user) return null;

  const cardTitle = 'Your Activity Calendar';
  const cardDescription = 'A look back at your progress.';

  const completedDays = workouts.map(workout => parseISO(workout.date));

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
