'use client';

import { useApp } from '@/hooks/use-app';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';
import { calculateStreak } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Crown, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Input } from './ui/input';
import { FlameSolidIcon } from './icons/flame-solid';

function NoGroupView() {
    const { allGroups, joinGroup, createGroup, user } = useApp();
    const [isCreating, setIsCreating] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [isJoining, setIsJoining] = useState<string | null>(null);

    const handleCreateGroup = async () => {
        if (newGroupName.trim()) {
            await createGroup(newGroupName.trim());
            setIsCreating(false);
            setNewGroupName('');
        }
    }

    const handleJoinGroup = async (groupId: string) => {
        setIsJoining(groupId);
        await joinGroup(groupId);
        // No need to set isJoining back to false, as the view will change
    }

    return (
        <div className="p-4 md:p-6 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Join a Group</CardTitle>
                    <CardDescription>You're not in a group yet. Join one to participate with friends!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {allGroups.filter(g => !g.memberIds.includes(user?.id || '')).length > 0 ? (
                        <ul className="space-y-2">
                            {allGroups.filter(g => !g.memberIds.includes(user?.id || '')).map(group => (
                                <li key={group.id} className="flex items-center justify-between p-2 rounded-lg bg-background hover:bg-muted">
                                    <div>
                                        <p className="font-semibold">{group.name}</p>
                                        <p className="text-sm text-muted-foreground">{group.memberIds.length} member(s)</p>
                                    </div>
                                    <Button size="sm" onClick={() => handleJoinGroup(group.id)} disabled={!!isJoining}>
                                        {isJoining === group.id ? 'Joining...' : 'Join'}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-muted-foreground">No available groups to join right now.</p>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Or Create Your Own</CardTitle>
                    <CardDescription>Start a new group and invite your friends.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isCreating ? (
                        <div className="flex gap-2">
                            <Input
                                placeholder="Group Name"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                            />
                            <Button onClick={handleCreateGroup}>Create</Button>
                        </div>
                    ) : (
                        <Button className="w-full" onClick={() => setIsCreating(true)}>
                            <PlusCircle className="mr-2" /> Create Group
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function GroupDetailsView() {
    const { group, usersInGroup, getWorkoutsForUser, user } = useApp();

    if (!group) return null;

    const sortedMembers = usersInGroup
        .map(member => ({
            ...member,
            streak: calculateStreak(getWorkoutsForUser(member.id)),
        }))
        .sort((a, b) => b.streak - a.streak);
    
    const isOwner = user?.id === group.ownerId;

    return (
        <div className="p-4 md:p-6 space-y-4">
             <Card>
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-3xl">{group.name}</CardTitle>
                    <CardDescription>Let's get to work!</CardDescription>
                </CardHeader>
            </Card>

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
                 { isOwner && <CardFooter><Button variant="destructive" className="w-full">Delete Group</Button></CardFooter> }
            </Card>
        </div>
    )
}

export function GroupView() {
    const { group, loading } = useApp();

    if (loading) {
        return <div className="h-screen w-full bg-background flex items-center justify-center">Loading...</div>;
    }

    return group ? <GroupDetailsView /> : <NoGroupView />;
}
