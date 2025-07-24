'use client';
import { useState } from 'react';
import { BottomNav } from '@/components/bottom-nav';
import { DashboardView } from '@/components/dashboard-view';
import { GroupView } from '@/components/group-view';
import { useApp } from '@/hooks/use-app';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { LogOut } from 'lucide-react';
import { Logo } from './icons/logo';
import { calculateStreak } from '@/lib/utils';
import { FlameSolidIcon } from './icons/flame-solid';

export function MainAppShell() {
  const [activeView, setActiveView] = useState<'dashboard' | 'group'>('dashboard');
  const { user, logout, getWorkoutsForUser } = useApp();

  const renderView = () => {
    switch (activeView) {
      case 'group':
        return <GroupView />;
      case 'dashboard':
      default:
        return <DashboardView />;
    }
  };

  const userWorkouts = user ? getWorkoutsForUser(user.id) : [];
  const streak = calculateStreak(userWorkouts);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <Logo className="w-[120px] h-auto" />
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-primary font-bold">
                <FlameSolidIcon className="w-5 h-5" />
                <span>{streak}</span>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatarUrl} alt={user?.name} />
              <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto pb-20">{renderView()}</main>
      <BottomNav activeView={activeView} setActiveView={setActiveView} />
    </div>
  );
}
