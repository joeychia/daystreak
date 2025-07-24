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
    setLoading(false);
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

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() } as User);
        }
        await ensureDefaultGroupExists();
      } else {
        clearAppState();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [clearAppState]);

  // Subscribe to group and user data
  useEffect(() => {
    if (!user) return;

    const groupDocRef = doc(db, "groups", SINGLE_GROUP_ID);
    const groupListener = onSnapshot(groupDocRef, async (groupDoc) => {
      if (groupDoc.exists()) {
        const groupData = { id: groupDoc.id, ...groupDoc.data() } as Group;
        setGroup(groupData);

        if (groupData.memberIds && groupData.memberIds.length > 0) {
          const usersQuery = query(collection(db, "users"), where('id', 'in', groupData.memberIds));
          const userDocs = await getDocs(usersQuery);
          const groupUsers = userDocs.docs.map(d => ({ id: d.id, ...d.data() }) as User);
          setUsersInGroup(groupUsers);
        } else {
          setUsersInGroup([]);
        }
      }
    });

    return () => groupListener();
  }, [user]);

  // Subscribe to workout data for all users in the group
  useEffect(() => {
    if (!group || !group.memberIds || group.memberIds.length === 0) {
      setWorkouts([]);
      return;
    }

    const workoutsQuery = query(collection(db, "workouts"), where('userId', 'in', group.memberIds));
    const workoutsListener = onSnapshot(workoutsQuery, (snapshot) => {
      const groupWorkouts = snapshot.docs.map(d => ({ ...d.data(), id: d.id }) as Workout);
      setWorkouts(groupWorkouts);
    }, (error) => {
      console.error("Error fetching workouts:", error);
      toast({
        title: "Error",
        description: "Could not load workout data.",
        variant: "destructive"
      });
    });

    return () => workoutsListener();
  }, [group, toast]);


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
    
    // The onSnapshot listener will update from the database, but this provides instant UI feedback.
    try {
        const docRef = await addDoc(collection(db, "workouts"), newWorkout);
        setWorkouts(prevWorkouts => [...prevWorkouts, {id: docRef.id, ...newWorkout}]);
    } catch(error) {
        console.error("Error logging workout:", error);
        toast({
            title: "Error",
            description: "Could not save your workout. Please try again.",
            variant: "destructive"
        })
    }
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
