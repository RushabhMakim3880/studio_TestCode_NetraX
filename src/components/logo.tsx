
'use client';

import { Eye } from 'lucide-react';
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
        <Eye className="h-6 w-6 text-accent" />
      )}
      <span className="font-headline text-lg font-semibold tracking-wider group-data-[collapsible=icon]:hidden">
        {appName}
      </span>
    </div>
  );
}
