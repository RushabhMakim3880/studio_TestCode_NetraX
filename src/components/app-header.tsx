
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, User, Circle, UserCheck, Coffee, MicOff, Briefcase, Plane, Search, Moon, Sun, Palette } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth, type UserStatus } from '@/hooks/use-auth';
import Link from 'next/link';
import { ContextAwareTip } from './context-aware-tip';
import { Breadcrumb } from './breadcrumb';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { ThemeSwitcher } from './theme-switcher';

const getStatusColor = (status?: UserStatus) => {
    if (!status) return 'bg-muted-foreground/50';
    switch (status) {
        case 'Active': return 'bg-green-400';
        case 'Away': return 'bg-amber-400';
        case 'In Meeting': return 'bg-purple-400';
        case 'DND': return 'bg-red-500';
        case 'Out of Office':
        case 'Offline':
        default: return 'bg-muted-foreground/50';
    }
}

const userStatuses: { name: UserStatus, icon: React.FC<any> }[] = [
    { name: 'Active', icon: UserCheck },
    { name: 'Away', icon: Coffee },
    { name: 'In Meeting', icon: Briefcase },
    { name: 'DND', icon: MicOff },
    { name: 'Out of Office', icon: Plane },
    { name: 'Offline', icon: Circle },
];

type AppHeaderProps = {
    onCommandPaletteToggle: () => void;
};

export function AppHeader({ onCommandPaletteToggle }: AppHeaderProps) {
  const { user, logout, updateUser } = useAuth();
  const { setTheme } = useTheme();

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  const handleStatusChange = (status: UserStatus) => {
    if (user) {
        updateUser(user.username, { status });
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card/80 px-4 backdrop-blur-sm md:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        <Breadcrumb />
      </div>
       <div className="flex-1">
        <ContextAwareTip />
      </div>
      <div className="flex items-center gap-2">
         <Button variant="ghost" size="icon" onClick={onCommandPaletteToggle} className="text-muted-foreground hover:text-foreground">
            <Search className="h-5 w-5"/>
            <span className="sr-only">Open Command Palette</span>
        </Button>

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                 {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(user.displayName)}
                </AvatarFallback>
              </Avatar>
               <span className={cn(
                    "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-card",
                    getStatusColor(user.status)
                )} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.role}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <Circle className="mr-2 h-4 w-4"/>
                    <span>Set Status</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={user.status} onValueChange={(s) => handleStatusChange(s as UserStatus)}>
                        {userStatuses.map(status => (
                            <DropdownMenuRadioItem key={status.name} value={status.name} className="gap-2">
                                <status.icon className="h-4 w-4"/> {status.name}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
             <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <Palette className="mr-2 h-4 w-4" />
                    <span>Switch Theme</span>
                </DropdownMenuSubTrigger>
                 <DropdownMenuSubContent>
                    <ThemeSwitcher />
                </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      </div>
    </header>
  );
}
