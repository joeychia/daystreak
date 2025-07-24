'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import type { User, Workout } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, UserCredential } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { formatISO, isSameDay, parseISO } from 'date-fns';

interface AppContextType {
  user: User | null;
  loading: boolean;
  workouts: Workout[];
  signIn: (email: string, pass: string) => Promise<UserCredential>;
  signUp: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  logWorkout: () => void;
  getWorkoutsForUser: (userId: string) => Workout[];
  hasUserCompletedWorkoutToday: (userId: string) => boolean;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        let userData: User;
        if (userDoc.exists()) {
          userData = { id: userDoc.id, ...userDoc.data() } as User;
        } else {
          userData = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            name: firebaseUser.email!.split('@')[0],
            avatarUrl: `https://i.pravatar.cc/150?u=${firebaseUser.uid}`
          };
          await setDoc(userDocRef, userData);
        }
        setUser(userData);
        
        const workoutsQuery = query(collection(db, "workouts"), where("userId", "==", userData.id));
        const workoutsSnapshot = await getDocs(workoutsQuery);
        const fetchedWorkouts = workoutsSnapshot.docs.map(d => ({...d.data(), id: d.id})) as Workout[];
        setWorkouts(fetchedWorkouts);

      } else {
        setUser(null);
        setWorkouts([]);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signUp = async (email: string, pass: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    const firebaseUser = credential.user;

    const userDocRef = doc(db, "users", firebaseUser.uid);
    const newUser: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      name: firebaseUser.email!.split('@')[0],
      avatarUrl: `https://i.pravatar.cc/150?u=${firebaseUser.uid}`
    };
    await setDoc(userDocRef, newUser);
  };

  const logout = () => {
    auth.signOut();
  };
  
  const getWorkoutsForUser = (userId: string) => workouts.filter(w => w.userId === userId);

  const hasUserCompletedWorkoutToday = (userId: string) => {
    const today = new Date();
    return workouts.some(w => w.userId === userId && isSameDay(parseISO(w.date), today));
  };

  const logWorkout = async () => {
    if (!user || hasUserCompletedWorkoutToday(user.id)) return;

    const newWorkout: Omit<Workout, 'id'> = {
      userId: user.id,
      date: formatISO(new Date()),
    };
    const docRef = await addDoc(collection(db, "workouts"), newWorkout);
    setWorkouts(prevWorkouts => [...prevWorkouts, {id: docRef.id, ...newWorkout}]);
  };

  const value = {
    user,
    loading,
    workouts,
    signIn,
    signUp,
    logout,
    logWorkout,
    getWorkoutsForUser,
    hasUserCompletedWorkoutToday,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
