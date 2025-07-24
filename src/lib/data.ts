// This file is no longer used for primary data, but may be useful for seeding or reference.
import type { User, Group, Workout } from './types';
import { subDays, formatISO } from 'date-fns';

export const USERS: User[] = [
  { id: '1', name: 'You', phone: '+11234567890', avatarUrl: 'https://i.pravatar.cc/150?u=1' },
  { id: '2', name: 'Alex', phone: '+12345678901', avatarUrl: 'https://i.pravatar.cc/150?u=2' },
  { id: '3', name: 'Sam', phone: '+13456789012', avatarUrl: 'https://i.pravatar.cc/150?u=3' },
  { id: '4', name: 'Jess', phone: '+14567890123', avatarUrl: 'https://i.pravatar.cc/150?u=4' },
];

export const GROUPS: Group[] = [
  {
    id: 'f1t-c1rcl3',
    name: 'Daily Warriors',
    createdAt: formatISO(subDays(new Date(), 30)),
    memberIds: ['1', '2', '3', '4'],
  },
];

export const WORKOUTS: Workout[] = [
  // User 1 (You) - 5 day streak
  { id: 'w1', userId: '1', date: formatISO(new Date()) },
  { id: 'w2', userId: '1', date: formatISO(subDays(new Date(), 1)) },
  { id: 'w3', userId: '1', date: formatISO(subDays(new Date(), 2)) },
  { id: 'w4', userId: '1', date: formatISO(subDays(new Date(), 3)) },
  { id: 'w5', userId: '1', date: formatISO(subDays(new Date(), 4)) },
  { id: 'w6', userId: '1', date: formatISO(subDays(new Date(), 10)) },
  
  // User 2 (Alex) - 12 day streak
  ...Array.from({ length: 12 }).map((_, i) => ({
    id: `w_alex_${i}`,
    userId: '2',
    date: formatISO(subDays(new Date(), i)),
  })),

  // User 3 (Sam) - 3 day streak
  { id: 'w_sam_1', userId: '3', date: formatISO(subDays(new Date(), 1)) },
  { id: 'w_sam_2', userId: '3', date: formatISO(subDays(new Date(), 2)) },
  { id: 'w_sam_3', userId: '3', date: formatISO(subDays(new Date(), 3)) },

  // User 4 (Jess) - 0 day streak
  { id: 'w_jess_1', userId: '4', date: formatISO(subDays(new Date(), 3)) },
  { id: 'w_jess_2', userId: '4', date: formatISO(subDays(new Date(), 5)) },
];
