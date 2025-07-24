
'use client';

import { SteganographyTool } from '@/components/steganography-tool';

export default function SteganographyPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Steganography Studio</h1>
        <p className="text-muted-foreground">Hide and extract data within images using various techniques.</p>
      </div>

      <SteganographyTool />
      
    </div>
  );
}
