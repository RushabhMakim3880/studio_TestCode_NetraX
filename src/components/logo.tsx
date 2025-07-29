
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
  
  const appName = profile?.name || 'Synapse CDE';

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
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 9V2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M12 21.5V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M16.732 15.75L19.5 20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M4.5 3.5L7.26795 8.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M16.732 8.25L19.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M4.5 20.5L7.26795 15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M19.5 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M8 12H4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )}
      <span className="font-headline text-lg font-semibold tracking-wider group-data-[collapsible=icon]:hidden">
        {appName}
      </span>
    </div>
  );
}
