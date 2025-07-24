'use client';

import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { User, Activity, Group } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, User as FirebaseUser } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, onSnapshot, Unsubscribe, addDoc } from "firebase/firestore";
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

// Helper to generate a random token
const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 24; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}


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

  // Subscribe to all users, activities, and group data once a user is logged in
  useEffect(() => {
    if (!user) return;

    let groupUnsubscribe: Unsubscribe | undefined;
    let usersUnsubscribe: Unsubscribe | undefined;
    let activitiesUnsubscribe: Unsubscribe | undefined;

    try {
        const groupDocRef = doc(db, "groups", SINGLE_GROUP_ID);
        groupUnsubscribe = onSnapshot(groupDocRef, (groupDoc) => {
          if (groupDoc.exists()) {
            const groupData = { id: groupDoc.id, ...groupDoc.data() } as Group;
            setGroup(groupData);
          } else {
            setGroup(null);
          }
        }, (error) => {
            console.error("Error fetching group:", error);
            toast({ title: "Error", description: "Could not load group information.", variant: "destructive" });
        });

        const usersQuery = query(collection(db, "users"));
        usersUnsubscribe = onSnapshot(usersQuery, (snapshot) => {
            const allUsers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as User);
            setUsersInGroup(allUsers);
        }, (error) => {
            console.error("Error fetching users:", error);
            toast({ title: "Error", description: "Could not load user data.", variant: "destructive" });
        });
        
        const activitiesQuery = query(collection(db, "activities"));
        activitiesUnsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
            const allActivities = snapshot.docs.map(d => ({ ...d.data(), id: d.id }) as Activity);
            setActivities(allActivities);
        }, (error) => {
            console.error("Error fetching activities:", error);
            toast({ title: "Error", description: "Could not load activity data.", variant: "destructive" });
        });

    } catch (error) {
        console.error("Error setting up data subscriptions:", error);
        toast({ title: "Error", description: "There was a problem loading app data.", variant: "destructive" });
    }

    return () => {
        if (groupUnsubscribe) groupUnsubscribe();
        if (usersUnsubscribe) usersUnsubscribe();
        if (activitiesUnsubscribe) activitiesUnsubscribe();
    }
  }, [user, toast]);

  const ensureDefaultGroupExists = async () => {
    const groupDocRef = doc(db, "groups", SINGLE_GROUP_ID);
    try {
        const groupDoc = await getDoc(groupDocRef);
        if (!groupDoc.exists()) {
          // Omit memberIds from the new group object
          const newGroup: Omit<Group, 'id'> = {
            name: 'Day Streak Circle',
            createdAt: formatISO(new Date()),
            ownerId: 'system',
          }
          await setDoc(groupDocRef, newGroup);
        }
    } catch(error) {
        console.error("Error ensuring default group exists:", error);
        toast({ title: "Setup Error", description: "Failed to create the default group.", variant: "destructive" });
    }
    return groupDocRef;
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
          completionToken: generateToken(),
        };
        await setDoc(doc(db, "users", firebaseUser.uid), newUser);
        // No longer need to add user to group document
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
