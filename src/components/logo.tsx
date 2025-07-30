
'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import type { CompanyProfile } from './company-profile-manager';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);

  useEffect(() => {
    // Only access localStorage on the client
    try {
      const storedProfile = localStorage.getItem('netra-company-profile');
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }
    } catch(e) {
        // Fallback to default if parsing fails
        console.error("Failed to load company profile for logo", e);
        setProfile(null);
    }
  }, []);
  
  const appName = profile?.name || 'NETRA-X';

  return (
    <div className={cn('flex items-center justify-center h-full w-full gap-2 text-foreground', className)}>
      {profile?.logoDataUrl ? (
          <Image src={profile.logoDataUrl} alt={`${appName} Logo`} width={400} height={400} className="h-full w-auto object-contain" />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 256 256"
          className="h-full w-full"
          fill="currentColor"
        >
          <path
            d="M128 48C82.2 48 43.5 76.6 24.3 128c19.2 51.4 57.9 80 103.7 80s84.5-28.6 103.7-80C212.5 76.6 173.8 48 128 48zm0 136c-30.9 0-56-25.1-56-56s25.1-56 56-56 56 25.1 56 56-25.1 56-56 56z"
            className="text-primary"
          />
          <path
            d="M128 96c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32z"
            className="text-accent"
          />
        </svg>
      )}
    </div>
  );
}
