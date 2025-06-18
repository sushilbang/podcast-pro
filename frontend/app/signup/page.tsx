"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      alert('Success! Check your email for a confirmation link.');
      router.push('/login');
    } catch (error: any) {
      alert(error.error_description || error.message);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>Enter your details to sign up.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <Button type="submit" className="w-full">Sign Up</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account? <Link href="/login" className="underline">Sign In</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}