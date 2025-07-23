
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Scan } from 'lucide-react';
import { Badge } from './ui/badge';
import { COMMON_PORTS } from '@/lib/ports';

type PortScannerResultsProps = {
  ports: {target: string, port: number}[];
};

export function PortScannerResults({ ports }: PortScannerResultsProps) {

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Scan className="h-6 w-6" />
          <CardTitle>Port Scan Results</CardTitle>
        </div>
        <CardDescription>
          Shows open ports found on targets by the scanner payload.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {ports.length > 0 ? (
            <div className="flex flex-wrap gap-2">
                {ports.map(({target, port}, index) => (
                    <Badge key={`${target}-${port}-${index}`} variant="destructive" className="font-mono">
                        {target}:{port} ({COMMON_PORTS[port] || 'Unknown'})
                    </Badge>
                ))}
            </div>
        ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No open ports detected yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
