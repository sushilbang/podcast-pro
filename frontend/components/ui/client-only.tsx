// frontend/components/ui/client-only.tsx

"use client";

import { useState, useEffect } from 'react';

// This component ensures its children are only rendered on the client side.
export default function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null; // Don't render anything on the server or during initial hydration
  }

  return <>{children}</>;
}