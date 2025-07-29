
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
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from './logo';
import { APP_MODULES, Module, ALL_ROLES } from '@/lib/constants';
import { useAuth } from '@/hooks/use-auth';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, Wrench } from 'lucide-react';

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (!user) return null;

  const getVisibleSubModules = (module: Module): Module[] => {
    if (!module.subModules) return [];
    return module.subModules.filter(
      sm => sm.roles.includes(user.role) && (user.enabledModules || []).includes(sm.name)
    );
  };
  
  const allModules = [
    ...APP_MODULES,
    // Add the test page module dynamically only in development
    ...(process.env.NODE_ENV === 'development' ? [{
        name: 'Test Page',
        path: '/test',
        icon: Wrench, // Using Wrench icon as an example
        roles: ALL_ROLES,
    }] : [])
  ];

  return (
    <>
      <SidebarHeader className="border-b">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {APP_MODULES.map((module) => {
            const visibleSubModules = module.subModules ? getVisibleSubModules(module) : [];
            const hasVisibleSubModules = visibleSubModules.length > 0;
            const isParentActive = hasVisibleSubModules && visibleSubModules.some(sm => sm.path === pathname);

            // Handle parent modules with sub-modules
            if (hasVisibleSubModules) {
              if (isCollapsed) {
                return (
                  <SidebarMenuItem key={module.name} tooltip={module.name}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton isActive={isParentActive} className="w-full justify-center">
                          <module.icon />
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start" className="ml-2">
                        {visibleSubModules.map(subModule => (
                          <DropdownMenuItem key={subModule.path} asChild>
                            <Link href={subModule.path!}>
                              <subModule.icon />
                              <span>{subModule.name}</span>
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                );
              }
              
              return (
                <SidebarMenuItem key={module.name}>
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={isParentActive}
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

            // Handle top-level modules without sub-modules
            if (module.path && module.roles.includes(user.role) && (user.enabledModules || []).includes(module.name)) {
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
      <SidebarFooter className="border-t">
        <div className="w-full p-2 text-center text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          <p>&copy; {new Date().getFullYear()} NETRA-X</p>
          <p>For Authorized Use Only</p>
        </div>
      </SidebarFooter>
    </>
  );
}
