'use client';
import { useApp } from '@/hooks/use-app';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FlameSolidIcon } from './icons/flame-solid';
import { calculateStreak } from '@/lib/utils';
import { Button } from './ui/button';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { Share2, Users } from 'lucide-react';
import { CalendarView } from './calendar-view';
import type { User } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';

export function GroupView() {
  const { user, group, users, getWorkoutsForUser, getUserById } = useApp();
  const { toast } = useToast();
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  if (!user) return null;

  if (!group) {
    return <NoGroupView />;
  }
  
  const leaderboard = users
    .map(member => {
      const activities = getWorkoutsForUser(member.id);
      const streak = calculateStreak(activities);
      return { ...member, streak };
    })
    .sort((a, b) => b.streak - a.streak);
  
  const handleShare = () => {
    const joinLink = `${window.location.origin}/join/${group.id}`;
    navigator.clipboard.writeText(joinLink);
    toast({
      title: "Link Copied!",
      description: "Group invite link has been copied to your clipboard.",
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex justify-between items-center">
            {group.name}
            <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="w-5 h-5" />
            </Button>
          </CardTitle>
          <CardDescription>{group.memberIds.length} members</CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="font-bold mb-4 text-lg">Leaderboard</h3>
          <ul className="space-y-4">
            {leaderboard.map((member, index) => (
              <Dialog key={member.id} onOpenChange={(open) => !open && setSelectedMember(null)}>
                <DialogTrigger asChild>
                  <li 
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-lg"
                    onClick={() => setSelectedMember(member as User)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-lg w-6">{index + 1}</span>
                      <Avatar>
                        <AvatarImage src={member.avatarUrl} alt={member.name} />
                        <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-orange-500">
                      <span className="font-bold text-lg">{member.streak}</span>
                      <FlameSolidIcon className="w-5 h-5" />
                    </div>
                  </li>
                </DialogTrigger>
                {selectedMember && selectedMember.id === member.id && (
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{member.name}'s Calendar</DialogTitle>
                    </DialogHeader>
                    <CalendarView userId={member.id} />
                  </DialogContent>
                )}
              </Dialog>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function NoGroupView() {
    const { createGroup, allGroups, joinGroup } = useApp();
    const [open, setOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const { toast } = useToast();

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            toast({ title: "Group name cannot be empty", variant: "destructive" });
            return;
        }
        const newGroup = await createGroup(groupName);
        toast({ title: `Group "${newGroup.name}" created!`, description: "You can now invite members." });
        setOpen(false);
    }
    
    const handleJoinGroup = async (groupId: string) => {
        await joinGroup(groupId);
        toast({ title: "Successfully joined group!" });
    }

    return (
        <div className="flex flex-col h-full text-center p-4">
            <Card className="w-full max-w-sm mb-4">
                <CardHeader>
                    <CardTitle className="font-headline">Create a Group</CardTitle>
                    <CardDescription>Create a new group to start a streak with your friends.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full">Create a New Group</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Your Group</DialogTitle>
                                <DialogDescription>Give your group a fun name to get started.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Name</Label>
                                    <Input id="name" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateGroup}>Create Group</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>

            <Card className="w-full max-w-sm flex-1 flex flex-col">
                <CardHeader>
                    <CardTitle className="font-headline">Join an Existing Group</CardTitle>
                    <CardDescription>Or join one of the groups below.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-full">
                        <div className="px-6 pb-4">
                        {allGroups.length > 0 ? (
                            <ul className="space-y-2">
                                {allGroups.map(group => (
                                    <li key={group.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                        <div>
                                            <p className="font-semibold text-left">{group.name}</p>
                                            <p className="text-sm text-muted-foreground text-left flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {group.memberIds.length} members
                                            </p>
                                        </div>
                                        <Button size="sm" onClick={() => handleJoinGroup(group.id)}>Join</Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground">No groups available to join yet.</p>
                        )}
                        </div>
                    </ScrollArea>
                </CardContent>
                 <CardFooter>
                    <p className="text-xs text-muted-foreground">If you have an invite link, open it in your browser to join a group.</p>
                </CardFooter>
            </Card>
        </div>
    );
}
