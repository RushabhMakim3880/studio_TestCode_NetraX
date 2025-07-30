
'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  // Now using a static asset for the logo.
  const appName = 'NETRA-X';
  const logoPath = '/logo.png'; // Path to the logo in the public folder.

  return (
    <div className={cn('flex items-center justify-center h-full w-full gap-2 text-foreground', className)}>
      <Image src={logoPath} alt={`${appName} Logo`} width={400} height={400} className="h-full w-auto object-contain" />
    </div>
  );
}
