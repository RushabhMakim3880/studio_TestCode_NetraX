'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Lightbulb } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getContextAwareTip } from '@/ai/flows/context-aware-tips';
import { APP_MODULES } from '@/lib/constants';

export function ContextAwareTip() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [tip, setTip] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const currentModule = useMemo(() => {
    // Correctly find the current module, including sub-modules
    for (const module of APP_MODULES) {
      if (module.subModules) {
        const subModule = module.subModules.find(sm => sm.path === pathname);
        if (subModule) return subModule.name;
      }
      if (module.path && pathname.startsWith(module.path)) {
        return module.name;
      }
    }
    return 'Dashboard';
  }, [pathname]);

  useEffect(() => {
    if (user?.role && currentModule) {
      setIsLoading(true);
      setError(false); // Reset error state on new fetch
      getContextAwareTip({ userRole: user.role, currentModule })
        .then((response) => {
          setTip(response.tip);
        })
        .catch((err) => {
          // Fail silently for this non-critical component.
          // Don't log the error to the console to avoid alarming the user.
          setError(true);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
        setIsLoading(false); // No user/module, so not loading
    }
  }, [user?.role, currentModule]);

  if (isLoading) {
    return (
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
            <Lightbulb className="h-4 w-4" />
            <span>Generating security tip...</span>
        </div>
    );
  }

  // If there's an error or no tip, render nothing
  if (error || !tip) {
    return null;
  }

  return (
    <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
      <Lightbulb className="h-4 w-4 shrink-0 text-accent/80" />
      <p className="truncate">{tip}</p>
    </div>
  );
}
