'use client';

import { AppProvider } from '@/context/app-provider';
import { useApp } from '@/hooks/use-app';
import { AuthScreen } from '@/components/auth-screen';
import { MainAppShell } from '@/components/main-app-shell';

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
        <DayStreakApp />
      </AppProvider>
    </main>
  );
}
