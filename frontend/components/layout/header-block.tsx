// frontend/components/layout/Header.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/');
    } catch (error: any) {
      alert(error.message);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="w-full max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-2xl font-bold">
          Pod🎧
        </Link>
        
        <Button onClick={handleLogout} variant="outline" disabled={isLoggingOut}>
          {isLoggingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging out...
            </>
          ) : (
            "Logout"
          )}
        </Button>
      </div>
    </header>
  );
}