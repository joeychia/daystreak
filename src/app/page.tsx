'use client';

import { AppProvider } from '@/context/app-provider';
import { useApp } from '@/hooks/use-app';
import { AuthScreen } from '@/components/auth-screen';
import { MainAppShell } from '@/components/main-app-shell';

function FitnessCircleApp() {
  const { user } = useApp();
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
