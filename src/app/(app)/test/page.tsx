
'use client';

import { Logo } from '@/components/logo';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// --- Splash Screen Components for Showcase ---

const OperatorSplashScreen = () => (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-background p-4 font-mono overflow-hidden">
        <div className="w-full max-w-lg flex flex-col items-center">
            <Logo className="mb-6" />
            <div className="h-24 w-full text-left text-sm text-muted-foreground">
                <p className="text-accent">> Initializing NETRA-X...</p>
                <p>> Establishing secure kernel connection...</p>
                <p>> Loading RBAC policies...</p>
            </div>
            <div className="w-full pt-4">
                <Progress value={60} className="h-2 bg-primary/20" />
                <p className="mt-2 text-center text-xs text-muted-foreground">
                    Loading... 60%
                </p>
            </div>
        </div>
    </div>
);

const CyberpunkSplashScreen = () => (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-black p-4 font-mono overflow-hidden">
        <style jsx>{`
            .glitch {
                animation: glitch 1.5s linear infinite;
                text-shadow: 0 0 5px #79ffef, 0 0 10px #79ffef, 0 0 20px #79ffef;
            }
            .glitch-bar {
                position: absolute;
                left: 0;
                width: 100%;
                height: 2px;
                background-color: #79ffef;
                animation: glitch-bar 2s linear infinite;
            }
            @keyframes glitch {
                0%, 100% { transform: translate(0, 0); opacity: 1; }
                25% { transform: translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px); opacity: 0.8; }
                50% { transform: translate(${Math.random() * -4 + 2}px, ${Math.random() * -4 + 2}px); opacity: 1; }
                75% { transform: translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px); opacity: 0.7; }
            }
            @keyframes glitch-bar {
                0% { top: 0%; }
                100% { top: 100%; }
            }
        `}</style>
        <div className="glitch-bar" />
        <div className="glitch text-accent">
            <Logo />
        </div>
        <p className="mt-4 text-accent animate-pulse">SYSTEM BREACH IMMINENT</p>
    </div>
);

const MinimalistSplashScreen = () => (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 font-sans overflow-hidden">
        <div className="flex flex-col items-center space-y-4">
             <div className="h-16 w-16 relative">
                 <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping"></div>
                 <Logo />
             </div>
            <p className="text-lg font-medium text-muted-foreground">Loading NETRA-X</p>
        </div>
    </div>
);


export default function SplashscreenShowcasePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Splash Screen Designs</h1>
        <p className="text-muted-foreground">Review the different splash screen concepts below.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
          <Card>
              <CardHeader><CardTitle>1. Operator Theme (Current)</CardTitle></CardHeader>
              <CardContent className="aspect-video">
                  <OperatorSplashScreen />
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle>2. Cyberpunk Theme</CardTitle></CardHeader>
              <CardContent className="aspect-video">
                  <CyberpunkSplashScreen />
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle>3. Minimalist Theme</CardTitle></CardHeader>
              <CardContent className="aspect-video">
                  <MinimalistSplashScreen />
              </CardContent>
          </Card>
      </div>
    </div>
  );
}

