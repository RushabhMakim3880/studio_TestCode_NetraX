'use client';

import { IocExtractor } from '@/components/ioc-extractor';

export default function IocManagementPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">IoC Management</h1>
        <p className="text-muted-foreground">Extract Indicators of Compromise from unstructured text data.</p>
      </div>

      <IocExtractor />
    </div>
  );
}
