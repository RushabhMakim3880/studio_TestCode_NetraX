
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Rocket, MailOpen, MousePointerClick, ShieldX, CircleUserRound, Mail, Send, StopCircle, Trash2, ChevronRight, Check, ListChecks } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { logActivity } from '@/services/activity-log-service';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';

type Profile = { id: string; fullName: string; email: string };
type Template = { id:string; name: string, subject?: string, body: string, type: 'Email' | 'SMS' };

const campaignSchema = z.object({
  name: z.string().min(3, 'Campaign name is required.'),
  objective: z.string().optional(),
  targetProfileIds: z.array(z.string()).min(1, 'Please select at least one target.'),
  templateId: z.string().min(1, 'Please select a template.'),
});

type Campaign = z.infer<typeof campaignSchema> & {
    id: string;
    status: 'Active' | 'Completed';
    launchedAt: Date;
};

export default function CampaignsPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();
    
    const form = useForm<z.infer<typeof campaignSchema>>({
        resolver: zodResolver(campaignSchema),
        defaultValues: {
            name: '',
            objective: '',
            targetProfileIds: [],
            templateId: ''
        }
    });
    
    useEffect(() => {
        try {
            const storedProfiles = localStorage.getItem('netra-profiles');
            setProfiles(storedProfiles ? JSON.parse(storedProfiles) : []);
            const storedTemplates = localStorage.getItem('netra-templates');
            const emailTemplates = (storedTemplates ? JSON.parse(storedTemplates) : []).filter((t: Template) => t.type === 'Email');
            setTemplates(emailTemplates);
        } catch (error) {
            console.error('Failed to load data from localStorage', error);
        }
    }, []);

    const onSubmit = (values: z.infer<typeof campaignSchema>) => {
        const campaign: Campaign = {
            ...values,
            id: `CAMP-${crypto.randomUUID()}`,
            status: 'Active',
            launchedAt: new Date(),
        };
        setCurrentCampaign(campaign);

        logActivity({
            user: user?.displayName || 'Operator',
            action: 'Launched Phishing Campaign',
            details: `Campaign: "${campaign.name}", Targets: ${campaign.targetProfileIds.length}`,
        });

        toast({
            title: "Campaign Launched (Simulation)",
            description: `The campaign "${campaign.name}" is now active. In a real scenario, emails would be sent now.`,
        });
        
        // Reset for next campaign
        form.reset();
    };
    
    const selectedTemplate = templates.find(t => t.id === form.watch('templateId'));
    const selectedProfiles = profiles.filter(p => form.watch('targetProfileIds').includes(p.id));

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="font-headline text-3xl font-semibold">Phishing Campaigns</h1>
                <p className="text-muted-foreground">Plan, configure, and launch sophisticated phishing campaigns.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 items-start">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>New Campaign</CardTitle>
                        <CardDescription>Follow the steps to launch a new campaign.</CardDescription>
                    </CardHeader>
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="space-y-8">
                             {/* Step 1: Setup */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">1</div>
                                    <h3 className="text-lg font-semibold">Setup Campaign</h3>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4 pl-11">
                                     <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Campaign Name</FormLabel><FormControl><Input placeholder="e.g., Q3 Financial Audit" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                     <FormField control={form.control} name="objective" render={({ field }) => ( <FormItem><FormLabel>Objective (Optional)</FormLabel><FormControl><Input placeholder="e.g., Test finance team resilience" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                </div>
                            </div>
                            
                            <Separator />

                            {/* Step 2: Targets */}
                            <div className="space-y-4">
                               <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">2</div>
                                    <h3 className="text-lg font-semibold">Select Targets</h3>
                                </div>
                                 <div className="pl-11">
                                    <ScrollArea className="h-48 rounded-md border p-4">
                                    {profiles.length > 0 ? profiles.map(profile => (
                                        <FormField key={profile.id} control={form.control} name="targetProfileIds" render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-2">
                                            <FormControl><Checkbox checked={field.value?.includes(profile.id)} onCheckedChange={(checked) => {return checked ? field.onChange([...(field.value || []), profile.id]) : field.onChange(field.value?.filter((value) => value !== profile.id))}} /></FormControl>
                                            <div className="space-y-1 leading-none"><label className="font-medium">{profile.fullName}</label><p className="text-xs text-muted-foreground">{profile.email}</p></div>
                                            </FormItem>
                                        )} />
                                    )) : <p className="text-sm text-muted-foreground text-center py-4">No target profiles found. Please add profiles in the 'Target Profiling' module.</p>}
                                    </ScrollArea>
                                    <FormField control={form.control} name="targetProfileIds" render={() => <FormMessage className="mt-2" />} />
                                </div>
                            </div>
                            
                            <Separator />
                            
                            {/* Step 3: Template */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">3</div>
                                    <h3 className="text-lg font-semibold">Select Template</h3>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4 pl-11">
                                     <FormField control={form.control} name="templateId" render={({ field }) => ( <FormItem><FormLabel>Email Template</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Choose a template..." /></SelectTrigger></FormControl><SelectContent><ScrollArea className="h-60">{templates.map(template => (<SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>))}</ScrollArea></SelectContent></Select><FormMessage /></FormItem> )}/>
                                     <div className="space-y-2">
                                         <Label>Template Preview</Label>
                                         <div className="h-48 w-full rounded-md border bg-primary/10 p-3 text-xs overflow-auto">
                                             {selectedTemplate ? (
                                                 <div className="space-y-2">
                                                     <p className="font-bold">{selectedTemplate.subject}</p>
                                                     <p className="whitespace-pre-wrap">{selectedTemplate.body}</p>
                                                 </div>
                                             ) : <p className="text-muted-foreground">Select a template to see a preview.</p>}
                                         </div>
                                     </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full">
                                <Rocket className="mr-2 h-4 w-4"/> Launch Campaign
                            </Button>
                        </CardFooter>
                    </form>
                    </Form>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base"><ListChecks /> How to Launch a Campaign</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-4">
                            <p>This module integrates with other parts of NETRA-X to create and launch campaigns.</p>
                            <ol className="list-decimal list-inside space-y-2">
                                <li>
                                    <strong>Create Target Profiles:</strong> Go to the <span className="font-semibold text-accent">Target Profiling</span> module to create detailed profiles of the individuals you want to target. These profiles will be available here.
                                </li>
                                <li>
                                    <strong>Create Message Templates:</strong> In the <span className="font-semibold text-accent">Templates</span> module, create or customize reusable email templates for your campaign.
                                </li>
                                 <li>
                                    <strong>Configure Sending Method:</strong>
                                    <ul className="list-disc list-inside pl-4 mt-1">
                                        <li>For emails, ensure your <span className="font-semibold text-accent">SMTP Settings</span> are correctly configured on the Settings page.</li>
                                        <li>For other methods like Telegram, ensure the relevant C2 agent is set up.</li>
                                    </ul>
                                </li>
                                <li>
                                    <strong>Launch:</strong> Return here, fill out the campaign details, select your targets and template, and click "Launch Campaign".
                                </li>
                            </ol>
                        </CardContent>
                    </Card>
                    
                    {currentCampaign && (
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Active Campaign Status</CardTitle>
                                <CardDescription>"{currentCampaign.name}"</CardDescription>
                            </CardHeader>
                             <CardContent>
                                <ul className="space-y-3">
                                    <li className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Status</span>
                                        <Badge variant={currentCampaign.status === 'Active' ? 'default' : 'secondary'}>{currentCampaign.status}</Badge>
                                    </li>
                                     <li className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Targets</span>
                                        <span className="font-mono">{selectedProfiles.length}</span>
                                    </li>
                                     <li className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Template</span>
                                        <span className="font-mono">{selectedTemplate?.name}</span>
                                    </li>
                                     <li className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Launched</span>
                                        <span className="font-mono text-muted-foreground">{currentCampaign.launchedAt.toLocaleString()}</span>
                                    </li>
                                </ul>
                             </CardContent>
                        </Card>
                    )}
                </div>

            </div>
        </div>
    );
}
