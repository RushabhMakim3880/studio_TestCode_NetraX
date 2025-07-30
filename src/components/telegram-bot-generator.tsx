
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Info } from 'lucide-react';
import Link from 'next/link';

// DEPRECATED COMPONENT
// This component is no longer in active use on the C2 page.
// It is being replaced by TelegramSetupGuide for clarity.
// It can be removed in a future cleanup.

const nmapApiScript = `
# This agent script is deprecated.
# The application now uses a serverless webhook to receive updates from Telegram,
# which is more efficient and reliable. Please follow the updated setup guide
# in the UI to register your webhook with the Telegram API.
`;

export function TelegramBotGenerator() {

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Info className="h-6 w-6" />
            <CardTitle>C2 Agent Information</CardTitle>
        </div>
        <CardDescription>This component is deprecated. Please use the Webhook Setup Guide.</CardDescription>
      </CardHeader>
      <CardContent>
         <Accordion type="single" collapsible className="w-full mb-6">
          <AccordionItem value="setup-guide">
            <AccordionTrigger>
                <div className="flex items-center gap-2 text-amber-400">
                    <Info className="h-4 w-4" />
                    Old Agent Information
                </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">This section previously contained a Python agent script for polling Telegram. This method is no longer recommended. The application now uses a more stable and efficient serverless webhook.</p>
                <h4 className="font-semibold">Deprecated Agent Code:</h4>
                <pre className="bg-primary/20 p-4 rounded-md text-sm overflow-x-auto"><code>{nmapApiScript}</code></pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
