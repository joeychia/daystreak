import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardView } from '@/components/dashboard-view';
import { AppContext } from '@/context/app-provider';
import { formatISO } from 'date-fns';

const mockUser = {
  id: 'test-user-1',
  name: 'Test User',
  email: 'test@example.com',
};

const mockActivities = [
    { id: 'act1', userId: 'test-user-1', date: formatISO(new Date()) }
];

const mockContext: any = {
    user: mockUser,
    getActivitiesForUser: vi.fn().mockReturnValue(mockActivities),
    hasUserCompletedActivityToday: vi.fn().mockReturnValue(true),
};

describe('DashboardView', () => {
    it('shows a completion message when activity is logged for today', () => {
        render(
            <AppContext.Provider value={mockContext}>
                <DashboardView onLogActivity={() => {}} isCelebrating={false} />
            </AppContext.Provider>
        );

        expect(screen.getByText('Great work! Logged for today.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Completed/i })).toBeDisabled();
    });

    it('shows a prompt to log activity when not completed', () => {
        const contextWithoutCompletion = {
            ...mockContext,
            hasUserCompletedActivityToday: vi.fn().mockReturnValue(false),
        };
        render(
            <AppContext.Provider value={contextWithoutCompletion}>
                <DashboardView onLogActivity={() => {}} isCelebrating={false} />
            </AppContext.Provider>
        );

        expect(screen.getByText('Log your activity for today!')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Crushed it!/i })).not.toBeDisabled();
    });
});
