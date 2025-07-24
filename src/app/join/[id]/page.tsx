'use client';
import { useParams, useRouter } from 'next/navigation';
import { AppProvider, useApp } from '@/context/app-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import type { Group } from '@/lib/types';
import { GROUPS } from '@/lib/data';
import { Logo } from '@/components/icons/logo';

function JoinPageContent() {
  const { id } = useParams();
  const { user, joinGroup } = useApp();
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // In a real app, you'd fetch group data. Here we get it from mock data.
    const groupData = GROUPS.find(g => g.id === id);
    setGroup(groupData || null);
  }, [id]);

  const handleJoin = () => {
    if (group) {
      joinGroup(group.id);
      router.push('/');
    }
  };

  if (!isClient) {
    return <div className="h-screen w-full bg-background flex items-center justify-center">Loading...</div>;
  }
  
  if (!group) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Group Not Found</CardTitle>
            <CardDescription>This invite link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/')} className="w-full">Go to App</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="absolute top-10">
          <Logo />
       </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">You're Invited!</CardTitle>
          <CardDescription>Join the "{group.name}" group and start tracking your workouts together.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">{group.memberIds.length} members are already in.</p>
        </CardContent>
        <CardFooter className="flex-col gap-2">
            {user ? (
                <Button onClick={handleJoin} className="w-full">Join Group</Button>
            ) : (
                <Button onClick={() => router.push('/')} className="w-full">Sign In to Join</Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function JoinPage() {
    return (
        <AppProvider>
            <JoinPageContent />
        </AppProvider>
    )
}
