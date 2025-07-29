
'use client';

import { SystemInfo } from '@/components/dashboard/system-info';
import { NetworkStatus } from '@/components/dashboard/network-status';
import { UserStats } from '@/components/dashboard/user-stats';
import { LiveC2Sessions } from '@/components/dashboard/live-c2-sessions';
import { HoneytrapStatus } from '@/components/dashboard/honeytrap-status';
import { LatestCredentials } from '@/components/dashboard/latest-credentials';
import { TodoList } from '@/components/dashboard/todo-list';
import { ActivityFeed } from '@/components/activity-feed';
import type { LucideIcon } from 'lucide-react';
import { Server, Wifi, Users, Briefcase, ClipboardList, UserCog, Award, Rss, History, Radio, KeyRound, ShieldAlert, ListChecks, MessageSquare } from 'lucide-react';
import type { Module } from '@/lib/constants';
import { APP_MODULES } from '@/lib/constants';
import { TeamStatus } from '@/components/dashboard/team-status';
import { UserPerformanceChart } from '@/components/dashboard/user-performance-chart';
import { ProjectsBarChart } from '@/components/dashboard/projects-bar-chart';
import { ChatSummary } from '@/components/dashboard/chat-summary';


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
    description: 'Shows live network connectivity and geo-location data.',
    icon: Wifi,
    component: NetworkStatus,
  },
  {
    id: 'team-status',
    title: 'Team Status',
    description: 'Shows the online status of team members.',
    icon: Users,
    component: TeamStatus,
  },
   {
    id: 'live-c2-sessions',
    title: 'Live C2 Sessions',
    description: 'Displays currently active C2 channels and their status.',
    icon: Radio,
    component: LiveC2Sessions,
  },
  {
    id: 'latest-credentials',
    title: 'Latest Credentials',
    description: 'A feed of the most recently captured credentials.',
    icon: KeyRound,
    component: LatestCredentials,
  },
  {
    id: 'honeytrap-status',
    title: 'Honeytrap Status',
    description: 'Alerts you if a honeypot has been triggered.',
    icon: ShieldAlert,
    component: HoneytrapStatus,
  },
  {
    id: 'chat-summary',
    title: 'Team Chat',
    description: 'A summary of team chat and unread messages.',
    icon: MessageSquare,
    component: ChatSummary,
  },
  {
    id: 'todo-list',
    title: 'Personal Scratchpad',
    description: 'A personal scratchpad for tracking tasks and notes.',
    icon: ListChecks,
    component: TodoList,
    className: 'md:col-span-2 xl:col-span-1',
  },
  {
    id: 'projects-bar-chart',
    title: 'Active Project Progress',
    description: 'A bar chart showing the progress of active projects.',
    icon: Briefcase,
    component: ProjectsBarChart,
    className: 'xl:col-span-2',
  },
  {
    id: 'user-performance-chart',
    title: 'User Performance',
    description: 'A bar chart displaying tasks completed by each team member.',
    icon: Award,
    component: UserPerformanceChart,
    className: 'md:col-span-3',
  },
   {
    id: 'user-stats',
    title: 'User Roles',
    description: 'A summary of user roles and counts within the system.',
    icon: UserCog,
    component: UserStats,
  },
  {
    id: 'activity-feed',
    title: 'Activity Feed',
    description: 'A live feed of recent user actions on the platform.',
    icon: History,
    component: ActivityFeed,
    className: 'md:col-span-3'
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

export const DEFAULT_DASHBOARD_LAYOUT = [
    'system-info',
    'network-status',
    'team-status',
    'chat-summary',
    'live-c2-sessions',
    'latest-credentials',
    'honeytrap-status',
    'todo-list',
    'projects-bar-chart',
    'activity-feed',
    'shortcut-project-management',
    'shortcut-phishing',
    'shortcut-osint-investigator'
];
