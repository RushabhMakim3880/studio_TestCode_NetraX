'use client';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

export function Globe() {
  return (
    <Card className="h-full w-full bg-transparent overflow-hidden flex items-center justify-center">
      <CardContent className="p-0 h-full w-full relative">
        <Image
          src="https://placehold.co/800x800.png"
          alt="Futuristic globe with network connections"
          layout="fill"
          objectFit="contain"
          data-ai-hint="futuristic globe network"
        />
      </CardContent>
    </Card>
  );
}
