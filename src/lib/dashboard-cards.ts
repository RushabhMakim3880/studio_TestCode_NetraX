
import { SystemInfo } from '@/components/dashboard/system-info';
import { NetworkStatus } from '@/components/dashboard/network-status';
import { UserStats } from '@/components/dashboard/user-stats';
import { ProjectsBarChart } from '@/components/dashboard/projects-bar-chart';
import { TaskStatusChart } from '@/components/dashboard/task-status-chart';
import { UserRoleChart } from '@/components/dashboard/user-role-chart';
import { UserPerformanceChart } from '@/components/dashboard/user-performance-chart';
import { ThreatIntelSummary } from '@/components/dashboard/threat-intel-summary';
import { ActivityFeed } from '@/components/activity-feed';
import type { LucideIcon } from 'lucide-react';
import { Server, Wifi, Users, Briefcase, ClipboardList, UserCog, Award, Rss, History } from 'lucide-react';
import type { Module } from '@/lib/constants';
import { APP_MODULES } from '@/lib/constants';

export type DashboardCardInfo = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  component?: React.ComponentType; // Optional for shortcuts
  className?: string; // Optional className for grid layout (e.g., 'xl:col-span-2')
  module?: Module; // Optional for shortcuts
};

export const AVAILABLE_WIDGET_CARDS: DashboardCardInfo[] = [
  {
    id: 'system-info',
    title: 'System Info',
    description: 'Displays basic system and session information.',
    icon: Server,
    component: SystemInfo,
  },
  {
    id: 'network-status',
    title: 'Network Status',
    description: 'Shows live network connectivity and speed data.',
    icon: Wifi,
    component: NetworkStatus,
  },
  {
    id: 'user-stats',
    title: 'User Stats',
    description: 'Provides a quick link to user management.',
    icon: Users,
    component: UserStats,
  },
  {
    id: 'threat-intel',
    title: 'Threat Intelligence Summary',
    description: 'A summary of the latest high-priority CVEs.',
    icon: Rss,
    component: ThreatIntelSummary,
  },
  {
    id: 'project-progress',
    title: 'Active Project Progress',
    description: 'Bar chart showing the progress of active projects.',
    icon: Briefcase,
    component: ProjectsBarChart,
    className: 'md:col-span-2',
  },
  {
    id: 'task-status',
    title: 'Task Status',
    description: 'Pie chart of all tasks by their current status.',
    icon: ClipboardList,
    component: TaskStatusChart,
  },
  {
    id: 'user-roles',
    title: 'User Roles',
    description: 'Pie chart showing the breakdown of user roles.',
    icon: UserCog,
    component: UserRoleChart,
  },
  {
    id: 'user-performance',
    title: 'User Performance',
    description: 'Chart of completed tasks per user.',
    icon: Award,
    component: UserPerformanceChart,
    className: 'md:col-span-2',
  },
  {
    id: 'activity-feed',
    title: 'Activity Feed',
    description: 'A live feed of recent user actions on the platform.',
    icon: History,
    component: ActivityFeed,
  },
];

// Dynamically generate shortcut cards from APP_MODULES
export const AVAILABLE_SHORTCUT_CARDS: DashboardCardInfo[] = APP_MODULES
  .flatMap(module => module.subModules ? module.subModules : [module])
  .filter(module => module.path && module.path !== '/dashboard') // Exclude dashboard itself
  .map(module => ({
    id: `shortcut-${module.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    title: module.name,
    description: `Shortcut to the ${module.name} page.`,
    icon: module.icon,
    module: module,
  }));
  
export const ALL_AVAILABLE_CARDS = [...AVAILABLE_WIDGET_CARDS, ...AVAILABLE_SHORTCUT_CARDS];

// Helper function to get shortcut card info by ID
export const getShortcutCardInfo = (id: string, modules: Module[]): DashboardCardInfo | null => {
    if (!id.startsWith('shortcut-')) return null;

    const moduleName = id.replace('shortcut-', '').replace(/-/g, ' ');

    const findModule = (mods: Module[]): Module | undefined => {
        for (const mod of mods) {
            const normalizedModuleName = mod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const normalizedTargetName = moduleName.replace(/\s+/g, '-');
            if (normalizedModuleName === normalizedTargetName) return mod;
            if (mod.subModules) {
                const found = findModule(mod.subModules);
                if (found) return found;
            }
        }
    };
    
    const module = findModule(modules);
    if (!module) return null;

    return {
        id,
        title: module.name,
        description: `Shortcut to the ${module.name} page.`,
        icon: module.icon,
        module,
    };
};

export const DEFAULT_DASHBOARD_LAYOUT = [
    'system-info',
    'network-status',
    'threat-intel',
    'project-progress',
    'task-status',
    'activity-feed',
    'user-roles',
    'user-performance'
];
