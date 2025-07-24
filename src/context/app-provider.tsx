'use client';

import React, { createContext, useState, ReactNode, useMemo, useEffect } from 'react';
import type { User, Group, Workout } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, UserCredential } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp, addDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { formatISO, isSameDay, parseISO } from 'date-fns';

interface AppContextType {
  user: User | null;
  loading: boolean;
  group: Group | null;
  users: User[];
  workouts: Workout[];
  signIn: (email: string, pass: string) => Promise<UserCredential>;
  signUp: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  logWorkout: () => void;
  createGroup: (name: string) => Promise<Group>;
  joinGroup: (groupId: string) => Promise<Group | null>;
  getWorkoutsForUser: (userId: string) => Workout[];
  getUserById: (userId: string) => User | undefined;
  hasUserCompletedWorkoutToday: (userId: string) => boolean;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true); // Start loading when auth state is confirmed
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

        const groupsRef = collection(db, "groups");
        const q = query(groupsRef, where("memberIds", "array-contains", userData.id));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const groupDoc = snapshot.docs[0];
            const groupData = { id: groupDoc.id, ...groupDoc.data() } as Group;
            setGroup(groupData);
            
            const usersQuery = query(collection(db, "users"), where("id", "in", groupData.memberIds));
            const usersSnapshot = await getDocs(usersQuery);
            setUsers(usersSnapshot.docs.map(d => ({...d.data(), id: d.id})) as User[]);

            const workoutsQuery = query(collection(db, "workouts"), where("userId", "in", groupData.memberIds));
            const workoutsSnapshot = await getDocs(workoutsQuery);
            setWorkouts(workoutsSnapshot.docs.map(d => ({...d.data(), id: d.id})) as Workout[]);
        } else {
            setGroup(null);
            setUsers([userData]);
            const workoutsQuery = query(collection(db, "workouts"), where("userId", "==", userData.id));
            const workoutsSnapshot = await getDocs(workoutsQuery);
            setWorkouts(workoutsSnapshot.docs.map(d => ({...d.data(), id: d.id})) as Workout[]);
        }
        setLoading(false); // Finish loading after all data is fetched
      } else {
        setUser(null);
        setGroup(null);
        setUsers([]);
        setWorkouts([]);
        setLoading(false); // Finish loading for logged-out state
      }
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
    setUser(newUser);
  };

  const logout = () => {
    auth.signOut();
  };
  
  const getUserById = (userId: string) => users.find(u => u.id === userId);

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
  
  const createGroup = async (name: string): Promise<Group> => {
    if (!user) throw new Error("User must be logged in to create a group.");
    
    const newGroupData = {
      name,
      createdAt: serverTimestamp(),
      memberIds: [user.id],
    };
    const docRef = await addDoc(collection(db, "groups"), newGroupData);
    const newGroup: Group = {
      id: docRef.id,
      name,
      createdAt: new Date().toISOString(),
      memberIds: [user.id]
    }
    setGroup(newGroup);
    setUsers(prev => [...prev, user]); // Add self to users list
    return newGroup;
  };

  const joinGroup = async (groupId: string): Promise<Group | null> => {
    if (!user) throw new Error("User must be logged in to join a group.");
    
    const groupDocRef = doc(db, "groups", groupId);
    const groupDoc = await getDoc(groupDocRef);
    if (!groupDoc.exists()) return null;

    const groupToJoin = { id: groupDoc.id, ...groupDoc.data() } as Group;

    if (groupToJoin.memberIds.includes(user.id)) return groupToJoin; // Already a member

    await updateDoc(groupDocRef, {
      memberIds: arrayUnion(user.id)
    });
    
    // Trigger a re-fetch by updating a dummy state or letting the auth listener handle it
    // Forcing a reload is a simple way to ensure all data is consistent
    window.location.reload(); 
    
    return { ...groupToJoin, memberIds: [...groupToJoin.memberIds, user.id] };
  };

  const value = {
    user,
    loading,
    group,
    users,
    workouts,
    signIn,
    signUp,
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
