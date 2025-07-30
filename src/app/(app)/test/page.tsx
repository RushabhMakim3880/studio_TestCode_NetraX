
'use client';

import { Logo } from '@/components/logo';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';

// --- Splash Screen Components for Showcase ---

const OperatorSplashScreen = () => {
    const [progress, setProgress] = useState(0);
    const [step, setStep] = useState(0);
    const loadingSteps = [
        'Initializing NETRA-X...',
        'Establishing secure kernel connection...',
        'Loading RBAC policies...',
        'Decompressing module assets...',
        'Verifying system integrity...',
    ];

    useEffect(() => {
        const progressInterval = setInterval(() => {
            setProgress(prev => (prev >= 100 ? 0 : prev + 10));
        }, 500);
        const stepInterval = setInterval(() => {
            setStep(prev => (prev >= loadingSteps.length - 1 ? 0 : prev + 1));
        }, 1000);
        return () => {
            clearInterval(progressInterval);
            clearInterval(stepInterval);
        };
    }, [loadingSteps.length]);


    return (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-background p-4 font-mono overflow-hidden">
        <div className="w-full max-w-lg flex flex-col items-center">
            <Logo className="mb-6" />
            <div className="h-24 w-full text-left text-sm text-muted-foreground">
                <p className="text-accent">> {loadingSteps[step]}</p>
            </div>
            <div className="w-full pt-4">
                <Progress value={progress} className="h-2 bg-primary/20" />
                <p className="mt-2 text-center text-xs text-muted-foreground">
                    Loading... {progress}%
                </p>
            </div>
        </div>
    </div>
    )
};

const CyberpunkSplashScreen = () => {
    const [glitchTrigger, setGlitchTrigger] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setGlitchTrigger(Math.random());
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-black p-4 font-mono overflow-hidden">
        <style jsx>{`
            .glitch {
                animation: glitch 1.5s linear infinite;
                text-shadow: 0 0 5px #79ffef, 0 0 10px #79ffef, 0 0 20px #79ffef;
                transform: translate(${glitchTrigger * 4 - 2}px, ${glitchTrigger * -4 + 2}px);
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
                25% { transform: translate(-2px, 2px); opacity: 0.8; }
                50% { transform: translate(2px, -2px); opacity: 1; }
                75% { transform: translate(-2px, 2px); opacity: 0.7; }
            }
            @keyframes glitch-bar {
                0% { top: ${glitchTrigger * 100}%; }
                100% { top: ${Math.random() * 100}%; }
            }
        `}</style>
        <div className="glitch-bar" />
        <div className="glitch text-accent">
            <Logo />
        </div>
        <p className="mt-4 text-accent animate-pulse">SYSTEM BREACH IMMINENT</p>
    </div>
)};

const MinimalistSplashScreen = () => {
    useEffect(() => {
    }, []);

    return (
        <div className="relative h-full w-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 font-sans overflow-hidden">
            <div className="flex flex-col items-center space-y-4">
                 <div className="h-16 w-16 relative">
                     <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping"></div>
                     <Logo />
                 </div>
                <p className="text-lg font-medium text-muted-foreground animate-pulse">Loading NETRA-X</p>
            </div>
        </div>
    );
};

const CorporateSplashScreen = () => {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
             setProgress(prev => (prev >= 100 ? 0 : prev + 10));
        }, 400);
        return () => clearInterval(interval);
    }, []);
    
    return (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-blue-900 text-white p-4 font-sans overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="w-full max-w-sm flex flex-col items-center z-10">
            <Logo />
            <p className="mt-4 text-lg">Initializing Secure Environment</p>
             <div className="w-full pt-4 mt-4">
                <Progress value={progress} className="h-1 bg-blue-700 [&>div]:bg-blue-300" />
            </div>
        </div>
    </div>
)};

const RetroTermSplashScreen = () => {
    const steps = [
        "> NETRA-BIOS v1.3.37",
        "> CPU: Quantum Entangler @ 5.0 THz",
        "> MEM: 1024 PB",
        "> Checking system integrity... [OK]",
        "> Loading C2 kernel modules... [OK]",
        "> Initializing stealth protocols...",
    ];
    const [visibleSteps, setVisibleSteps] = useState(1);

    useEffect(() => {
        const interval = setInterval(() => {
            setVisibleSteps(prev => (prev >= steps.length ? 1 : prev + 1));
        }, 800);
        return () => clearInterval(interval);
    }, [steps.length]);
    
    return (
    <div className="relative h-full w-full flex flex-col items-start justify-start bg-black p-4 font-mono text-green-400 text-sm overflow-hidden">
        {steps.slice(0, visibleSteps).map((step, i) => (
             <p key={i}>{step}{i === visibleSteps - 1 && <span className="animate-pulse">|</span>}</p>
        ))}
    </div>
)};

