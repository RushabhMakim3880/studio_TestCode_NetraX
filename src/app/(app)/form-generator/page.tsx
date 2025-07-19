
'use client';

import { FormBuilder } from '@/components/form-builder';

export default function FormGeneratorPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Credential Form Generator</h1>
        <p className="text-muted-foreground">Build and deploy custom forms to capture credentials.</p>
      </div>

      <FormBuilder />
    </div>
  );
}
