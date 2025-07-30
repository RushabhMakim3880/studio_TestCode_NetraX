
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/use-auth';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { APP_MODULES, Module, ROLES } from '@/lib/constants';
import type { Project, Task } from '@/app/(app)/project-management/page';
import { ClipboardList, Trash2, Moon, Sun, LogOut } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/services/activity-log-service';
import type { CapturedCredential } from './credential-harvester';
import { TrackedEvent } from './live-tracker';

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const { value: projects } = useLocalStorage<Project[]>('netra-projects', []);
  const { value: tasks } = useLocalStorage<Task[]>('netra-tasks', []);
  const { setValue: setCredentials } = useLocalStorage<CapturedCredential[]>('netra-captured-credentials', []);
  const { setValue: setSessions } = useLocalStorage<Record<string, TrackedEvent[]>>('netra-sessions', {});

  const runCommand = useCallback((command: () => void) => {
    onOpenChange(false);
    command();
  }, [onOpenChange]);

  const allModules = APP_MODULES.flatMap(m => m.subModules ? m.subModules : m).filter(m => m.path);

  const handleClearActivityLog = () => {
    localStorage.removeItem('netra-activity-log');
    // Dispatch a storage event to notify listeners, including the ActivityFeed component
    window.dispatchEvent(new StorageEvent('storage', { key: 'netra-activity-log', newValue: '[]' }));
    logActivity({ user: user?.displayName || 'Admin', action: 'Cleared Activity Log', details: 'Command Palette' });
    toast({ title: "Activity Log Cleared" });
  };
  
  const handleClearCredentials = () => {
      setCredentials([]);
      logActivity({ user: user?.displayName || 'Admin', action: 'Cleared Captured Credentials', details: 'Command Palette' });
      toast({ title: "Captured Credentials Cleared" });
  };

  const handleClearSessions = () => {
      setSessions({});
      logActivity({ user: user?.displayName || 'Admin', action: 'Cleared Session History', details: 'Command Palette' });
      toast({ title: "Session History Cleared" });
  }

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
                 <ClipboardList className="mr-2 h-4 w-4" />
                <span>{task.description}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        
        <CommandGroup heading="Actions">
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}><Sun className="mr-2 h-4 w-4"/>Switch to Light Mode</CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}><Moon className="mr-2 h-4 w-4"/>Switch to Dark Mode</CommandItem>
            <CommandItem onSelect={() => runCommand(logout)}><LogOut className="mr-2 h-4 w-4"/>Logout</CommandItem>
        </CommandGroup>
        
        {user?.role === ROLES.ADMIN && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Admin Actions">
                <AlertDialog>
                  <AlertDialogTrigger asChild><CommandItem onSelect={(e) => e.preventDefault()}><Trash2 className="mr-2 h-4 w-4 text-destructive"/>Clear Captured Credentials</CommandItem></AlertDialogTrigger>
                  <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete all captured credentials from local storage.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => runCommand(handleClearCredentials)}>Confirm</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild><CommandItem onSelect={(e) => e.preventDefault()}><Trash2 className="mr-2 h-4 w-4 text-destructive"/>Clear Session History</CommandItem></AlertDialogTrigger>
                  <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete all captured session data.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => runCommand(handleClearSessions)}>Confirm</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                </AlertDialog>
                 <AlertDialog>
                  <AlertDialogTrigger asChild><CommandItem onSelect={(e) => e.preventDefault()}><Trash2 className="mr-2 h-4 w-4 text-destructive"/>Clear Activity Log</CommandItem></AlertDialogTrigger>
                  <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the global activity log.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => runCommand(handleClearActivityLog)}>Confirm</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                </AlertDialog>
            </CommandGroup>
          </>
        )}

      </CommandList>
    </CommandDialog>
  );
}