const OperatorV2SplashScreen = () => {
    const [progress, setProgress] = useState(0);
    const loadingSteps = [
        'Booting main kernel...',
        'Decrypting secure modules...',
        'Authenticating user session...',
        'Reticulating splines...',
        'Finalizing UI...'
    ];
    const [currentStep, setCurrentStep] = useState(0);


    useEffect(() => {
        const progressInterval = setInterval(() => {
             setProgress(prev => (prev >= 100 ? 0 : prev + 5));
        }, 150);
         const stepInterval = setInterval(() => {
            setCurrentStep(prev => (prev >= loadingSteps.length - 1 ? 0 : prev + 1));
        }, 900);
        return () => {
            clearInterval(progressInterval);
            clearInterval(stepInterval);
        };
    }, [loadingSteps.length]);

  return (
  <div className="relative h-full w-full flex flex-col items-center justify-center p-4 font-mono overflow-hidden" style={{ backgroundColor: 'rgb(0, 0, 0)'}}>
    <style jsx>{`
      @keyframes glitch {
        0% { clip-path: inset(10% 0 85% 0); }
        10% { clip-path: inset(40% 0 40% 0); }
        20% { clip-path: inset(90% 0 5% 0); }
        30% { clip-path: inset(25% 0 70% 0); }
        40% { clip-path: inset(5% 0 90% 0); }
        50% { clip-path: inset(60% 0 30% 0); }
        60% { clip-path: inset(80% 0 10% 0); }
        70% { clip-path: inset(15% 0 80% 0); }
        80% { clip-path: inset(50% 0 45% 0); }
        90% { clip-path: inset(5% 0 90% 0); }
        100% { clip-path: inset(75% 0 15% 0); }
      }
      .glitch-text::before,
      .glitch-text::after {
        content: attr(data-text);
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: inherit;
        color: white;
      }
      .glitch-text::before {
        left: 2px;
        text-shadow: -2px 0 #ff00c1;
        clip-path: inset(25% 0 70% 0);
        animation: glitch 1.5s infinite linear alternate-reverse;
      }
      .glitch-text::after {
        left: -2px;
        text-shadow: 2px 0 #00fff9;
        clip-path: inset(5% 0 90% 0);
        animation: glitch 2s infinite linear alternate-reverse;
      }
      .hide-logo-text span {
        display: none;
      }
      .logo-container > div {
          height: 100%;
          width: 100%;
      }
    `}</style>
    <div className="w-full max-w-lg flex flex-col items-center text-center">
        <div className="h-24 w-24 text-white mb-4 logo-container">
            <Logo className="hide-logo-text h-full w-full" />
        </div>
        <h1 className="font-headline text-2xl font-bold tracking-widest text-white mt-4 relative glitch-text" data-text="NETRA-X">
          NETRA-X
        </h1>
        <div className="h-24 w-full flex items-center justify-center text-sm text-white/80 mt-12">
            <p className="text-white">{loadingSteps[currentStep]}</p>
        </div>
        <div className="w-full pt-4 space-y-2">
           <Progress value={progress} className="h-1.5 bg-white/20 [&>div]:bg-white" />
           <p className="text-xs text-white/70">
             SYSTEM STATUS: <span className="text-white">OPERATIONAL</span>
           </p>
        </div>
    </div>
  </div>
)};


export default function SplashscreenShowcasePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Splash Screen Designs</h1>
        <p className="text-muted-foreground">Review the different splash screen concepts below.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
          <Card>
              <CardHeader><CardTitle>1. Operator Theme (Current)</CardTitle></CardHeader>
              <CardContent className="h-96">
                  <OperatorSplashScreen />
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle>2. Cyberpunk Theme</CardTitle></CardHeader>
              <CardContent className="h-96">
                  <CyberpunkSplashScreen />
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle>3. Minimalist Theme</CardTitle></CardHeader>
              <CardContent className="h-96">
                  <MinimalistSplashScreen />
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle>4. Corporate Theme</CardTitle></CardHeader>
              <CardContent className="h-96">
                  <CorporateSplashScreen />
              </CardContent>
          </Card>
           <Card>
              <CardHeader><CardTitle>5. Retro Terminal Theme</CardTitle></CardHeader>
              <CardContent className="h-96">
                  <RetroTermSplashScreen />
              </CardContent>
          </Card>
           <Card>
              <CardHeader><CardTitle>6. Operator V2 (Re-imagined)</CardTitle></CardHeader>
              <CardContent className="h-96">
                  <OperatorV2SplashScreen />
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
