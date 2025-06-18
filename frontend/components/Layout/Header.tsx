// frontend/components/layout/Header.tsx

"use client";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Redirect to the landing page after successful logout
      router.push('/');
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <header className="w-full max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link href="/dashboard">
          <h1 className="text-2xl font-bold">Podcast Pro</h1>
        </Link>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>
    </header>
  );
}