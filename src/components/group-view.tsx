'use client';

import { useApp } from '@/hooks/use-app';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateStreak } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Crown } from 'lucide-react';
import { FlameSolidIcon } from './icons/flame-solid';

function GroupDetailsView() {
    const { group, usersInGroup, getWorkoutsForUser } = useApp();

    if (!group) return <div className="p-4 text-center">Loading group...</div>;

    const sortedMembers = usersInGroup
        .map(member => ({
            ...member,
            streak: calculateStreak(getWorkoutsForUser(member.id)),
        }))
        .sort((a, b) => b.streak - a.streak);

    return (
        <div className="p-4 md:p-6 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <FlameSolidIcon className="w-5 h-5 text-primary" />
                        Leaderboard
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {sortedMembers.map((member, index) => (
                            <li key={member.id} className="flex items-center gap-4 p-2 rounded-lg bg-background hover:bg-muted">
                                <span className="font-bold text-lg w-6 text-center">{index + 1}</span>
                                <Avatar>
                                    <AvatarImage src={member.avatarUrl} alt={member.name} />
                                    <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold flex items-center gap-2">
                                        {member.name}
                                        {member.id === group.ownerId && <Crown className="w-4 h-4 text-yellow-500" title="Group Owner" />}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg text-primary">{member.streak}</p>
                                    <p className="text-xs text-muted-foreground">Day Streak</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}

export function GroupView() {
    const { loading } = useApp();

    if (loading) {
        return <div className="h-screen w-full bg-background flex items-center justify-center">Loading...</div>;
    }

    return <GroupDetailsView />;
}
