'use client';

import { DocumentGenerator } from '@/components/document-generator';

export default function DocumentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Document Center</h1>
        <p className="text-muted-foreground">Create, manage, and generate project-related documents.</p>
      </div>

      <DocumentGenerator />
    </div>
  );
}
