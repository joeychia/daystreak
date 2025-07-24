
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
import { CelebrationCheck } from './ui/celebration-check';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

export function MainAppShell() {
  const [activeView, setActiveView] = useState<'dashboard' | 'group'>('dashboard');
  const [showCelebration, setShowCelebration] = useState(false);
  const { user, logout, logActivity, getActivitiesForUser, hasUserCompletedActivityToday } = useApp();

  const handleLogActivity = () => {
    if (user && !hasUserCompletedActivityToday(user.id)) {
      logActivity();
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000); // Animation duration
    }
  };
  
  const renderView = () => {
    switch (activeView) {
      case 'group':
        return <GroupView />;
      case 'dashboard':
      default:
        return <DashboardView onLogActivity={handleLogActivity} isCelebrating={showCelebration} />;
    }
  };

  const userActivities = user ? getActivitiesForUser(user.id) : [];
  const streak = calculateStreak(userActivities);

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <Logo streak={streak} />
        <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-10 w-auto p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                   <span className="text-sm font-medium hidden sm:inline-block">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto pb-20">{renderView()}</main>
      <BottomNav activeView={activeView} setActiveView={setActiveView} />

      {showCelebration && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <CelebrationCheck />
        </div>
      )}
    </div>
  );
}
