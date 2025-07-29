
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Settings,
  Fingerprint,
  Shield,
  Files,
  Presentation,
  UserCog,
  FileScan,
  KeyRound,
  Server,
  GanttChartSquare,
  Wrench,
  Router,
  BrainCircuit,
  Dna,
  Briefcase,
  FileText,
  Mail,
  ShieldCheck,
  Users,
  Target,
  MessageSquarePlus,
  Network,
  Syringe,
  Cpu,
  Bug,
  Cookie,
  KeySquare,
  ShieldHalf,
  Binary,
  MousePointer2,
  GitFork,
  Link,
  GitBranch,
  Workflow,
  Rocket,
  Radar,
  Camera,
  Combine,
  EyeOff,
  Radio,
  TestTube,
  MessageSquare,
} from 'lucide-react';

export const ROLES = {
  ADMIN: 'Admin',
  ANALYST: 'Analyst',
  OPERATOR: 'Operator',
  AUDITOR: 'Auditor',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: Role[] = [
  ROLES.ADMIN,
  ROLES.ANALYST,
  ROLES.OPERATOR,
  ROLES.AUDITOR,
];

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
  'https://placehold.co/128x128/4b4b4b/1dd1a1/png?text=F6',
];

export const APP_MODULES: Module[] = [
  {
    name: 'Core',
    icon: LayoutDashboard,
    roles: ALL_ROLES,
    subModules: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ALL_ROLES },
      { name: 'Project Management', path: '/project-management', icon: Briefcase, roles: ALL_ROLES },
      { name: 'Communication', path: '/chat', icon: MessageSquare, roles: ALL_ROLES },
    ],
  },
  {
    name: 'Intelligence',
    icon: BrainCircuit,
    roles: ALL_ROLES,
    subModules: [
      { name: 'OSINT Investigator', path: '/osint', icon: Fingerprint, roles: ALL_ROLES },
      { name: 'Threat Intelligence', path: '/threat-intelligence', icon: Shield, roles: ALL_ROLES },
      { name: 'Network Investigation', path: '/network', icon: Network, roles: [ROLES.ADMIN, ROLES.OPERATOR] },
      { name: 'Attack Surface', path: '/attack-surface', icon: GitFork, roles: [ROLES.ADMIN, ROLES.OPERATOR] },
    ],
  },
  {
    name: 'Offensive Operations',
    icon: KeyRound,
    roles: [ROLES.ADMIN, ROLES.OPERATOR],
    subModules: [
      { name: 'Campaigns', path: '/campaigns', icon: Rocket, roles: [ROLES.ADMIN, ROLES.OPERATOR] },
      { name: 'Target Profiling', path: '/profiling', icon: Target, roles: [ROLES.ADMIN, ROLES.OPERATOR] },
      { name: 'Phishing', path: '/phishing', icon: Mail, roles: [ROLES.ADMIN, ROLES.OPERATOR] },
      { name: 'Merging Station', path: '/merging-station', icon: Combine, roles: [ROLES.ADMIN, ROLES.OPERATOR] },
      { name: 'Offensive Tools', path: '/offensive', icon: Wrench, roles: [ROLES.ADMIN, ROLES.OPERATOR] },
      { name: 'C2 Panel', path: '/c2', icon: Server, roles: [ROLES.ADMIN, ROLES.OPERATOR] },
    ],
  },
  {
    name: 'Live Hijacking',
    icon: Radio,
    roles: [ROLES.ADMIN, ROLES.OPERATOR],
    subModules: [
      { name: 'Live Session Tracker', path: '/live-tracker', icon: Workflow, roles: [ROLES.ADMIN, ROLES.OPERATOR] },
      { name: 'Remote Access Toolkit', path: '/rat', icon: Radio, roles: [ROLES.ADMIN, ROLES.OPERATOR] },
      { name: 'Device Hijacking', path: '/device-hijacking', icon: Camera, roles: [ROLES.ADMIN, ROLES.OPERATOR] },
    ],
  },
   {
    name: 'Defensive & Analysis Suite',
    icon: ShieldCheck,
    roles: [ROLES.ADMIN, ROLES.ANALYST],
    subModules: [
      { name: 'Vulnerability Analysis', path: '/vapt', icon: Syringe, roles: [ROLES.ADMIN, ROLES.ANALYST], },
      { name: 'Phishing Defense', path: '/phishing-defense', icon: Radar, roles: [ROLES.ADMIN, ROLES.ANALYST] },
      { name: 'Malware Analysis', path: '/analysis', icon: FileScan, roles: [ROLES.ADMIN, ROLES.ANALYST], },
      { name: 'Log Analysis', path: '/log-analysis', icon: GanttChartSquare, roles: [ROLES.ADMIN, ROLES.ANALYST], },
      { name: 'Steganography', path: '/steganography', icon: EyeOff, roles: [ROLES.ADMIN, ROLES.OPERATOR, ROLES.ANALYST] },
      { name: 'Bug Bounty', path: '/bug-bounty', icon: Bug, roles: [ROLES.ADMIN, ROLES.OPERATOR] },
      { name: 'IoT Security', path: '/iot', icon: Cpu, roles: [ROLES.ADMIN, ROLES.ANALYST], },
    ],
  },
  {
    name: 'Assets & Reporting',
    icon: Presentation,
    roles: ALL_ROLES,
    subModules: [
      { name: 'File Manager', path: '/files', icon: Files, roles: ALL_ROLES },
      { name: 'Documents', path: '/documents', icon: FileText, roles: ALL_ROLES },
      { name: 'Templates', path: '/templates', icon: MessageSquarePlus, roles: [ROLES.ADMIN, ROLES.OPERATOR] },
      { name: 'Reporting', path: '/reporting', icon: Presentation, roles: ALL_ROLES },
    ],
  },
  {
    name: 'Administration',
    icon: Users,
    roles: ALL_ROLES,
    subModules: [
      { name: 'User Management', path: '/user-management', icon: UserCog, roles: [ROLES.ADMIN] },
      { name: 'Compliance', path: '/compliance', icon: ShieldCheck, roles: [ROLES.ADMIN, ROLES.AUDITOR] },
      { name: 'Settings', path: '/settings', icon: Settings, roles: ALL_ROLES },
    ],
  },
  {
    name: 'Development',
    icon: TestTube,
    roles: ALL_ROLES, 
    subModules: [
      { name: 'Link Tester', path: '/test', icon: TestTube, roles: ALL_ROLES },
    ],
  },
];


export function getAllModuleNamesForRole(role: Role): string[] {
  const modules: string[] = [];
  APP_MODULES.forEach((module) => {
    if (module.subModules) {
      module.subModules.forEach((subModule) => {
        if (subModule.roles.includes(role)) {
          modules.push(subModule.name);
        }
      });
    } else if (module.path && module.roles.includes(role)) {
      modules.push(module.name);
    }
  });
  return modules;
}
