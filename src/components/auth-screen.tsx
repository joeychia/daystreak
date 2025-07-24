
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/hooks/use-app';
import { useToast } from "@/hooks/use-toast"
import { Logo } from './icons/logo';

export function AuthScreen() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp } = useApp();
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (authMode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      // On successful sign-in/sign-up, the onAuthStateChanged listener in AppProvider will handle setting the user.
    } catch (error: any) {
      console.error(`Error during ${authMode}:`, error);
      toast({
        title: "Authentication Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const toggleAuthMode = () => {
    setAuthMode(prev => prev === 'signin' ? 'signup' : 'signin');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="absolute top-10">
          <Logo />
       </div>
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">{authMode === 'signin' ? "Welcome Back" : "Create an Account"}</CardTitle>
              <CardDescription>{authMode === 'signin' ? "Sign in to continue your streak." : "Join us and start building your streak."}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : (authMode === 'signin' ? "Sign In" : "Sign Up")}
              </Button>
              <Button variant="link" size="sm" type="button" onClick={toggleAuthMode} disabled={isSubmitting}>
                {authMode === 'signin' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </Button>
            </CardFooter>
          </form>
      </Card>
    </div>
  );
}
