
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/use-auth';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { APP_MODULES, Module } from '@/lib/constants';
import type { Project, Task } from '@/app/(app)/project-management/page';

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { logout, users: teamMembers } = useAuth();
  
  const { value: projects } = useLocalStorage<Project[]>('netra-projects', []);
  const { value: tasks } = useLocalStorage<Task[]>('netra-tasks', []);

  const runCommand = useCallback((command: () => void) => {
    onOpenChange(false);
    command();
  }, [onOpenChange]);

  const allModules = APP_MODULES.flatMap(m => m.subModules ? m.subModules : m).filter(m => m.path);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          {allModules.map(module => (
            <CommandItem key={`nav-${module.path}`} onSelect={() => runCommand(() => router.push(module.path!))}>
              <module.icon className="mr-2 h-4 w-4" />
              <span>{module.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        
        {projects.length > 0 && (
          <CommandGroup heading="Projects">
            {projects.map(project => (
              <CommandItem key={`proj-${project.id}`} onSelect={() => runCommand(() => router.push('/project-management'))}>
                <project.icon className="mr-2 h-4 w-4" />
                <span>{project.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        
        {tasks.filter(t => t.status !== 'Completed').length > 0 && (
           <CommandGroup heading="My Tasks">
            {tasks.filter(t => t.status !== 'Completed').map(task => (
              <CommandItem key={`task-${task.id}`} onSelect={() => runCommand(() => router.push('/project-management'))}>
                 <task.icon className="mr-2 h-4 w-4" />
                <span>{task.description}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        
        <CommandGroup heading="Actions">
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>Switch to Light Mode</CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>Switch to Dark Mode</CommandItem>
            <CommandItem onSelect={() => runCommand(logout)}>Logout</CommandItem>
        </CommandGroup>

      </CommandList>
    </CommandDialog>
  );
}
