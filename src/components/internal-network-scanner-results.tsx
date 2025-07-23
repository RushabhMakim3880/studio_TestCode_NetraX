
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Network } from 'lucide-react';
import { Badge } from './ui/badge';

type InternalNetworkScannerResultsProps = {
  ips: string[];
};

export function InternalNetworkScannerResults({ ips }: InternalNetworkScannerResultsProps) {

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Network className="h-6 w-6" />
          <CardTitle>Internal Network Scan</CardTitle>
        </div>
        <CardDescription>
          Shows devices found on the victim's local network.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {ips.length > 0 ? (
            <div className="flex flex-wrap gap-2">
                {ips.map(ip => (
                    <Badge key={ip} variant="secondary" className="font-mono">{ip}</Badge>
                ))}
            </div>
        ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No internal devices detected yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
