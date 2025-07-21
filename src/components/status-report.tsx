
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle2, ListTodo, Bot, Cookie, KeySquare, ShieldHalf, Binary, MousePointer2, GitFork, Syringe, Bug, Wand, FileText, Presentation, GitBranch, Server, Workflow, Users } from 'lucide-react';
import Link from 'next/link';

const implementedFeatures = [
    { icon: Wand, title: 'DOM Cloner & XSS Injector', description: 'Clones a live webpage and injects a custom XSS payload.', path: '/web-vulns' },
    { icon: FileText, title: 'Credential Form Generator', description: 'Builds and generates HTML for custom credential capture forms.', path: '/form-generator' },
    { icon: GitFork, title: 'Attack Surface Visualizer', description: 'Crawls and renders a target’s web structure as an interactive graph.', path: '/attack-surface' },
    { icon: Syringe, title: 'Passive Vulnerability Scanner', description: 'Uses AI to find potential injection vulnerabilities from a URL.', path: '/vapt' },
    { icon: Bug, title: 'Bug Bounty Recon Helper', description: 'A toolkit including an IDOR scanner and report formatter.', path: '/bug-bounty' },
    { icon: Bot, title: 'AI Malware Concept Generator', description: 'Designs conceptual malware payloads based on specified features.', path: '/offensive' },
    { icon: Cookie, title: 'Session Hijacking Tool', description: 'Generates replay commands from stolen session cookies.', path: '/offensive' },
    { icon: KeySquare, title: 'JWT Analyzer & Manipulator', description: 'Decode, tamper, and test the security of JSON Web Tokens.', path: '/offensive' },
    { icon: ShieldHalf, title: 'CSP & Security Headers Analyzer', description: 'Identifies misconfigurations in security headers and suggests bypasses.', path: '/vapt' },
    { icon: Binary, title: 'Advanced Network Scanner', description: 'Performs live port scans with service and OS detection via an Nmap wrapper.', path: '/network' },
    { icon: MousePointer2, title: 'Clickjacking Page Builder', description: 'Interactively build clickjacking proof-of-concept pages.', path: '/offensive' },
    { icon: Presentation, title: 'Advanced Reporting & Analytics', description: 'Create comprehensive, customizable PDF reports from project data.', path: '/reporting' },
    { icon: GitBranch, title: 'MITRE ATT&CK Framework Integration', description: 'Map project tasks and findings directly to ATT&CK techniques.', path: '/project-management' },
    { icon: Server, title: 'Expanded C2 Channel Support', description: 'Generate custom malware concepts with configurable C2 channels (e.g., DoH, Telegram).', path: '/offensive' },
    { icon: Workflow, title: 'Automated Workflow Execution', description: 'Chain multiple tools together into automated attack or analysis workflows via an AI Exploit Chain Assistant.', path: '/vapt' },
    { icon: Users, title: 'Team Collaboration Features', description: 'Enable shared notes, comments on tasks, and real-time notifications.', path: '/project-management' },
];

const plannedFeatures: {title: string, description: string}[] = [
    { title: 'Session Hijacking via Cookie Replay Tool', description: 'Generate replay commands (cURL, fetch) from stolen session cookies.' },
    { title: 'JWT Analyzer & Manipulator', description: 'Decode, tamper, and brute-force HS256 JWTs to test for vulnerabilities.' },
    { title: 'Clickjacking Page Builder', description: 'Visually build clickjacking PoC pages with a transparent iframe overlay.' },
    { title: 'Passive Vulnerability Scanner', description: 'Analyze headers, JS libraries, and open APIs of a target URL to find weaknesses.' },
    { title: 'AI-Generated XSS Payloads', description: 'Create context-aware XSS payloads designed to bypass common WAFs and filters.' },
];

export function StatusReport() {
    return (
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-6 w-6 text-green-400" />
                        <CardTitle>Implemented Features</CardTitle>
                    </div>
                    <CardDescription>
                        The following mandatory features have been successfully integrated into the platform.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 max-h-96 overflow-y-auto">
                    {implementedFeatures.map((feature, index) => (
                        <Link href={feature.path} key={index} className="block rounded-lg p-3 hover:bg-primary/10 transition-colors">
                            <div className="flex items-start gap-4">
                               <feature.icon className="h-5 w-5 mt-1 shrink-0 text-accent" />
                               <div>
                                <p className="font-semibold">{feature.title}</p>
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                               </div>
                            </div>
                        </Link>
                    ))}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <ListTodo className="h-6 w-6 text-amber-400" />
                        <CardTitle>Upcoming Implementation Plan</CardTitle>
                    </div>
                    <CardDescription>
                        The next set of features planned for development based on stakeholder requirements.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                     {plannedFeatures.length > 0 ? plannedFeatures.map((feature, index) => (
                        <div key={index}>
                            <p className="font-semibold">{feature.title}</p>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                    )) : (
                        <div className="text-center text-muted-foreground py-10">
                            <p>No further features are planned for this development cycle.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
