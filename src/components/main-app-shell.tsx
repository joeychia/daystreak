'use client';
import { useState } from 'react';
import { BottomNav } from '@/components/bottom-nav';
import { DashboardView } from '@/components/dashboard-view';
import { CalendarView } from '@/components/calendar-view';
import { useApp } from '@/hooks/use-app';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { LogOut } from 'lucide-react';
import { Logo } from './icons/logo';

export function MainAppShell() {
  const [activeView, setActiveView] = useState('dashboard');
  const { user, logout } = useApp();

  const renderView = () => {
    switch (activeView) {
      case 'calendar':
        return <CalendarView />;
      case 'dashboard':
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <Logo className="w-[120px] h-auto" />
        <div className="flex items-center gap-2">
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
