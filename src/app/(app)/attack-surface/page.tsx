'use client';

import { AttackSurfaceVisualizer } from '@/components/attack-surface-visualizer';

export default function AttackSurfacePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Attack Surface Visualizer</h1>
        <p className="text-muted-foreground">Crawl a target and visualize its web structure as an interactive graph.</p>
      </div>
      
      <AttackSurfaceVisualizer />

    </div>
  );
}
