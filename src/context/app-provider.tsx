'use client';

import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { User, Workout, Group } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, UserCredential } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, arrayUnion, onSnapshot, Unsubscribe } from "firebase/firestore";
import { formatISO, isSameDay, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  user: User | null;
  loading: boolean;
  workouts: Workout[];
  group: Group | null;
  usersInGroup: User[];
  allGroups: Group[];
  signIn: (email: string, pass: string) => Promise<UserCredential>;
  signUp: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  logWorkout: () => void;
  getWorkoutsForUser: (userId: string) => Workout[];
  hasUserCompletedWorkoutToday: (userId: string) => boolean;
  createGroup: (name: string) => Promise<void>;
  joinGroup: (groupId: string) => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [usersInGroup, setUsersInGroup] = useState<User[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const { toast } = useToast();

  const clearAppState = useCallback(() => {
    setUser(null);
    setWorkouts([]);
    setGroup(null);
    setUsersInGroup([]);
    setAllGroups([]);
  }, []);

  const fetchGroupData = useCallback(async (groupId: string) => {
    const groupDocRef = doc(db, "groups", groupId);
    const groupDoc = await getDoc(groupDocRef);
    if (groupDoc.exists()) {
      const groupData = { id: groupDoc.id, ...groupDoc.data() } as Group;
      setGroup(groupData);

      // Fetch users and their workouts
      const userDocs = await getDocs(query(collection(db, "users"), where("id", "in", groupData.memberIds)));
      const groupUsers = userDocs.docs.map(d => d.data() as User);
      setUsersInGroup(groupUsers);

      const workoutDocs = await getDocs(query(collection(db, "workouts"), where("userId", "in", groupData.memberIds)));
      const groupWorkouts = workoutDocs.docs.map(d => ({...d.data(), id: d.id}) as Workout);
      setWorkouts(groupWorkouts);
    }
  }, []);

  useEffect(() => {
    let groupListener: Unsubscribe | undefined;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (groupListener) groupListener();

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
        
        // Listen for all groups
        const allGroupsQuery = query(collection(db, "groups"));
        onSnapshot(allGroupsQuery, (snapshot) => {
            const groups = snapshot.docs.map(d => ({...d.data(), id: d.id}) as Group);
            setAllGroups(groups);
        });
        
        // Check if user is in a group and subscribe to it
        if (userData.groupId) {
          groupListener = onSnapshot(doc(db, "groups", userData.groupId), async (groupDoc) => {
             if (groupDoc.exists()) {
                const groupData = { id: groupDoc.id, ...groupDoc.data() } as Group;
                setGroup(groupData);

                // Fetch all users and workouts for the group
                 const userDocs = await getDocs(query(collection(db, "users"), where("id", "in", groupData.memberIds)));
                 const groupUsers = userDocs.docs.map(d => d.data() as User);
                 setUsersInGroup(groupUsers);

                 const workoutDocs = await getDocs(query(collection(db, "workouts"), where("userId", "in", groupData.memberIds)));
                 const groupWorkouts = workoutDocs.docs.map(d => ({...d.data(), id: d.id}) as Workout);
                 setWorkouts(groupWorkouts);
             } else {
                 // The group may have been deleted.
                 setGroup(null);
                 setUsersInGroup([]);
                 setWorkouts([]);
             }
          });
        } else {
          const workoutsQuery = query(collection(db, "workouts"), where("userId", "==", userData.id));
          const workoutsSnapshot = await getDocs(workoutsQuery);
          const fetchedWorkouts = workoutsSnapshot.docs.map(d => ({...d.data(), id: d.id})) as Workout[];
          setWorkouts(fetchedWorkouts);
          setGroup(null);
          setUsersInGroup([]);
        }

      } else {
        clearAppState();
      }
      setLoading(false);
    });
    
    return () => {
      unsubscribe();
      if (groupListener) groupListener();
    };
  }, [clearAppState, fetchGroupData]);

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
    // Optimistically update UI, real data comes from snapshot listener
    setWorkouts(prevWorkouts => [...prevWorkouts, {id: docRef.id, ...newWorkout}]);
  };
  
  const createGroup = async (name: string) => {
      if (!user) return;
      const newGroup: Omit<Group, 'id'> = {
          name,
          createdAt: formatISO(new Date()),
          ownerId: user.id,
          memberIds: [user.id]
      }
      const groupRef = await addDoc(collection(db, "groups"), newGroup);
      await updateDoc(doc(db, "users", user.id), { groupId: groupRef.id });
       toast({
        title: "Group Created!",
        description: `You are now the owner of "${name}".`,
      });
  }

  const joinGroup = async (groupId: string) => {
    if (!user) return;
    try {
        await updateDoc(doc(db, "groups", groupId), {
            memberIds: arrayUnion(user.id)
        });
        await updateDoc(doc(db, "users", user.id), { groupId });
         toast({
            title: "Successfully Joined Group!",
            description: "Start streaking with your new group members.",
        });
    } catch(error: any) {
        toast({
            title: "Failed to Join Group",
            description: error.message || "An unexpected error occurred.",
            variant: "destructive",
        });
        console.error("Error joining group:", error);
    }
  }


  const value = {
    user,
    loading,
    workouts,
    group,
    usersInGroup,
    allGroups,
    signIn,
    signUp,
    logout,
    logWorkout,
    getWorkoutsForUser,
    hasUserCompletedWorkoutToday,
    createGroup,
    joinGroup,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
