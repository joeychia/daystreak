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
    console.log("AppProvider: Subscribing to onAuthStateChanged.");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("AppProvider: onAuthStateChanged triggered.");
      if (firebaseUser) {
        console.log(`AppProvider: User is authenticated with UID: ${firebaseUser.uid}. Starting data fetch.`);
        setLoading(true);
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          console.log(`AppProvider: Fetched user document. Exists: ${userDoc.exists()}`);
          
          let userData: User;
          if (userDoc.exists()) {
            userData = { id: userDoc.id, ...userDoc.data() } as User;
          } else {
            console.log("AppProvider: User document doesn't exist, creating a new one.");
            userData = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: firebaseUser.email!.split('@')[0],
              avatarUrl: `https://i.pravatar.cc/150?u=${firebaseUser.uid}`
            };
            await setDoc(userDocRef, userData);
            console.log("AppProvider: New user document created.");
          }
          
          console.log("AppProvider: Setting user state.", userData);
          setUser(userData);

          const groupsRef = collection(db, "groups");
          const q = query(groupsRef, where("memberIds", "array-contains", userData.id));
          const snapshot = await getDocs(q);
          console.log(`AppProvider: Fetched groups. Found: ${!snapshot.empty}`);

          if (!snapshot.empty) {
              const groupDoc = snapshot.docs[0];
              const groupData = { id: groupDoc.id, ...groupDoc.data() } as Group;
              console.log("AppProvider: Setting group state.", groupData);
              setGroup(groupData);
              
              const usersQuery = query(collection(db, "users"), where("id", "in", groupData.memberIds));
              const usersSnapshot = await getDocs(usersQuery);
              const fetchedUsers = usersSnapshot.docs.map(d => ({...d.data(), id: d.id})) as User[];
              console.log("AppProvider: Setting users state.", fetchedUsers);
              setUsers(fetchedUsers);

              const workoutsQuery = query(collection(db, "workouts"), where("userId", "in", groupData.memberIds));
              const workoutsSnapshot = await getDocs(workoutsQuery);
              const fetchedWorkouts = workoutsSnapshot.docs.map(d => ({...d.data(), id: d.id})) as Workout[];
              console.log("AppProvider: Setting workouts state.", fetchedWorkouts);
              setWorkouts(fetchedWorkouts);
          } else {
              console.log("AppProvider: User is not in a group. Setting group to null and fetching individual data.");
              setGroup(null);
              setUsers([userData]); // Only the current user
              const workoutsQuery = query(collection(db, "workouts"), where("userId", "==", userData.id));
              const workoutsSnapshot = await getDocs(workoutsQuery);
              const fetchedWorkouts = workoutsSnapshot.docs.map(d => ({...d.data(), id: d.id})) as Workout[];
              console.log("AppProvider: Setting workouts state for individual user.", fetchedWorkouts);
              setWorkouts(fetchedWorkouts);
          }
        } catch (error) {
          console.error("AppProvider: Error during data fetching.", error);
        } finally {
          console.log("AppProvider: All data fetched, setting loading to false.");
          setLoading(false);
        }
      } else {
        console.log("AppProvider: User is not authenticated. Resetting state.");
        setUser(null);
        setGroup(null);
        setUsers([]);
        setWorkouts([]);
        console.log("AppProvider: State reset, setting loading to false.");
        setLoading(false);
      }
    });
    
    return () => {
      console.log("AppProvider: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    }
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
    // Let the onAuthStateChanged listener handle setting the user state
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
    setUsers(prev => [...prev, user]);
    return newGroup;
  };

  const joinGroup = async (groupId: string): Promise<Group | null> => {
    if (!user) throw new Error("User must be logged in to join a group.");
    
    const groupDocRef = doc(db, "groups", groupId);
    const groupDoc = await getDoc(groupDocRef);
    if (!groupDoc.exists()) return null;

    const groupToJoin = { id: groupDoc.id, ...groupDoc.data() } as Group;

    if (groupToJoin.memberIds.includes(user.id)) return groupToJoin;

    await updateDoc(groupDocRef, {
      memberIds: arrayUnion(user.id)
    });
    
    const groupSnapshot = await getDoc(doc(db, "groups", groupId));
    const updatedGroup = { id: groupSnapshot.id, ...groupSnapshot.data() } as Group;

    const usersQuery = query(collection(db, "users"), where("id", "in", updatedGroup.memberIds));
    const usersSnapshot = await getDocs(usersQuery);
    const fetchedUsers = usersSnapshot.docs.map(d => ({...d.data(), id: d.id})) as User[];

    const workoutsQuery = query(collection(db, "workouts"), where("userId", "in", updatedGroup.memberIds));
    const workoutsSnapshot = await getDocs(workoutsQuery);
    const fetchedWorkouts = workoutsSnapshot.docs.map(d => ({...d.data(), id: d.id})) as Workout[];

    setGroup(updatedGroup);
    setUsers(fetchedUsers);
    setWorkouts(fetchedWorkouts);
    
    return updatedGroup;
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
