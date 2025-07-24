
'use client';
import { useApp } from '@/hooks/use-app';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { isSameDay, parseISO } from 'date-fns';
import type { DayContentProps } from 'react-day-picker';


function DayContent({ date, completedDays }: DayContentProps & { completedDays: Date[] }) {
    const isCompleted = completedDays.some(completedDate => isSameDay(completedDate, date));

    return (
        <div className={cn("relative h-full w-full flex items-center justify-center")}>
            {date.getDate()}
            {isCompleted && <Check className="absolute bottom-1 right-1 h-3 w-3 text-green-600" />}
        </div>
    );
}

interface DashboardViewProps {
  onLogActivity: () => void;
  isCelebrating: boolean;
}

export function DashboardView({ onLogActivity, isCelebrating }: DashboardViewProps) {
  const { user, getActivitiesForUser, hasUserCompletedActivityToday } = useApp();

  if (!user) return null;
  
  const userActivities = getActivitiesForUser(user.id);
  const completedToday = hasUserCompletedActivityToday(user.id);
  const completedDays = userActivities.map(activity => parseISO(activity.date));

  return (
    <div className="p-4 md:p-6 space-y-4">
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="font-headline">Your Activity</CardTitle>
          <CardDescription>
            {completedToday
              ? "Great work! Logged for today."
              : "Log your activity for today!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-0">
          <Calendar
            mode="multiple"
            selected={completedDays}
            className="p-0"
            components={{
                DayContent: (props) => <DayContent {...props} completedDays={completedDays} />,
            }}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col items-center justify-center pt-2">
        <Button
            size="lg"
            className="w-44 h-14 rounded-full text-lg font-bold shadow-lg bg-accent hover:bg-accent/90 disabled:bg-green-500 disabled:text-white disabled:opacity-100 transition-colors duration-300"
            onClick={onLogActivity}
            disabled={completedToday || isCelebrating}
        >
            {completedToday && !isCelebrating ? (
                <>
                    <Check className="mr-2 h-6 w-6" /> Completed
                </>
            ) : (
                "Crushed it!"
            )}
        </Button>
      </div>
    </div>
  );
}
