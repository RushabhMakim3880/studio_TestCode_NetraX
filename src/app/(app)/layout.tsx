
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkflowGenerator } from '@/components/workflow-generator';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // The hosted phishing page will manage its own minimal layout.
  // We check for the specific path pattern to avoid rendering the main app UI.
  if (pathname.startsWith('/phishing/')) {
      return <>{children}</>;
  }

  useEffect(() => {
    // Only redirect on the client side after the initial render.
    if (isClient && !isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router, isClient]);

  // On the server, render nothing to avoid hydration mismatches.
  // The loading skeleton will appear instantly on the client.
  if (!isClient) {
    return null;
  }

  if (isLoading || !user) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
        <WorkflowGenerator />
      </SidebarInset>
    </SidebarProvider>
  );
}
