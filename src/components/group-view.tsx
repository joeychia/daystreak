'use client';
import { useApp } from '@/hooks/use-app';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FlameSolidIcon } from './icons/flame-solid';
import { calculateStreak } from '@/lib/utils';
import { Button } from './ui/button';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { Share2 } from 'lucide-react';

export function GroupView() {
  const { user, group, users, getWorkoutsForUser, getUserById, createGroup } = useApp();
  const { toast } = useToast();

  if (!user) return null;

  if (!group) {
    return <NoGroupView />;
  }

  const leaderboard = group.memberIds
    .map(memberId => {
      const member = getUserById(memberId);
      const workouts = getWorkoutsForUser(memberId);
      const streak = calculateStreak(workouts);
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
              <li key={member.id} className="flex items-center justify-between">
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
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function NoGroupView() {
    const { createGroup, user } = useApp();
    const [open, setOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const { toast } = useToast();

    const handleCreateGroup = () => {
        if (!groupName.trim()) {
            toast({ title: "Group name cannot be empty", variant: "destructive" });
            return;
        }
        const newGroup = createGroup(groupName);
        toast({ title: `Group "${newGroup.name}" created!`, description: "You can now invite members." });
        setOpen(false);
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="font-headline">Join a Group</CardTitle>
                    <CardDescription>You're not in a group yet. Create one to start working out with friends!</CardDescription>
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
                <CardFooter>
                    <p className="text-xs text-muted-foreground">If you have an invite link, open it in your browser to join a group.</p>
                </CardFooter>
            </Card>
        </div>
    );
}
