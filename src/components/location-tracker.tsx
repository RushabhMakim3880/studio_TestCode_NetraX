'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

type LocationTrackerProps = {
  location: { lat: number; lon: number } | null;
};

export function LocationTracker({ location }: LocationTrackerProps) {
  const mapSrc = location 
    ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${location.lat},${location.lon}&zoom=15` 
    : `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=20,0&zoom=2`;

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
        <div className="aspect-video w-full border rounded-md overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={mapSrc}
          ></iframe>
        </div>
      </CardContent>
    </Card>
  );
}