// src/hooks/use-user.ts
"use client";
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '@/firebase'; // Use the hook from provider
import { useRouter, usePathname } from 'next/navigation';
import type { User } from 'firebase/auth';

export function useUser() {
  const auth = useAuth(); // Get auth from context
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth) {
      // If auth service is not ready, do nothing.
      // The provider will handle the loading state.
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [auth]); // Rerun when auth service is available

  // Navigation logic can be kept or removed based on app requirements
  // For now, let's assume some routes might need protection in the future
  useEffect(() => {
    // This logic is currently disabled as all pages are public,
    // but can be re-enabled if protected routes are introduced.
    // if (!isLoading && !user && requiresAuth(pathname)) {
    //   router.push('/login');
    // }
  }, [user, isLoading, router, pathname]);

  return { user, isLoading };
}

// Example of how protected routes could be defined.
// Currently empty as all pages are accessible.
const protectedRoutes: string[] = []; 

function requiresAuth(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route));
}
