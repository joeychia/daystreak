'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logActivityByToken } from '@/lib/actions';
import { CheckCircle, XCircle, LoaderCircle } from 'lucide-react';
import { Logo } from '@/components/icons/logo';

type Status = 'loading' | 'success' | 'error' | 'already_completed';

function CompletionPage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let isCancelled = false;
    const log = async () => {
      if (!params.token) {
        setStatus('error');
        setError('No token provided.');
        return;
      }
      try {
        const result = await logActivityByToken(params.token);
        if (isCancelled) return;

        if (result.success) {
          setStatus('success');
        } else if (result.error === 'already_completed') {
          setStatus('already_completed');
        }
         else {
          setStatus('error');
          setError(result.error || 'An unknown error occurred.');
        }
      } catch (e: any) {
        if (isCancelled) return;
        setStatus('error');
        setError(e.message || 'Failed to log activity.');
      }
    };
    log();

    return () => {
        isCancelled = true;
    }
  }, [params.token]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            <CardTitle>Completing Your Day...</CardTitle>
            <CardDescription>We're logging your activity now. Hold tight!</CardDescription>
          </div>
        );
      case 'success':
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
            <CardTitle>Activity Logged!</CardTitle>
            <CardDescription>Great work! You've crushed it for today. Keep the streak alive!</CardDescription>
          </div>
        );
      case 'already_completed':
          return (
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <CardTitle>Already Logged!</CardTitle>
              <CardDescription>Looks like you already completed your goal for today. Awesome job!</CardDescription>
            </div>
          );
      case 'error':
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <XCircle className="h-12 w-12 text-destructive" />
            <CardTitle>Something Went Wrong</CardTitle>
            <CardDescription>{error || "We couldn't log your activity. Please check the link or try again later."}</CardDescription>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="absolute top-10">
          <Logo />
       </div>
      <main className="flex w-full max-w-md items-center justify-center">
        <Card className="w-full">
            <CardHeader/>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default CompletionPage;
