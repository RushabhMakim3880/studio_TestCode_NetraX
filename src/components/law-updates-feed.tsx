
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getLawUpdates, type LawUpdateOutput } from '@/ai/flows/law-updates-flow';
import { Loader2, AlertTriangle, Scale } from 'lucide-react';

export function LawUpdatesFeed() {
  const [feed, setFeed] = useState<LawUpdateOutput['updates'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeed() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getLawUpdates();
        setFeed(response.updates);
      } catch (err) {
        // Set a user-friendly message when the AI feed is unavailable for any reason
        setError('The AI legal update feed is currently unavailable. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFeed();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Scale className="h-6 w-6" />
            <CardTitle>Cyber Law & Policy Updates</CardTitle>
        </div>
        <CardDescription>Recent developments in national and international cyber law.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center h-40 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading legal updates...</span>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-40 gap-2 text-muted-foreground">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
        {!isLoading && !error && feed && (
          <ul className="space-y-4">
            {feed.map((item, index) => (
                <li key={index} className="border-l-4 border-accent pl-4">
                    <p className="font-semibold">{item.title} <span className="ml-2 text-xs font-normal text-muted-foreground">({item.jurisdiction})</span></p>
                    <p className="text-sm text-muted-foreground mt-1">{item.summary}</p>
                    <p className="text-xs text-muted-foreground/70 mt-2">Published: {item.publishedDate}</p>
                </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
