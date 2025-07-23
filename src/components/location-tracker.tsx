
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

type LocationTrackerProps = {
  location: { lat: number; lon: number } | null;
};

export function LocationTracker({ location }: LocationTrackerProps) {
  // OpenStreetMap URL does not require an API key.
  // We construct a bounding box to control the zoom level.
  const mapSrc = location 
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${location.lon - 0.01},${location.lat - 0.01},${location.lon + 0.01},${location.lat + 0.01}&layer=mapnik&marker=${location.lat},${location.lon}`
    : "https://www.openstreetmap.org/export/embed.html?bbox=-180,-90,180,90&layer=mapnik";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6" />
          <CardTitle>Geolocation Tracker</CardTitle>
        </div>
        <CardDescription>
          Displays the last known location of the selected session using OpenStreetMap.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-video w-full border rounded-md overflow-hidden flex items-center justify-center bg-primary/10">
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={mapSrc}
            title="Location Map"
          ></iframe>
        </div>
      </CardContent>
    </Card>
  );
}
