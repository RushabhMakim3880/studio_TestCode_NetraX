
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

export type DashboardCardInfo = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  component: React.ComponentType;
  className?: string; // Optional className for grid layout (e.g., 'xl:col-span-2')
};

export const AVAILABLE_DASHBOARD_CARDS: DashboardCardInfo[] = [
  {
    id: 'system-info',
    title: 'System Info',
    description: 'Displays basic system and session information.',
    icon: Server,
    component: SystemInfo,
    className: 'md:col-span-1',
  },
  {
    id: 'network-status',
    title: 'Network Status',
    description: 'Shows live network connectivity and speed data.',
    icon: Wifi,
    component: NetworkStatus,
    className: 'md:col-span-1',
  },
  {
    id: 'user-stats',
    title: 'User Stats',
    description: 'Provides a quick link to user management.',
    icon: Users,
    component: UserStats,
    className: 'md:col-span-1',
  },
  {
    id: 'threat-intel',
    title: 'Threat Intelligence Summary',
    description: 'A summary of the latest high-priority CVEs.',
    icon: Rss,
    component: ThreatIntelSummary,
    className: 'md:col-span-1',
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
    className: 'md:col-span-1',
  },
  {
    id: 'user-roles',
    title: 'User Roles',
    description: 'Pie chart showing the breakdown of user roles.',
    icon: UserCog,
    component: UserRoleChart,
    className: 'md:col-span-1',
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
    className: 'md:col-span-2 xl:col-span-1',
  },
];


export const DEFAULT_DASHBOARD_LAYOUT = [
    'system-info',
    'network-status',
    'user-stats',
    'threat-intel',
    'project-progress',
    'task-status',
    'user-roles',
    'activity-feed',
    'user-performance'
];
