
'use client';

import { useApp } from '@/hooks/use-app';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateStreak, cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Crown, Trophy } from 'lucide-react';
import { FlameSolidIcon } from './icons';

function getPodiumClass(rank: number) {
  switch (rank) {
    case 1:
      return 'bg-yellow-400/20 border-yellow-500';
    case 2:
      return 'bg-gray-400/20 border-gray-500';
    case 3:
      return 'bg-orange-400/20 border-orange-500';
    default:
      return 'bg-background hover:bg-muted';
  }
}

function getTrophyColor(rank: number) {
    switch(rank) {
        case 1: return "text-yellow-500";
        case 2: return "text-gray-500";
        case 3: return "text-orange-500";
        default: return "text-transparent";
    }
}

function GroupDetailsView() {
    const { user, group, usersInGroup, getActivitiesForUser } = useApp();

    if (!group) return <div className="p-4 text-center">Loading group...</div>;

    const sortedMembers = usersInGroup
        .map(member => ({
            ...member,
            streak: calculateStreak(getActivitiesForUser(member.id)),
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
                <CardContent className="p-0">
                    <ul className="space-y-2 px-3 pb-3">
                        {sortedMembers.map((member, index) => {
                            const rank = index + 1;
                            const isPodium = rank <= 3;
                            return (
                                <li 
                                    key={member.id} 
                                    className={cn(
                                        "flex items-center gap-4 p-3 rounded-lg transition-all border-2",
                                        getPodiumClass(rank),
                                        user && member.id === user.id && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                    )}
                                >
                                    <div className="flex items-center gap-3 w-12">
                                        <span className="font-bold text-lg w-6 text-center">{rank}</span>
                                        {isPodium && <Trophy className={cn("w-5 h-5", getTrophyColor(rank))} />}
                                    </div>

                                    <Avatar>
                                        <AvatarImage src={member.avatarUrl} alt={member.name} />
                                        <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold flex items-center gap-2">
                                            {member.name} {user && member.id === user.id && '(you)'}
                                            {member.id === group.ownerId && <Crown className="w-4 h-4 text-yellow-500" title="Group Owner" />}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-primary">{member.streak}</p>
                                        <p className="text-xs text-muted-foreground">Day Streak</p>
                                    </div>
                                </li>
                            )
                        })}
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
