'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { Logo } from './logo';
import { APP_MODULES, Module } from '@/lib/constants';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  
  useEffect(() => {
    const storedSettings = localStorage.getItem('netra-settings');
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      setEnabledModules(Object.keys(settings).filter(key => settings[key]));
    } else {
      // Default: all modules enabled
      setEnabledModules(APP_MODULES.map(m => m.name));
    }
  }, []);

  if (!user) return null;

  const accessibleModules = APP_MODULES.filter(
    (module) => module.roles.includes(user.role) && enabledModules.includes(module.name)
  );

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {accessibleModules.map((module) => (
            <SidebarMenuItem key={module.path}>
              <Link href={module.path}>
                <SidebarMenuButton
                  isActive={pathname === module.path}
                  tooltip={module.name}
                >
                  <module.icon />
                  <span>{module.name}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="w-full p-2 text-center text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          <p>&copy; {new Date().getFullYear()} NETRA-X</p>
          <p>For Authorized Use Only</p>
        </div>
      </SidebarFooter>
    </>
  );
}
