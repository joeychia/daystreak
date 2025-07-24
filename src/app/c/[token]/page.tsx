'use client';

import { useEffect } from 'react';
import { logActivityByToken } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons/logo';
import { LoaderCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


function CompletionPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    let isCancelled = false;
    const log = async () => {
      if (!params.token) {
        // This case should ideally not happen with valid routing
        router.push('/?error=invalid_token');
        return;
      }
      try {
        const result = await logActivityByToken(params.token);
        if (isCancelled) return;
        
        // The toast will be shown on the page we are redirecting to.
        // We use a query parameter to signal the main page to show it.
        if (result.success) {
            router.push('/?source=magic_link_success');
        } else {
            router.push(`/?source=magic_link_error&message=${encodeURIComponent(result.error || 'Unknown error')}`);
        }
      } catch (e: any) {
        if (isCancelled) return;
        router.push(`/?source=magic_link_error&message=${encodeURIComponent(e.message || 'Failed to log activity.')}`);
      }
    };
    log();

    return () => {
        isCancelled = true;
    }
  }, [params.token, router, toast]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="absolute top-10">
          <Logo />
       </div>
      <main className="flex w-full max-w-md items-center justify-center">
        <Card className="w-full">
            <CardHeader/>
            <CardContent>
                <div className="flex flex-col items-center gap-4 text-center">
                    <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                    <CardTitle>Completing Your Day...</CardTitle>
                    <CardDescription>We're logging your activity now. Hold tight!</CardDescription>
                </div>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default CompletionPage;
