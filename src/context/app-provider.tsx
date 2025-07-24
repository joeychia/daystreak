'use client';

import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { User, Activity, Group } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, User as FirebaseUser } from "firebase/auth";
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
  signIn: (email: string, pass: string) => Promise<void>;
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

  const handleAuthError = useCallback((error: any, action: 'signup' | 'signin') => {
    console.error(`Error during ${action}:`, error);
    toast({
      title: "Authentication Failed",
      description: error.message || "An unexpected error occurred. Please try again.",
      variant: "destructive",
    });
  }, [toast]);

  // Handle auth state changes and fetch user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUser({ id: userDoc.id, ...userDoc.data() } as User);
          }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            toast({ title: "Error", description: "Could not load your profile.", variant: "destructive" });
        }
      } else {
        clearAppState();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [clearAppState, toast]);

  // Subscribe to group, users, and activities data
  useEffect(() => {
    if (!user) return;

    let groupUnsubscribe: Unsubscribe | undefined;
    let activitiesUnsubscribe: Unsubscribe | undefined;

    const groupDocRef = doc(db, "groups", SINGLE_GROUP_ID);
    
    groupUnsubscribe = onSnapshot(groupDocRef, async (groupDoc) => {
      if (!groupDoc.exists()) {
          setGroup(null);
          setUsersInGroup([]);
          return;
      }
      
      const groupData = { id: groupDoc.id, ...groupDoc.data() } as Group;
      setGroup(groupData);
      
      const { memberIds } = groupData;
      if (memberIds && memberIds.length > 0) {
        try {
            const usersQuery = query(collection(db, "users"), where('id', 'in', memberIds));
            const usersSnapshot = await getDocs(usersQuery);
            const groupUsers = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }) as User);
            setUsersInGroup(groupUsers);

            const activitiesQuery = query(collection(db, "activities"), where('userId', 'in', memberIds));
            activitiesUnsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
                const groupActivities = snapshot.docs.map(d => ({ ...d.data(), id: d.id }) as Activity);
                setActivities(groupActivities);
            });
        } catch(error) {
            console.error("Error fetching group data:", error);
            toast({ title: "Error", description: "Could not load group data.", variant: "destructive" });
        }

      } else {
        setUsersInGroup([]);
        setActivities([]);
      }
    }, (error) => {
        console.error("Error fetching group:", error);
        toast({ title: "Error", description: "Could not load group information.", variant: "destructive" });
    });

    return () => {
      if (groupUnsubscribe) groupUnsubscribe();
      if (activitiesUnsubscribe) activitiesUnsubscribe();
    };
  }, [user, toast]);

  const ensureDefaultGroupExists = async () => {
    const groupDocRef = doc(db, "groups", SINGLE_GROUP_ID);
    try {
        const groupDoc = await getDoc(groupDocRef);
        if (!groupDoc.exists()) {
          const newGroup: Group = {
            id: SINGLE_GROUP_ID,
            name: 'Day Streak Circle',
            createdAt: formatISO(new Date()),
            ownerId: 'system',
            memberIds: []
          }
          await setDoc(groupDocRef, newGroup);
        }
    } catch(error) {
        console.error("Error ensuring default group exists:", error);
        toast({ title: "Setup Error", description: "Failed to create the default group.", variant: "destructive" });
    }
    return groupDocRef;
  }

  const addUserToGroup = async (firebaseUser: FirebaseUser) => {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const groupDocRef = doc(db, "groups", SINGLE_GROUP_ID);
      try {
          await updateDoc(userDocRef, { groupId: SINGLE_GROUP_ID });
          await updateDoc(groupDocRef, { memberIds: arrayUnion(firebaseUser.uid) });
      } catch (error) {
           console.error("Error adding user to group:", error);
           toast({ title: "Error", description: "Failed to add you to the group.", variant: "destructive" });
      }
  }
  
  const signIn = async (email: string, pass: string) => {
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        handleAuthError(error, 'signin');
        throw error;
    }
  };
  
  const signUp = async (email: string, pass: string) => {
    try {
        await ensureDefaultGroupExists();
        const credential = await createUserWithEmailAndPassword(auth, email, pass);
        const firebaseUser = credential.user;

        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.email!.split('@')[0],
          avatarUrl: `https://api.dicebear.com/8.x/big-smiles/svg?seed=${firebaseUser.uid}`,
          groupId: SINGLE_GROUP_ID,
        };
        await setDoc(doc(db, "users", firebaseUser.uid), newUser);
        await addUserToGroup(firebaseUser);
    } catch (error) {
        handleAuthError(error, 'signup');
        throw error;
    }
  };

  const logout = () => {
    auth.signOut().catch(error => {
        console.error("Error signing out:", error);
        toast({ title: "Error", description: "Failed to sign out.", variant: "destructive" });
    });
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
    
    // Optimistic update for instant UI feedback
    const tempId = `temp-${Date.now()}`;
    setActivities(prevActivities => [...prevActivities, {id: tempId, ...newActivity}]);
    
    try {
        await addDoc(collection(db, "activities"), newActivity);
    } catch(error) {
        console.error("Error logging activity:", error);
        toast({
            title: "Error",
            description: "Could not save your activity. Please try again.",
            variant: "destructive"
        });
        // Rollback optimistic update on error
        setActivities(prev => prev.filter(a => a.id !== tempId));
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
