'use client';

import React, { createContext, useState, ReactNode, useMemo, useEffect } from 'react';
import type { User, Group, Workout } from '@/lib/types';
import { USERS, GROUPS, WORKOUTS } from '@/lib/data';
import { formatISO, isSameDay, parseISO } from 'date-fns';

interface AppContextType {
  user: User | null;
  users: User[];
  group: Group | null;
  workouts: Workout[];
  login: (phone: string) => User | null;
  logout: () => void;
  logWorkout: () => void;
  createGroup: (name: string) => Group;
  joinGroup: (groupId: string) => Group | null;
  getWorkoutsForUser: (userId: string) => Workout[];
  getUserById: (userId: string) => User | undefined;
  hasUserCompletedWorkoutToday: (userId: string) => boolean;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Load initial data from "backend"
    setUsers(USERS);
    setGroups(GROUPS);
    setWorkouts(WORKOUTS);

    // Simulate keeping the user logged in
    const loggedInUserId = localStorage.getItem('fitnessCircleUser');
    if (loggedInUserId) {
      const user = USERS.find(u => u.id === loggedInUserId);
      if (user) {
        setCurrentUser(user);
      }
    }
  }, []);

  const login = (phone: string): User | null => {
    const userToLogin = users.find(u => u.phone === phone);
    if (userToLogin) {
      setCurrentUser(userToLogin);
      localStorage.setItem('fitnessCircleUser', userToLogin.id);
      return userToLogin;
    }
    // For this mock, we'll only allow existing users to log in.
    // A real app would have a sign-up flow.
    return null;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('fitnessCircleUser');
  };
  
  const getUserById = (userId: string) => users.find(u => u.id === userId);

  const getWorkoutsForUser = (userId: string) => workouts.filter(w => w.userId === userId);

  const hasUserCompletedWorkoutToday = (userId: string) => {
    const today = new Date();
    return workouts.some(w => w.userId === userId && isSameDay(parseISO(w.date), today));
  };

  const logWorkout = () => {
    if (!currentUser || hasUserCompletedWorkoutToday(currentUser.id)) return;

    const newWorkout: Workout = {
      userId: currentUser.id,
      date: formatISO(new Date()),
    };
    setWorkouts(prevWorkouts => [...prevWorkouts, newWorkout]);
  };
  
  const group = useMemo(() => {
    if (!currentUser) return null;
    return groups.find(g => g.memberIds.includes(currentUser.id)) || null;
  }, [currentUser, groups]);

  const createGroup = (name: string): Group => {
    if (!currentUser) throw new Error("User must be logged in to create a group.");
    
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name,
      createdAt: formatISO(new Date()),
      memberIds: [currentUser.id],
    };
    setGroups(prev => [...prev, newGroup]);
    return newGroup;
  };

  const joinGroup = (groupId: string): Group | null => {
    if (!currentUser) throw new Error("User must be logged in to join a group.");
    
    const groupToJoin = groups.find(g => g.id === groupId);
    if (!groupToJoin) return null;

    if (groupToJoin.memberIds.includes(currentUser.id)) return groupToJoin; // Already a member

    setGroups(prev => prev.map(g => 
      g.id === groupId ? { ...g, memberIds: [...g.memberIds, currentUser.id] } : g
    ));

    return { ...groupToJoin, memberIds: [...groupToJoin.memberIds, currentUser.id] };
  };

  const value = {
    user: currentUser,
    users,
    group,
    workouts,
    login,
    logout,
    logWorkout,
    createGroup,
    joinGroup,
    getWorkoutsForUser,
    getUserById,
    hasUserCompletedWorkoutToday,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
