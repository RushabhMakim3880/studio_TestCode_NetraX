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

  const currentModule = useMemo(() => {
    const module = APP_MODULES.find((m) => pathname.startsWith(m.path));
    return module ? module.name : 'Dashboard';
  }, [pathname]);

  useEffect(() => {
    if (user?.role && currentModule) {
      setIsLoading(true);
      getContextAwareTip({ userRole: user.role, currentModule })
        .then((response) => {
          setTip(response.tip);
        })
        .catch((error) => {
          console.error('Failed to get context-aware tip:', error);
          setTip('Always double-check your target scope before engagement.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [user?.role, currentModule]);

  if (!tip || isLoading) {
    return (
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
            <Lightbulb className="h-4 w-4" />
            <span>Generating security tip...</span>
        </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
      <Lightbulb className="h-4 w-4 shrink-0 text-accent/80" />
      <p className="truncate">{tip}</p>
    </div>
  );
}
