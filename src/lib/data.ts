// This file is no longer used for primary data, but may be useful for seeding or reference.
import type { User, Group, Activity } from './types';
import { subDays, formatISO } from 'date-fns';

export const USERS: User[] = [
  { id: '1', name: 'You', phone: '+11234567890', avatarUrl: 'https://i.pravatar.cc/150?u=1' },
  { id: '2', name: 'Alex', phone: '+12345678901', avatarUrl: 'https://i.pravatar.cc/150?u=2' },
  { id: '3', name: 'Sam', phone: '+13456789012', avatarUrl: 'https://i.pravatar.cc/150?u=3' },
  { id: '4', name: 'Jess', phone: '+14567890123', avatarUrl: 'https://i.pravatar.cc/150?u=4' },
];

export const GROUPS: Group[] = [
  {
    id: 'd1y-strk',
    name: 'Daily Achievers',
    createdAt: formatISO(subDays(new Date(), 30)),
    memberIds: ['1', '2', '3', '4'],
  },
];

export const ACTIVITIES: Activity[] = [
  // User 1 (You) - 5 day streak
  { id: 'a1', userId: '1', date: formatISO(new Date()) },
  { id: 'a2', userId: '1', date: formatISO(subDays(new Date(), 1)) },
  { id: 'a3', userId: '1', date: formatISO(subDays(new Date(), 2)) },
  { id: 'a4', userId: '1', date: formatISO(subDays(new Date(), 3)) },
  { id: 'a5', userId: '1', date: formatISO(subDays(new Date(), 4)) },
  { id: 'a6', userId: '1', date: formatISO(subDays(new Date(), 10)) },
  
  // User 2 (Alex) - 12 day streak
  ...Array.from({ length: 12 }).map((_, i) => ({
    id: `a_alex_${i}`,
    userId: '2',
    date: formatISO(subDays(new Date(), i)),
  })),

  // User 3 (Sam) - 3 day streak
  { id: 'a_sam_1', userId: '3', date: formatISO(subDays(new Date(), 1)) },
  { id: 'a_sam_2', userId: '3', date: formatISO(subDays(new Date(), 2)) },
  { id: 'a_sam_3', userId: '3', date: formatISO(subDays(new Date(), 3)) },

  // User 4 (Jess) - 0 day streak
  { id: 'a_jess_1', userId: '4', date: formatISO(subDays(new Date(), 3)) },
  { id: 'a_jess_2', userId: '4', date: formatISO(subDays(new Date(), 5)) },
];
