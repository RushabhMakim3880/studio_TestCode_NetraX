
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
                25% { transform: translate(${Math.random() * 4 - 2}px, ${
  Math.random() * 4 - 2
}px); opacity: 0.8; }
                50% { transform: translate(${Math.random() * -4 + 2}px, ${
  Math.random() * -4 + 2
}px); opacity: 1; }
                75% { transform: translate(${Math.random() * 4 - 2}px, ${
  Math.random() * 4 - 2
}px); opacity: 0.7; }
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

const CorporateSplashScreen = () => (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-blue-900 text-white p-4 font-sans overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="w-full max-w-sm flex flex-col items-center z-10">
            <Logo />
            <p className="mt-4 text-lg">Initializing Secure Environment</p>
             <div className="w-full pt-4 mt-4">
                <Progress value={75} className="h-1 bg-blue-700 [&>div]:bg-blue-300" />
            </div>
        </div>
    </div>
);

const RetroTermSplashScreen = () => (
    <div className="relative h-full w-full flex flex-col items-start justify-start bg-black p-4 font-mono text-green-400 text-sm overflow-hidden">
        <p>> NETRA-BIOS v1.3.37</p>
        <p>> CPU: Quantum Entangler @ 5.0 THz</p>
        <p>> MEM: 1024 PB</p>
        <p>> Checking system integrity... [OK]</p>
        <p>> Loading C2 kernel modules... [OK]</p>
        <p>> Initializing stealth protocols... <span className="animate-pulse">|</span></p>
    </div>
);

const OperatorV2SplashScreen = () => (
  <div className="relative h-full w-full flex flex-col items-center justify-center bg-[#0A0E1A] p-4 font-mono overflow-hidden">
    <style jsx>{`
      @keyframes glitch-effect {
        0% { transform: translate(0); }
        20% { transform: translate(-2px, 2px); }
        40% { transform: translate(-2px, -2px); }
        60% { transform: translate(2px, 2px); }
        80% { transform: translate(2px, -2px); }
        100% { transform: translate(0); }
      }
      .glitch-bar > div {
        animation: glitch-effect 0.5s infinite;
        text-shadow: 0 0 5px hsl(var(--accent)), 0 0 10px hsl(var(--accent));
      }
    `}</style>
    <div className="w-full max-w-lg flex flex-col items-center text-center">
        <Logo className="h-16 w-16 mb-2" />
        <h1 className="font-headline text-2xl font-bold tracking-widest text-foreground">NETRA-X</h1>
        <div className="h-24 w-full text-left text-sm text-muted-foreground mt-8">
            <p className="text-accent">> Booting main kernel...</p>
            <p>> Decrypting secure modules...</p>
            <p>> Authenticating user session...</p>
        </div>
        <div className="w-full pt-4 space-y-2">
           <div className="glitch-bar">
             <Progress value={60} className="h-1.5 bg-accent/20" />
           </div>
           <p className="text-xs text-muted-foreground">
             SYSTEM STATUS: <span className="text-accent">OPERATIONAL</span>
           </p>
        </div>
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

      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
          <Card>
              <CardHeader><CardTitle>4. Corporate Theme</CardTitle></CardHeader>
              <CardContent className="aspect-video">
                  <CorporateSplashScreen />
              </CardContent>
          </Card>
           <Card>
              <CardHeader><CardTitle>5. Retro Terminal Theme</CardTitle></CardHeader>
              <CardContent className="aspect-video">
                  <RetroTermSplashScreen />
              </CardContent>
          </Card>
           <Card>
              <CardHeader><CardTitle>6. Operator V2 (Re-imagined)</CardTitle></CardHeader>
              <CardContent className="aspect-video">
                  <OperatorV2SplashScreen />
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
