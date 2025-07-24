'use client';
import { useState } from 'react';
import { useApp } from '@/hooks/use-app';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { calculateStreak } from '@/lib/utils';
import { Check } from 'lucide-react';
import { CelebrationCheck } from './ui/celebration-check';

export function DashboardView() {
  const { user, getWorkoutsForUser, logWorkout, hasUserCompletedWorkoutToday } = useApp();
  const [showCelebration, setShowCelebration] = useState(false);

  if (!user) return null;
  
  const userActivities = getWorkoutsForUser(user.id);
  const streak = calculateStreak(userActivities);
  const completedToday = hasUserCompletedWorkoutToday(user.id);
  
  const handleLogActivity = () => {
    logWorkout();
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2000); // Animation duration
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="bg-primary/10 border-primary/20">
        <CardContent className="p-6 flex items-center justify-center text-center">
          <div>
            <p className="text-sm font-medium text-primary">Day Streak</p>
            <p className="text-4xl font-bold font-headline text-primary">{streak}</p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold font-headline">Ready for today, {user.name}?</h1>
        <p className="text-muted-foreground">
          {completedToday
            ? "Awesome work! You've completed your activity for today."
            : "Log your activity for today to keep your streak alive!"}
        </p>
      </div>

      <div className="relative flex flex-col items-center justify-center pt-4">
        <Button
            size="lg"
            className="w-48 h-16 rounded-full text-lg font-bold shadow-lg bg-accent hover:bg-accent/90 disabled:bg-green-500 disabled:text-white disabled:opacity-100 transition-colors duration-300"
            onClick={handleLogActivity}
            disabled={completedToday || showCelebration}
        >
            {completedToday && !showCelebration ? (
                <>
                    <Check className="mr-2 h-6 w-6" /> Completed
                </>
            ) : (
                "Crushed it!"
            )}
        </Button>
        <div className="h-24 w-24">
            {showCelebration && <CelebrationCheck />}
        </div>
      </div>
    </div>
  );
}
