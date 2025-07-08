
import type { LucideIcon } from 'lucide-react';
import { Shield, LayoutDashboard, Settings, ShieldCheck, Fingerprint, Bot, Route, Files, Presentation, UserCog, Target, FileScan, MessageSquarePlus, KeyRound, Network, Server, GanttChartSquare, ListCollapse, Wrench, Router, Waypoints, Shell, BrainCircuit, Dna, Briefcase, FileText, Mail } from 'lucide-react';

export const ROLES = {
  ADMIN: 'Admin',
  ANALYST: 'Analyst',
  OPERATOR: 'Operator',
  AUDITOR: 'Auditor',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

const ALL_ROLES: Role[] = [ROLES.ADMIN, ROLES.ANALYST, ROLES.OPERATOR, ROLES.AUDITOR];

export type Module = {
  name: string;
  path?: string; // Path is optional for parent modules
  icon: LucideIcon;
  roles: Role[];
  subModules?: Module[];
};

export const PREMADE_AVATARS = [
    'https://placehold.co/128x128/222/79ffef/png?text=A1',
    'https://placehold.co/128x128/444/ff6b6b/png?text=B2',
    'https://placehold.co/128x128/333/4d96ff/png?text=C3',
    'https://placehold.co/128x128/555/feca57/png?text=D4',
    'https://placehold.co/128x128/2a2a2a/ff9f43/png?text=E5',
    'https://placehold.co/128x128/4b4b4b/1dd1a1/png?text=F6'
];


export const APP_MODULES: Module[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ALL_ROLES,
  },
   {
    name: 'Project Management',
    path: '/project-management',
    icon: Briefcase,
    roles: ALL_ROLES,
  },
  {
    name: 'Intelligence',
    icon: BrainCircuit,
    roles: ALL_ROLES,
    subModules: [
      { name: 'Cyber Intel', path: '/cyber-intel', icon: Shield, roles: ALL_ROLES },
      { name: 'OSINT', path: '/osint', icon: Fingerprint, roles: ALL_ROLES },
      { name: 'Profiling', path: '/profiling', icon: Target, roles: ALL_ROLES },
      { name: 'Dark Web', path: '/dark-web', icon: Shell, roles: ALL_ROLES },
    ]
  },
   {
    name: 'Social Engineering',
    icon: Bot,
    roles: ALL_ROLES,
    subModules: [
      { name: 'Phishing', path: '/phishing', icon: Bot, roles: ALL_ROLES },
      { name: 'Templates', path: '/templates', icon: MessageSquarePlus, roles: ALL_ROLES },
    ]
  },
    {
    name: 'Operations',
    icon: KeyRound,
    roles: ALL_ROLES,
    subModules: [
      { name: 'C2 Panel', path: '/c2', icon: Server, roles: ALL_ROLES },
      { name: 'Offensive Tools', path: '/offensive', icon: KeyRound, roles: ALL_ROLES },
      { name: 'Developer Tools', path: '/dev-tools', icon: Wrench, roles: ALL_ROLES },
      { name: 'Anonymization', path: '/anonymization', icon: Waypoints, roles: ALL_ROLES },
    ]
  },
  {
    name: 'Analysis & Forensics',
    icon: Dna,
    roles: ALL_ROLES,
    subModules: [
      { name: 'VAPT & Compliance', path: '/vapt', icon: ShieldCheck, roles: ALL_ROLES },
      { name: 'Malware Analysis', path: '/analysis', icon: FileScan, roles: ALL_ROLES },
      { name: 'Network Analysis', path: '/network', icon: Network, roles: ALL_ROLES },
      { name: 'IoT Security', path: '/iot', icon: Router, roles: ALL_ROLES },
      { name: 'Log Analysis', path: '/log-analysis', icon: GanttChartSquare, roles: ALL_ROLES },
      { name: 'IoC Management', path: '/ioc-management', icon: ListCollapse, roles: ALL_ROLES },
    ]
  },
  {
    name: 'File Manager',
    path: '/files',
    icon: Files,
    roles: ALL_ROLES,
  },
  {
    name: 'Documents',
    path: '/documents',
    icon: FileText,
    roles: ALL_ROLES,
  },
  {
    name: 'Reporting',
    path: '/reporting',
    icon: Presentation,
    roles: ALL_ROLES,
  },
  // Keep system stuff at the end and top-level
  {
    name: 'User Management',
    path: '/user-management',
    icon: UserCog,
    roles: [ROLES.ADMIN],
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: Settings,
    roles: ALL_ROLES,
  },
];
