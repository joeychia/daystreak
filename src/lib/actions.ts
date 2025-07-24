'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, limit } from "firebase/firestore";
import { formatISO, isSameDay, parseISO } from 'date-fns';
import type { Activity, User } from './types';


export async function logActivityByToken(token: string): Promise<{ success: boolean, error?: string }> {
    if (!token) {
        return { success: false, error: 'Invalid token provided.' };
    }

    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("completionToken", "==", token), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: false, error: 'User not found.' };
        }

        const userDoc = querySnapshot.docs[0];
        const user = { id: userDoc.id, ...userDoc.data() } as User;

        // Check if user has already completed the activity today
        const activitiesRef = collection(db, "activities");
        const todayStr = formatISO(new Date(), { representation: 'date' });
        
        const activityQuery = query(
            activitiesRef, 
            where("userId", "==", user.id),
        );
        const activitySnapshot = await getDocs(activityQuery);
        
        const today = new Date();
        const hasCompletedToday = activitySnapshot.docs.some(doc => {
            const activity = doc.data() as Activity;
            return isSameDay(parseISO(activity.date), today);
        });

        if (hasCompletedToday) {
            return { success: true, error: 'already_completed' };
        }

        // Log the new activity
        const newActivity: Omit<Activity, 'id'> = {
            userId: user.id,
            date: formatISO(new Date()),
        };
        await addDoc(collection(db, "activities"), newActivity);

        return { success: true };

    } catch (error) {
        console.error("Error logging activity by token:", error);
        return { success: false, error: 'An unexpected error occurred on the server.' };
    }
}
