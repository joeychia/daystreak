'use client';

import { cn } from '@/lib/utils';
import { CalendarSolidIcon } from './icons/calendar-solid';
import { SquarePen } from 'lucide-react';

interface BottomNavProps {
  activeView: string;
  setActiveView: (view: 'dashboard' | 'calendar') => void;
}

const navItems = [
  { id: 'dashboard', label: 'Today', icon: SquarePen },
  { id: 'calendar', label: 'Calendar', icon: CalendarSolidIcon },
];

export function BottomNav({ activeView, setActiveView }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t bg-background/80 backdrop-blur-sm">
      <div className="flex justify-around p-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id as any)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-lg p-2 text-muted-foreground transition-colors w-24',
              activeView === item.id ? 'text-primary' : 'hover:text-primary/80'
            )}
          >
            <item.icon
              className={cn(
                'h-6 w-6 transition-transform',
                activeView === item.id && 'scale-110'
              )}
            />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
