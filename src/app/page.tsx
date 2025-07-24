'use client';

import { AppProvider } from '@/context/app-provider';
import { useApp } from '@/hooks/use-app';
import { AuthScreen } from '@/components/auth-screen';
import { MainAppShell } from '@/components/main-app-shell';
import { useEffect, useState } from 'react';

function FitnessCircleApp() {
  const { user } = useApp();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="h-screen w-full bg-background" />;
  }

  return user ? <MainAppShell /> : <AuthScreen />;
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <AppProvider>
        <FitnessCircleApp />
      </AppProvider>
    </main>
  );
}
