import type { LucideIcon } from 'lucide-react';
import { Shield, LayoutDashboard, Settings, Bug, ShieldCheck, Fingerprint, Bot, Route, Files, Presentation, UserCog } from 'lucide-react';

export const ROLES = {
  ADMIN: 'Admin',
  ANALYST: 'Analyst',
  OPERATOR: 'Operator',
  AUDITOR: 'Auditor',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export type Module = {
  name: string;
  path: string;
  icon: LucideIcon;
  roles: Role[];
  subModules?: Module[];
};

export const APP_MODULES: Module[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: [ROLES.ADMIN, ROLES.ANALYST, ROLES.OPERATOR, ROLES.AUDITOR],
  },
  {
    name: 'Cyber Intel',
    path: '/cyber-intel',
    icon: Shield,
    roles: [ROLES.ADMIN, ROLES.ANALYST],
  },
  {
    name: 'Offensive Tools',
    path: '/offensive',
    icon: Bug,
    roles: [ROLES.ADMIN, ROLES.OPERATOR],
  },
  {
    name: 'Phishing',
    path: '/phishing',
    icon: Bot,
    roles: [ROLES.ADMIN, ROLES.OPERATOR],
  },
  {
    name: 'OSINT',
    path: '/osint',
    icon: Fingerprint,
    roles: [ROLES.ADMIN, ROLES.ANALYST, ROLES.OPERATOR],
  },
  {
    name: 'VAPT & Compliance',
    path: '/vapt',
    icon: ShieldCheck,
    roles: [ROLES.ADMIN, ROLES.ANALYST, ROLES.AUDITOR],
  },
  {
    name: 'Campaigns',
    path: '/campaigns',
    icon: Route,
    roles: [ROLES.ADMIN, ROLES.OPERATOR],
  },
  {
    name: 'Reporting',
    path: '/reporting',
    icon: Presentation,
    roles: [ROLES.ADMIN, ROLES.ANALYST, ROLES.AUDITOR],
  },
  {
    name: 'File Manager',
    path: '/files',
    icon: Files,
    roles: [ROLES.ADMIN, ROLES.OPERATOR],
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: Settings,
    roles: [ROLES.ADMIN, ROLES.ANALYST, ROLES.OPERATOR, ROLES.AUDITOR],
  },
   {
    name: 'User Management',
    path: '/user-management',
    icon: UserCog,
    roles: [ROLES.ADMIN],
  },
];
