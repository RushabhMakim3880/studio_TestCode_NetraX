
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import type { Module } from '@/lib/constants';

type ShortcutCardProps = {
  module: Module;
};

export function ShortcutCard({ module }: ShortcutCardProps) {
  const { name, path, icon: Icon } = module;
  const description = `Quick access to the ${name} module.`;

  if (!path) return null;

  return (
    <Card className="hover:bg-primary/10 transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-6 w-6" />}
            <CardTitle className="text-lg">{name}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" asChild>
            <Link href={path}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <CardDescription className="pt-2">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
