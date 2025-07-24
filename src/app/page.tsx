'use client';

import { AppProvider } from '@/context/app-provider';
import { useApp } from '@/hooks/use-app';
import { AuthScreen } from '@/components/auth-screen';
import { MainAppShell } from '@/components/main-app-shell';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

function MagicLinkToastHandler() {
    const searchParams = useSearchParams();
    const { toast } = useToast();
  
    useEffect(() => {
      const source = searchParams.get('source');
      if (source === 'magic_link_success') {
        toast({
          title: "Activity Logged!",
          description: "Great work! You've crushed it for today.",
        });
      } else if (source === 'magic_link_error') {
        const message = searchParams.get('message');
        if (message === 'already_completed') {
            toast({
                title: "Already Logged!",
                description: "Looks like you already completed your goal for today. Awesome job!",
            });
        } else {
            toast({
                title: "Something Went Wrong",
                description: message || "We couldn't log your activity.",
                variant: 'destructive'
            });
        }
      }
    }, [searchParams, toast]);
  
    return null; // This component does not render anything
  }

function DayStreakApp() {
  const { user, loading } = useApp();

  if (loading) {
    return <div className="h-screen w-full bg-background flex items-center justify-center">Loading...</div>;
  }
  
  return user ? <MainAppShell /> : <AuthScreen />;
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <AppProvider>
        <Suspense fallback={<div>Loading...</div>}>
            <DayStreakApp />
            <MagicLinkToastHandler />
        </Suspense>
      </AppProvider>
    </main>
  );
}
