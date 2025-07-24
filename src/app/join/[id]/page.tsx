export interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  groupId?: string;
}

export interface Group {
    id: string;
    name: string;
    createdAt: string; // ISO 8601 format
    ownerId: string;
    memberIds: string[];
}

export interface Workout {
  id: string;
  userId: string;
  date: string; // ISO 8601 format
}