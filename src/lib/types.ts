import { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface Workout {
  id: string;
  userId: string;
  date: string; // ISO 8601 format
}

export interface Group {
  id: string;
  name: string;
  createdAt: string | Timestamp; // ISO 8601 format or Firestore Timestamp
  memberIds: string[];
}
