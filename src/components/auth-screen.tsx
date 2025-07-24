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
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('+11234567890'); // Default to a mock user
  const [otp, setOtp] = useState('');
  const { login } = useApp();
  const { toast } = useToast()


  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send an OTP here.
    // For this mock, we'll just check if the number is valid and move to the OTP step.
    const userExists = login(phone);
    if(userExists || phone === '+11234567890') { // allow default for demo
        setStep('otp');
    } else {
        toast({
            title: "Login Failed",
            description: "This phone number is not registered. Please use a mock number.",
            variant: "destructive",
        })
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would verify the OTP here.
    // For this mock, we'll just log the user in.
    const user = login(phone);
    if (!user) {
        toast({
            title: "Login Failed",
            description: "Could not log in. Please try again.",
            variant: "destructive",
        })
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="absolute top-10">
          <Logo />
       </div>
      <Card className="w-full max-w-sm">
        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit}>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
              <CardDescription>Enter your phone number to sign in.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 555-5555"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90">Send Code</Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit}>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Enter Code</CardTitle>
              <CardDescription>We sent a verification code to {phone}.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  autoComplete="one-time-code"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" className="w-full">Verify & Sign In</Button>
              <Button variant="link" size="sm" onClick={() => setStep('phone')}>Use a different number</Button>
            </CardFooter>
          </form>
        )}
      </Card>
      <div className="text-center text-muted-foreground text-sm mt-4 p-4 rounded-md border">
        <p className="font-bold">Demo Users:</p>
        <p>+11234567890 (You)</p>
        <p>+12345678901 (Alex)</p>
        <p>+13456789012 (Sam)</p>
        <p>+14567890123 (Jess)</p>
      </div>
    </div>
  );
}
