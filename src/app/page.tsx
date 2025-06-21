'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { LocalStorage } from '@/lib/localStorage';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      console.log('🏠 ROOT_PAGE: Checking user and redirecting...');
      const supabase = createClient();
      
      // Check for authenticated user first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('🏠 ROOT_PAGE: Found authenticated user, redirecting to /chat');
        // Authenticated user - redirect to chat
        router.push('/chat');
        return;
      }
      
      // Check for guest user in localStorage
      const guestUser = LocalStorage.getUser();
      console.log('🏠 ROOT_PAGE: Checking for guest user:', guestUser);
      
      if (guestUser?.is_guest) {
        console.log('🏠 ROOT_PAGE: Found guest user, redirecting to /chat');
        // Guest user exists - redirect to chat
        router.push('/chat');
        return;
      }
      
      console.log('🏠 ROOT_PAGE: No user found, redirecting to /login');
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
