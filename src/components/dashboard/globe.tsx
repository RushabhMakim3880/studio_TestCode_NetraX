'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

export function GlobeComponent() {
  const globeRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Memoize fake data to prevent regeneration on every render
  const arcsData = useMemo(() => {
    const N = 20;
    return [...Array(N).keys()].map(() => ({
        startLat: (Math.random() - 0.5) * 180,
        startLng: (Math.random() - 0.5) * 360,
        endLat: (Math.random() - 0.5) * 180,
        endLng: (Math.random() - 0.5) * 360,
    }));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Set initial camera view
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.6;
      globeRef.current.controls().enableZoom = false;
      globeRef.current.pointOfView({ altitude: 2.5 });
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return (
    <Card ref={containerRef} className="h-full w-full bg-transparent overflow-hidden">
      <CardContent className="p-0 h-full w-full">
        {size.width > 0 && <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          atmosphereColor="hsl(var(--accent))"
          atmosphereAltitude={0.15}
          arcsData={arcsData}
          arcColor={() => 'hsl(var(--accent))'}
          arcDashLength={() => Math.random() * 0.5 + 0.1}
          arcDashGap={() => Math.random() * 0.5 + 0.1}
          arcDashAnimateTime={() => Math.random() * 5000 + 2000}
          arcStroke={0.25}
        />}
      </CardContent>
    </Card>
  );
}

// Rename the default export to avoid conflicts
export { GlobeComponent as Globe }
