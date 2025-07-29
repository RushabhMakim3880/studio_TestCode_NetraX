
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { CapturedCredential } from '../credential-harvester';

export function LatestCredentials() {
  const { value: credentials } = useLocalStorage<CapturedCredential[]>('netra-captured-credentials', []);
  const latestCreds = credentials.slice(-3).reverse(); // Get last 3, newest first

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
            <KeyRound />
            Latest Credentials
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {latestCreds.length > 0 ? (
          latestCreds.map((cred, index) => (
            <div key={cred.timestamp + index} className="text-xs p-2 bg-primary/20 rounded-md">
              {Object.entries(cred).map(([key, value]) => {
                if (['timestamp', 'source', 'userAgent', 'ipAddress'].includes(key)) return null;
                return (
                  <p key={key} className="font-mono truncate">
                    <span className="font-semibold text-muted-foreground">{key}: </span>
                    <span className="text-destructive">{String(value)}</span>
                  </p>
                )
              })}
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-6">
            No credentials captured yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
