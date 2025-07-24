'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/use-app';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { calculateStreak } from '@/lib/utils';
import { FlameSolidIcon } from './icons/flame-solid';
import { Check } from 'lucide-react';
import { CelebrationCheck } from './ui/celebration-check';

export function DashboardView() {
  const { user, getWorkoutsForUser, logWorkout, hasUserCompletedWorkoutToday } = useApp();
  const [showCelebration, setShowCelebration] = useState(false);

  if (!user) return null;
  
  const userWorkouts = getWorkoutsForUser(user.id);
  const streak = calculateStreak(userWorkouts);
  const completedToday = hasUserCompletedWorkoutToday(user.id);
  
  const handleLogWorkout = () => {
    logWorkout();
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2000); // Animation duration
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="bg-primary/10 border-primary/20">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Day Streak</p>
            <p className="text-4xl font-bold font-headline text-primary">{streak}</p>
          </div>
          <FlameSolidIcon className="w-16 h-16 text-primary opacity-80" />
        </CardContent>
      </Card>

      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold font-headline">Ready to sweat, {user.name}?</h1>
        <p className="text-muted-foreground">
          {completedToday
            ? "Awesome work! You've completed your workout for today."
            : "Log your workout for today to keep your streak alive!"}
        </p>
      </div>

      <div className="relative flex items-center justify-center">
        {showCelebration && <CelebrationCheck />}
        <Button
            size="lg"
            className="w-48 h-16 rounded-full text-lg font-bold shadow-lg bg-accent hover:bg-accent/90 disabled:bg-primary disabled:text-primary-foreground disabled:opacity-100"
            onClick={handleLogWorkout}
            disabled={completedToday}
        >
            {completedToday ? (
                <>
                    <Check className="mr-2 h-6 w-6" /> Completed
                </>
            ) : (
                "Log Today's Workout"
            )}
        </Button>
      </div>
    </div>
  );
}
