
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function HostedPageViewer() {
  const params = useParams();
  const id = params?.id as string;

  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Ensure this component only renders on the client
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    // Only try to access localStorage on the client and when the id is available
    if (isClient && id) {
      try {
        const content = localStorage.getItem(`phishing-page-${id}`);
        if (content) {
          setHtmlContent(content);
        } else {
          setError("Page not found or has expired. Please generate a new link.");
        }
      } catch (e) {
        console.error("Failed to read from localStorage", e);
        setError("Could not load page content due to a browser error.");
      }
      setIsLoading(false);
    }
  }, [id, isClient]);

  // On the server, or before the client has mounted, render nothing to prevent hydration mismatch.
  if (!isClient) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <Card className="w-full max-w-lg border-destructive">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle/>
                    Error Loading Page
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p>{error}</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (htmlContent) {
    return (
      <iframe
        srcDoc={htmlContent}
        title="Hosted Phishing Page"
        className="h-screen w-screen border-0"
        sandbox="allow-scripts allow-forms allow-same-origin"
      />
    );
  }

  return null;
}
