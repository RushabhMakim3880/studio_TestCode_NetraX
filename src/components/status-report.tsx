
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle2, ListTodo, Bot, Cookie, KeySquare, ShieldHalf, Binary, MousePointer2, GitFork, Syringe, Bug, Wand, FileText } from 'lucide-react';

const implementedFeatures = [
    { icon: Cookie, title: 'Session Hijacking Tool', description: 'Generates replay commands from stolen session cookies.' },
    { icon: KeySquare, title: 'JWT Analyzer & Manipulator', description: 'Decode, tamper, and test the security of JSON Web Tokens.' },
    { icon: ShieldHalf, title: 'CSP & Security Headers Analyzer', description: 'Identifies misconfigurations in security headers and suggests bypasses.' },
    { icon: Binary, title: 'Advanced Network Scanner', description: 'Performs live port scans with service and OS detection via an Nmap wrapper.' },
    { icon: MousePointer2, title: 'Clickjacking Page Builder', description: 'Interactively build clickjacking proof-of-concept pages.' },
    { icon: FileText, title: 'Credential Form Generator', description: 'Builds and generates HTML for custom credential capture forms.' },
    { icon: Wand, title: 'DOM Cloner & XSS Injector', description: 'Clones a live webpage and injects a custom XSS payload.' },
    { icon: GitFork, title: 'Attack Surface Visualizer', description: 'Crawls and renders a target’s web structure as an interactive graph.' },
    { icon: Syringe, title: 'Passive Vulnerability Scanner', description: 'Uses AI to find potential injection vulnerabilities from a URL.' },
    { icon: Bug, title: 'Bug Bounty Recon Helper', description: 'A toolkit including an IDOR scanner and report formatter.' },
    { icon: Bot, title: 'AI Malware Concept Generator', description: 'Designs conceptual malware payloads based on specified features.' },
];

const plannedFeatures = [
    { title: 'Advanced Reporting & Analytics', description: 'Create comprehensive, customizable PDF reports from project data.' },
    { title: 'MITRE ATT&CK Framework Integration', description: 'Map project tasks and findings directly to ATT&CK techniques.' },
    { title: 'Team Collaboration Features', description: 'Enable shared notes, comments on tasks, and real-time notifications.' },
    { title: 'Automated Workflow Execution', description: 'Chain multiple tools together into automated attack or analysis workflows.' },
    { title: 'Expanded C2 Channel Support', description: 'Add support for additional C2 channels like DNS over HTTPS.' },
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
                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                    {implementedFeatures.map((feature, index) => (
                        <div key={index} className="flex items-start gap-4">
                           <feature.icon className="h-5 w-5 mt-1 shrink-0 text-accent" />
                           <div>
                            <p className="font-semibold">{feature.title}</p>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                           </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <ListTodo className="h-6 w-6 text-amber-400" />
                        <CardTitle>Next Up: Planned Features</CardTitle>
                    </div>
                    <CardDescription>
                        This is the development roadmap for the next implementation phase.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {plannedFeatures.map((feature, index) => (
                        <div key={index}>
                            <p className="font-semibold">{feature.title}</p>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
