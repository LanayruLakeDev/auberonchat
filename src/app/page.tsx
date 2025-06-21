'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { LocalStorage } from '@/lib/localStorage';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      const supabase = createClient();
      
      // Check for authenticated user first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Authenticated user - redirect to chat
        router.push('/chat');
        return;
      }
      
      // Check for guest user in localStorage
      const guestUser = LocalStorage.getUser();
      
      if (guestUser?.is_guest) {
        // Guest user exists - redirect to chat
        router.push('/chat');
        return;
      }
      
      // No user found - redirect to login
      router.push('/login');
    };

    checkUserAndRedirect();
  }, [router]);

  // Show loading while checking
  return (
    <div className="h-screen flex items-center justify-center animated-bg">
      <div className="text-center">
        <div className="loading-dots mb-4">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p className="text-white/60">Loading...</p>
      </div>
    </div>
  );
}
