'use client';

import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { User, Activity, Group } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, UserCredential } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, onSnapshot, Unsubscribe, addDoc } from "firebase/firestore";
import { formatISO, isSameDay, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const SINGLE_GROUP_ID = "default-group";

interface AppContextType {
  user: User | null;
  loading: boolean;
  activities: Activity[];
  group: Group | null;
  usersInGroup: User[];
  signIn: (email: string, pass: string) => Promise<UserCredential>;
  signUp: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  logActivity: () => void;
  getActivitiesForUser: (userId: string) => Activity[];
  hasUserCompletedActivityToday: (userId: string) => boolean;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [usersInGroup, setUsersInGroup] = useState<User[]>([]);
  const { toast } = useToast();

  const clearAppState = useCallback(() => {
    setUser(null);
    setActivities([]);
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
        name: 'Day Streak Circle',
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
          const userData = { id: userDoc.id, ...userDoc.data() } as User;
          setUser(userData);
           // Ensure user is in the group, helpful for legacy users.
          if (!userData.groupId) {
            const groupDocRef = doc(db, "groups", SINGLE_GROUP_ID);
            await updateDoc(userDocRef, { groupId: SINGLE_GROUP_ID });
            await updateDoc(groupDocRef, { memberIds: arrayUnion(firebaseUser.uid) });
          }
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
    const unsubscribeGroup = onSnapshot(groupDocRef, async (groupDoc) => {
      if (groupDoc.exists()) {
        const groupData = { id: groupDoc.id, ...groupDoc.data() } as Group;
        setGroup(groupData);

        if (groupData.memberIds && groupData.memberIds.length > 0) {
          // Fetch all users in the group
          const usersQuery = query(collection(db, "users"), where('id', 'in', groupData.memberIds));
          const usersSnapshot = await getDocs(usersQuery);
          const groupUsers = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }) as User);
          setUsersInGroup(groupUsers);
        } else {
          setUsersInGroup([]);
        }
      }
    });
    
    return () => {
      unsubscribeGroup();
    };
  }, [user]);

  // Subscribe to activity data for all users in the group
  useEffect(() => {
    if (!group || !group.memberIds || group.memberIds.length === 0) {
      setActivities([]);
      return;
    }

    const activitiesQuery = query(collection(db, "activities"), where('userId', 'in', group.memberIds));
    const unsubscribeActivities = onSnapshot(activitiesQuery, (snapshot) => {
      const groupActivities = snapshot.docs.map(d => ({ ...d.data(), id: d.id }) as Activity);
      setActivities(groupActivities);
    }, (error) => {
      console.error("Error fetching activities:", error);
      toast({
        title: "Error",
        description: "Could not load activity data.",
        variant: "destructive"
      });
    });

    return () => unsubscribeActivities();
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
    // The user state will be set by the onAuthStateChanged listener.
    
    // Add user to the default group
    await updateDoc(groupDocRef, {
        memberIds: arrayUnion(firebaseUser.uid)
    });
  };

  const logout = () => {
    auth.signOut();
  };
  
  const getActivitiesForUser = (userId: string) => activities.filter(w => w.userId === userId);

  const hasUserCompletedActivityToday = (userId: string) => {
    const today = new Date();
    return activities.some(w => w.userId === userId && isSameDay(parseISO(w.date), today));
  };

  const logActivity = async () => {
    if (!user || hasUserCompletedActivityToday(user.id)) return;

    const newActivity: Omit<Activity, 'id'> = {
      userId: user.id,
      date: formatISO(new Date()),
    };
    
    // The onSnapshot listener will update from the database, but this provides instant UI feedback.
    try {
        const docRef = await addDoc(collection(db, "activities"), newActivity);
        setActivities(prevActivities => [...prevActivities, {id: docRef.id, ...newActivity}]);
    } catch(error) {
        console.error("Error logging activity:", error);
        toast({
            title: "Error",
            description: "Could not save your activity. Please try again.",
            variant: "destructive"
        })
    }
  };

  const value = {
    user,
    loading,
    activities,
    group,
    usersInGroup,
    signIn,
    signUp,
    logout,
    logActivity,
    getActivitiesForUser,
    hasUserCompletedActivityToday,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
