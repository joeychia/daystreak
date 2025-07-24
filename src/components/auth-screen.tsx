'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/hooks/use-app';
import { useToast } from "@/hooks/use-toast"
import { Logo } from './icons/logo';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export function AuthScreen() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sendOtp, verifyOtp } = useApp();
  const { toast } = useToast()

  useEffect(() => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response: any) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });

    return () => {
      window.recaptchaVerifier?.clear();
    };
  }, []);


  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.recaptchaVerifier) return;
    setIsSubmitting(true);
    try {
      const confirmationResult = await sendOtp(phone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      setStep('otp');
      toast({
          title: "Code Sent!",
          description: "We've sent a verification code to your phone.",
      });
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirmationResult) return;
    setIsSubmitting(true);

    try {
        await verifyOtp(window.confirmationResult, otp);
        // On successful verification, the onAuthStateChanged listener in AppProvider will handle setting the user.
    } catch (error: any) {
        console.error("Error verifying OTP:", error);
        toast({
            title: "Verification Failed",
            description: "The code you entered is incorrect. Please try again.",
            variant: "destructive",
        })
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div id="recaptcha-container"></div>
       <div className="absolute top-10">
          <Logo />
       </div>
      <Card className="w-full max-w-sm">
        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit}>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Welcome</CardTitle>
              <CardDescription>Enter your phone number to sign in or create an account.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 555 555 5555"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Code"}
                </Button>
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
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Verifying..." : "Verify & Sign In"}
              </Button>
              <Button variant="link" size="sm" onClick={() => setStep('phone')} disabled={isSubmitting}>Use a different number</Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
