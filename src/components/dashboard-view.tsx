
'use client';
import { useApp } from '@/hooks/use-app';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, ClipboardCopy } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { isSameDay, parseISO } from 'date-fns';
import type { DayContentProps } from 'react-day-picker';
import { useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';


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
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  if (!user) return null;
  
  const userActivities = getActivitiesForUser(user.id);
  const completedToday = hasUserCompletedActivityToday(user.id);
  const completedDays = userActivities.map(activity => parseISO(activity.date));

  const completionUrl = `${window.location.origin}/c/${user.completionToken}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(completionUrl).then(() => {
        setHasCopied(true);
        toast({
            title: "Copied to Clipboard!",
            description: "You can use this link to complete your streak from any device.",
        });
        setTimeout(() => setHasCopied(false), 2000);
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col items-center justify-center pt-2 mb-4">
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

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="font-headline">Your Activity</CardTitle>
          <CardDescription>
            {completedToday
              ? "Great work! Logged for today."
              : "Log your activity for today!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-0 mb-[10px]">
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

       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Magic Link</CardTitle>
          <CardDescription>
            Use this link to log your activity from any device without signing in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
                <Label htmlFor="magic-link" className="sr-only">
                    Magic Link
                </Label>
                <Input
                    id="magic-link"
                    value={completionUrl}
                    readOnly
                    className="text-muted-foreground"
                />
            </div>
            <Button type="button" size="icon" onClick={handleCopy} aria-label="Copy Magic Link">
                {hasCopied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
