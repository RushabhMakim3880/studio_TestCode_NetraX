
'use client';

import { Shield } from 'lucide-react';
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
    <div className={cn('flex items-center gap-2 text-foreground', className)}>
      {profile?.logoDataUrl ? (
          <Image src={profile.logoDataUrl} alt={`${appName} Logo`} width={24} height={24} className="h-6 w-auto object-contain" />
      ) : (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-accent"
        >
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 9.5L7 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 9.5L17 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      <span className="font-headline text-lg font-semibold tracking-wider group-data-[collapsible=icon]:hidden">
        {appName}
      </span>
    </div>
  );
}
