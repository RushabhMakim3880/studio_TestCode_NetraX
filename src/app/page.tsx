'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import SplashScreen from '@/components/splash-screen';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setLoading(false);
    }, 4000); // Minimum splash screen time

    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    if (!loading && !isAuthLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [loading, isAuthLoading, user, router]);

  return <SplashScreen user={user} />;
}
