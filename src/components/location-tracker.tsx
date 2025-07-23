
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MapPin, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import Link from 'next/link';

type LocationTrackerProps = {
  location: { lat: number; lon: number } | null;
};

export function LocationTracker({ location }: LocationTrackerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const mapSrc = apiKey && location 
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${location.lat},${location.lon}&zoom=15` 
    : apiKey 
    ? `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=20,0&zoom=2`
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6" />
          <CardTitle>Geolocation Tracker</CardTitle>
        </div>
        <CardDescription>
          Displays the last known location of the selected session.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-video w-full border rounded-md overflow-hidden flex items-center justify-center bg-primary/10">
          {apiKey && mapSrc ? (
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={mapSrc}
            ></iframe>
          ) : (
            <Alert variant="destructive" className="m-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Google Maps API Key Missing</AlertTitle>
              <AlertDescription>
                To enable the map feature, please add your Google Maps API key as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in your `.env.local` file.
                You can get a key from the{' '}
                <Link href="https://console.cloud.google.com/google/maps-apis" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                  Google Cloud Console
                </Link>.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
