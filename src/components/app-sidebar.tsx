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
import { Logo } from './logo';
import { APP_MODULES, Module } from '@/lib/constants';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronRight } from 'lucide-react';

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [openCollapsibles, setOpenCollapsibles] = useState<string[]>([]);
  
  useEffect(() => {
    const allModuleNames = APP_MODULES.flatMap(m => m.subModules ? m.subModules.map(sm => sm.name) : (m.path ? [m.name] : []));
    const storedSettings = localStorage.getItem('netra-settings');
    if (storedSettings) {
      try {
        const settings = JSON.parse(storedSettings);
        setEnabledModules(Object.keys(settings).filter(key => settings[key]));
      } catch (e) {
        console.error("Failed to parse settings", e);
        setEnabledModules(allModuleNames);
      }
    } else {
      setEnabledModules(allModuleNames);
    }
  }, []);

  useEffect(() => {
    const activeParent = APP_MODULES.find(m => m.subModules?.some(sm => sm.path === pathname));
    if (activeParent) {
      setOpenCollapsibles(prev => [...new Set([...prev, activeParent.name])]);
    }
  }, [pathname]);

  if (!user) return null;

  const getVisibleSubModules = (module: Module): Module[] => {
    if (!module.subModules) return [];
    return module.subModules.filter(
      sm => sm.roles.includes(user.role) && enabledModules.includes(sm.name)
    );
  };

  return (
    <>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {APP_MODULES.map((module) => {
            if (module.subModules) {
              const visibleSubModules = getVisibleSubModules(module);
              if (visibleSubModules.length === 0) return null;

              return (
                <SidebarMenuItem key={module.name}>
                  <Collapsible
                    open={openCollapsibles.includes(module.name)}
                    onOpenChange={(isOpen) => {
                      setOpenCollapsibles(current =>
                        isOpen
                          ? [...current, module.name]
                          : current.filter(name => name !== module.name)
                      );
                    }}
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={visibleSubModules.some(sm => sm.path === pathname)}
                        tooltip={module.name}
                        className="w-full justify-between"
                      >
                         <div className="flex items-center gap-2">
                           <module.icon />
                           <span>{module.name}</span>
                         </div>
                        <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenu className="pt-1 pl-4">
                        {visibleSubModules.map(subModule => (
                          <SidebarMenuItem key={subModule.path}>
                            <Link href={subModule.path!}>
                              <SidebarMenuButton
                                isActive={pathname === subModule.path}
                                tooltip={subModule.name}
                                size="sm"
                                variant="ghost"
                                className="w-full"
                              >
                                <subModule.icon />
                                <span>{subModule.name}</span>
                              </SidebarMenuButton>
                            </Link>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
              );
            }

            if (module.path && module.roles.includes(user.role) && enabledModules.includes(module.name)) {
                return (
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
                );
            }
            
            return null;
          })}
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
