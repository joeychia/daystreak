'use client';

import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { User, Workout, Group } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, UserCredential } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, onSnapshot, Unsubscribe, addDoc } from "firebase/firestore";
import { formatISO, isSameDay, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const SINGLE_GROUP_ID = "default-group";

interface AppContextType {
  user: User | null;
  loading: boolean;
  workouts: Workout[];
  group: Group | null;
  usersInGroup: User[];
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
  const [group, setGroup] = useState<Group | null>(null);
  const [usersInGroup, setUsersInGroup] = useState<User[]>([]);
  const { toast } = useToast();

  const clearAppState = useCallback(() => {
    setUser(null);
    setWorkouts([]);
    setGroup(null);
    setUsersInGroup([]);
  }, []);

  const ensureDefaultGroupExists = async () => {
    const groupDocRef = doc(db, "groups", SINGLE_GROUP_ID);
    const groupDoc = await getDoc(groupDocRef);
    if (!groupDoc.exists()) {
      const newGroup: Group = {
        id: SINGLE_GROUP_ID,
        name: 'Fitness Circle',
        createdAt: formatISO(new Date()),
        ownerId: 'system', // No single owner in this model
        memberIds: []
      }
      await setDoc(groupDocRef, newGroup);
    }
    return groupDocRef;
  }

  useEffect(() => {
    let groupListener: Unsubscribe | undefined;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (groupListener) groupListener();

      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() } as User);
        }
        
        // Everyone is in the same group.
        const groupDocRef = await ensureDefaultGroupExists();

        groupListener = onSnapshot(groupDocRef, async (groupDoc) => {
            if (groupDoc.exists()) {
                const groupData = { id: groupDoc.id, ...groupDoc.data() } as Group;
                setGroup(groupData);

                if (groupData.memberIds.length > 0) {
                    const usersQuery = query(collection(db, "users"), where('id', 'in', groupData.memberIds));
                    const workoutsQuery = query(collection(db, "workouts"), where('userId', 'in', groupData.memberIds));

                    const [userDocs, workoutDocs] = await Promise.all([getDocs(usersQuery), getDocs(workoutsQuery)]);
                    
                    const groupUsers = userDocs.docs.map(d => ({id: d.id, ...d.data()}) as User);
                    setUsersInGroup(groupUsers);

                    const groupWorkouts = workoutDocs.docs.map(d => ({...d.data(), id: d.id}) as Workout);
                    setWorkouts(groupWorkouts);
                } else {
                    setUsersInGroup([]);
                    setWorkouts([]);
                }
            }
        });

      } else {
        clearAppState();
      }
      setLoading(false);
    });
    
    return () => {
      unsubscribe();
      if (groupListener) groupListener();
    };
  }, [clearAppState, toast]);

  const signIn = async (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signUp = async (email: string, pass: string) => {
    const groupDocRef = await ensureDefaultGroupExists();
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    const firebaseUser = credential.user;

    const userDocRef = doc(db, "users", firebaseUser.uid);
    const newUser: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      name: firebaseUser.email!.split('@')[0],
      avatarUrl: `https://api.dicebear.com/8.x/big-smiles/svg?seed=${firebaseUser.uid}`,
      groupId: SINGLE_GROUP_ID,
    };
    await setDoc(userDocRef, newUser);
    setUser(newUser);
    
    // Add user to the default group
    await updateDoc(groupDocRef, {
        memberIds: arrayUnion(firebaseUser.uid)
    });
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
    // Optimistically update UI, real data comes from snapshot listener
    setWorkouts(prevWorkouts => [...prevWorkouts, {id: docRef.id, ...newWorkout}]);
  };

  const value = {
    user,
    loading,
    workouts,
    group,
    usersInGroup,
    signIn,
    signUp,
    logout,
    logWorkout,
    getWorkoutsForUser,
    hasUserCompletedWorkoutToday,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
