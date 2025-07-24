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
}

export interface Activity {
  id: string;
  userId: string;
  date: string; // ISO 8601 format
}
