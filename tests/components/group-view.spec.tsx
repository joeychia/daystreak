import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GroupView } from '@/components/group-view';
import { AppContext } from '@/context/app-provider';
import { formatISO, subDays } from 'date-fns';

const mockUsers = [
    { id: 'user1', name: 'Alice', avatarUrl: 'url1' },
    { id: 'user2', name: 'Bob', avatarUrl: 'url2' },
];

const mockGroup = {
    id: 'group1',
    name: 'Test Group',
    ownerId: 'user1',
    createdAt: formatISO(new Date()),
};

const mockActivities = [
    // Alice has a 3-day streak
    { id: 'a1', userId: 'user1', date: formatISO(new Date()) },
    { id: 'a2', userId: 'user1', date: formatISO(subDays(new Date(), 1)) },
    { id: 'a3', userId: 'user1', date: formatISO(subDays(new Date(), 2)) },
    // Bob has a 1-day streak
    { id: 'b1', userId: 'user2', date: formatISO(new Date()) },
];


const mockContext: any = {
    user: mockUsers[0],
    group: mockGroup,
    usersInGroup: mockUsers,
    getActivitiesForUser: (userId: string) => mockActivities.filter(a => a.userId === userId),
    loading: false,
};

describe('GroupView', () => {
    it('renders the leaderboard with users sorted by streak', () => {
        render(
            <AppContext.Provider value={mockContext}>
                <GroupView />
            </AppContext.Provider>
        );

        const listItems = screen.getAllByRole('listitem');
        
        expect(listItems).toHaveLength(2);

        // Alice (3-day streak) should be first
        expect(listItems[0]).toHaveTextContent(/Alice/);
        expect(listItems[0]).toHaveTextContent(/3/); // Streak
        
        // Bob (1-day streak) should be second
        expect(listItems[1]).toHaveTextContent(/Bob/);
        expect(listItems[1]).toHaveTextContent(/1/); // Streak
    });
});
