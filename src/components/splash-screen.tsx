
'use client';

import { useState, useEffect } from 'react';
import { Logo } from '@/components/logo';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { User } from '@/hooks/use-auth';

const getLoadingSteps = (username?: string) => [
  'Initializing NETRA-X Core...',
  'Establishing secure kernel connection...',
  'Loading RBAC policies...',
  'Decompressing module assets...',
  'Verifying system integrity...',
  'Mounting offensive toolkits...',
  'Finalizing UI...',
  `Welcome, ${username || 'Operator'}.`,
];

type SplashScreenProps = {
  user: User | null;
};

export default function SplashScreen({ user }: SplashScreenProps) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const loadingSteps = getLoadingSteps(user?.displayName);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStep((prevStep) => (prevStep < loadingSteps.length - 1 ? prevStep + 1 : prevStep));
    }, 400);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(stepInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [loadingSteps.length]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 font-mono">
      <div className="flex w-full max-w-lg flex-col items-center rounded-lg border border-border/50 bg-card p-8 shadow-2xl shadow-black/20">
        <Logo className="mb-6" />
        <div className="h-48 w-full overflow-hidden text-left text-sm text-muted-foreground">
          {loadingSteps.slice(0, step + 1).map((text, i) => (
            <p key={i} className={cn("animate-in fade-in", { 'text-accent': i === step })}>
              <span className="text-accent/50 mr-2">></span>{text}
            </p>
          ))}
        </div>
        <div className="w-full pt-4">
          <Progress value={progress} className="h-2 bg-primary/20" />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Loading... {progress}%
          </p>
        </div>
      </div>
       <p className="mt-8 text-xs text-muted-foreground">
        Nodal Electronic Threat Reconnaissance & Attack System | For authorized government use only.
      </p>
    </div>
  );
}
