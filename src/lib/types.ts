export interface User {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
}

export interface Workout {
  userId: string;
  date: string; // ISO 8601 format
}

export interface Group {
  id: string;
  name: string;
  createdAt: string; // ISO 8601 format
  memberIds: string[];
}
