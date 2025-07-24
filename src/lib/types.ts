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
