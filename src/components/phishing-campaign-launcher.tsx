
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Rocket, Loader2, AlertTriangle, Send, MailOpen, MousePointerClick, ShieldX, CircleUserRound, Mail } from 'lucide-react';
import { simulatePhishingCampaign, type PhishingSimulationOutput } from '@/ai/flows/phishing-simulation-flow';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';

type Profile = { id: string; fullName: string; };
type Template = { id: string; name: string, subject?: string, body: string, type: 'Email' | 'SMS' };

const formSchema = z.object({
  targetProfileIds: z.array(z.string()).min(1, 'Please select at least one target.'),
  templateId: z.string().min(1, 'Please select a template.'),
});

type SimulationEvent = PhishingSimulationOutput['events'][0];

const getEventIcon = (type: SimulationEvent['type']) => {
    switch(type) {
        case 'SENT': return <Send className="h-4 w-4 text-sky-400" />;
        case 'OPENED': return <MailOpen className="h-4 w-4 text-amber-400" />;
        case 'CLICKED': return <MousePointerClick className="h-4 w-4 text-orange-400" />;
        case 'COMPROMISED': return <ShieldX className="h-4 w-4 text-destructive" />;
    }
}

export function PhishingCampaignLauncher() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [simulationLog, setSimulationLog] = useState<SimulationEvent[]>([]);
    const [displayedLog, setDisplayedLog] = useState<SimulationEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { targetProfileIds: [], templateId: '' }
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
    
    useEffect(() => {
        if (simulationLog.length > 0 && displayedLog.length < simulationLog.length) {
            const timer = setTimeout(() => {
                setDisplayedLog(prev => [...prev, simulationLog[prev.length]]);
            }, Math.random() * 1500 + 500); // simulate time delay between events
            return () => clearTimeout(timer);
        }
    }, [simulationLog, displayedLog]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setError(null);
        setSimulationLog([]);
        setDisplayedLog([]);

        const selectedProfiles = profiles.filter(p => values.targetProfileIds.includes(p.id));
        const selectedTemplate = templates.find(t => t.id === values.templateId);

        if (!selectedTemplate) {
            setError("Selected template not found.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await simulatePhishingCampaign({
                targetCount: selectedProfiles.length,
                scenario: selectedTemplate.name,
                targetProfiles: selectedProfiles.map(p => p.fullName),
            });
            setSimulationLog(response.events);
        } catch(err) {
            if (err instanceof Error && (err.message.includes('503') || err.message.toLowerCase().includes('overloaded'))) {
                setError("The simulation service is temporarily busy. Please try again later.");
            } else {
                setError("Failed to start simulation. The AI may have refused the request.");
            }
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Rocket className="h-6 w-6" />
                    <CardTitle>Phishing Campaign Launcher</CardTitle>
                </div>
                <CardDescription>Select targets and a template to run a simulated phishing campaign.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
                <div>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-3">
                            <Label>1. Select Targets</Label>
                             <Card className="max-h-48">
                                <ScrollArea className="h-48">
                                <CardContent className="p-4 space-y-2">
                                {profiles.length > 0 ? profiles.map(profile => (
                                     <Controller
                                        key={profile.id}
                                        control={form.control}
                                        name="targetProfileIds"
                                        render={({ field }) => (
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={profile.id}
                                                checked={field.value?.includes(profile.id)}
                                                onCheckedChange={(checked) => {
                                                    return checked
                                                    ? field.onChange([...(field.value || []), profile.id])
                                                    : field.onChange(field.value?.filter((value) => value !== profile.id))
                                                }}
                                            />
                                            <label htmlFor={profile.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                                <CircleUserRound className="h-4 w-4 text-muted-foreground"/> {profile.fullName}
                                            </label>
                                        </div>
                                        )}
                                    />
                                )) : <p className="text-sm text-muted-foreground text-center py-4">No target profiles found. Please create some in the Profiling module.</p>}
                                </CardContent>
                                </ScrollArea>
                            </Card>
                            {form.formState.errors.targetProfileIds && <p className="text-sm text-destructive">{form.formState.errors.targetProfileIds.message}</p>}
                        </div>

                         <div className="space-y-2">
                            <Label>2. Select Email Template</Label>
                            <Controller
                                control={form.control}
                                name="templateId"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger><SelectValue placeholder="Choose a template..." /></SelectTrigger>
                                        <SelectContent>
                                            {templates.map(template => (
                                                <SelectItem key={template.id} value={template.id}>
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-muted-foreground"/> {template.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                             {form.formState.errors.templateId && <p className="text-sm text-destructive">{form.formState.errors.templateId.message}</p>}
                        </div>
                        
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4"/>}
                            Launch Simulation
                        </Button>
                    </form>
                </div>
                <div className="space-y-4">
                     <Label>Simulation Log</Label>
                    <div className="h-96 bg-primary/20 p-4 rounded-md font-mono text-sm overflow-y-auto">
                       {isLoading && <div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>}
                       {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
                       {!isLoading && !error && displayedLog.length === 0 && <p className="text-muted-foreground text-center h-full flex items-center justify-center">Awaiting campaign launch...</p>}
                       {displayedLog.map((event, index) => (
                            <div key={index} className="flex items-start gap-3 mb-2 animate-in fade-in">
                                <span className="text-muted-foreground/80">{event.timestamp}</span>
                                <div className="flex items-center gap-2">
                                    {getEventIcon(event.type)}
                                    <span className="font-semibold">{event.target}:</span>
                                </div>
                                <span>{event.detail}</span>
                            </div>
                       ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
