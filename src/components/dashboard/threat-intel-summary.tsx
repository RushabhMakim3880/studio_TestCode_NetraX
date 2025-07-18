
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Rss, AlertTriangle, Loader2 } from 'lucide-react';
import { getRecentCves, type CveData } from '@/services/cve-service';

export function ThreatIntelSummary() {
  const [latestCves, setLatestCves] = useState<CveData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      setIsLoading(true);
      try {
        const cves = await getRecentCves();
        // Get top 3 critical CVEs
        setLatestCves(cves.slice(0, 3));
      } catch (error) {
        console.error('Failed to load CVE summary data', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSummary();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className='flex items-center gap-3'>
                <Rss className="h-5 w-5" />
                <CardTitle className="text-lg">Threat Intelligence</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild>
                <Link href="/threat-intelligence">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading feed...</span>
          </div>
        ) : latestCves.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Latest Critical Vulnerabilities</h4>
            {latestCves.map(cve => (
              <div key={cve.id} className="text-xs">
                <p className="font-mono text-accent truncate">{cve.id}</p>
                <p className="text-muted-foreground truncate">{cve.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-6">
            <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2"/>
            <p className="text-sm">Could not load CVE feed.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
