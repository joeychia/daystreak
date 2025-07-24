import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthScreen } from '@/components/auth-screen';
import { AppContext } from '@/context/app-provider';
import type { User, Activity, Group } from '@/lib/types';

const mockContext: any = {
    user: null,
    loading: false,
    activities: [],
    group: null,
    usersInGroup: [],
    signIn: vi.fn(),
    signUp: vi.fn(),
    logout: vi.fn(),
    logActivity: vi.fn(),
    getActivitiesForUser: (userId: string) => [],
    hasUserCompletedActivityToday: (userId: string) => false,
};

describe('AuthScreen', () => {
    it('renders the sign-in form by default', () => {
        render(
            <AppContext.Provider value={mockContext}>
                <AuthScreen />
            </AppContext.Provider>
        );

        expect(screen.getByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    it('toggles to the sign-up form', async () => {
        render(
            <AppContext.Provider value={mockContext}>
                <AuthScreen />
            </AppContext.Provider>
        );
        
        const toggleButton = screen.getByRole('button', { name: /Don't have an account\? Sign Up/i });
        await toggleButton.click();

        expect(screen.getByRole('heading', { name: /Create an Account/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
    });
});
