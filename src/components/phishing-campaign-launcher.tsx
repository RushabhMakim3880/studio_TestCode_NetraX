
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Rocket, MailOpen, MousePointerClick, ShieldX, CircleUserRound, Mail, Send, StopCircle, Trash2 } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from './ui/badge';

type Profile = { id: string; fullName: string; };
type Template = { id: string; name: string, subject?: string, body: string, type: 'Email' | 'SMS' };

const formSchema = z.object({
  targetProfileIds: z.array(z.string()).min(1, 'Please select at least one target.'),
  templateId: z.string().min(1, 'Please select a template.'),
});

type CampaignStatus = 'Sent' | 'Opened' | 'Clicked' | 'Compromised';
type CampaignLogEntry = {
    id: string;
    targetName: string;
    status: CampaignStatus;
    timestamp: Date;
};

const statusHierarchy: CampaignStatus[] = ['Sent', 'Opened', 'Clicked', 'Compromised'];

const getStatusIcon = (status: CampaignStatus) => {
    switch(status) {
        case 'Sent': return <Send className="h-4 w-4 text-sky-400" />;
        case 'Opened': return <MailOpen className="h-4 w-4 text-amber-400" />;
        case 'Clicked': return <MousePointerClick className="h-4 w-4 text-orange-400" />;
        case 'Compromised': return <ShieldX className="h-4 w-4 text-destructive" />;
    }
}

const getStatusVariant = (status: CampaignStatus): 'default' | 'secondary' | 'outline' | 'destructive' => {
     switch(status) {
        case 'Sent': return 'outline';
        case 'Opened': return 'secondary';
        case 'Clicked': return 'default';
        case 'Compromised': return 'destructive';
    }
};

export function PhishingCampaignLauncher() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [campaignLog, setCampaignLog] = useState<CampaignLogEntry[]>([]);
    const [runningCampaign, setRunningCampaign] = useState<{templateName: string} | null>(null);

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

    function onSubmit(values: z.infer<typeof formSchema>) {
        const selectedProfiles = profiles.filter(p => values.targetProfileIds.includes(p.id));
        const selectedTemplate = templates.find(t => t.id === values.templateId);

        if (!selectedTemplate) return;

        const initialLog: CampaignLogEntry[] = selectedProfiles.map(p => ({
            id: p.id,
            targetName: p.fullName,
            status: 'Sent',
            timestamp: new Date(),
        }));
        
        setCampaignLog(initialLog);
        setRunningCampaign({ templateName: selectedTemplate.name });
        form.reset();
    }
    
    const handleStopCampaign = () => {
        setCampaignLog([]);
        setRunningCampaign(null);
    }
    
    const updateStatus = (targetId: string, newStatus: CampaignStatus) => {
        setCampaignLog(prevLog => prevLog.map(entry => 
            entry.id === targetId ? { ...entry, status: newStatus, timestamp: new Date() } : entry
        ));
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Rocket className="h-6 w-6" />
                    <CardTitle>Phishing Campaign Launcher</CardTitle>
                </div>
                <CardDescription>Select targets and a template to run an interactive phishing simulation.</CardDescription>
            </CardHeader>
            <CardContent>
                {runningCampaign ? (
                    <div className="space-y-4">
                       <div className="flex justify-between items-center p-3 rounded-md bg-primary/20">
                          <div>
                            <h3 className="font-semibold">Campaign in Progress</h3>
                            <p className="text-sm text-muted-foreground">Template: "{runningCampaign.templateName}"</p>
                          </div>
                          <Button variant="destructive" onClick={handleStopCampaign}><StopCircle className="mr-2 h-4 w-4"/> End Simulation</Button>
                       </div>
                       <Card>
                         <Table>
                            <TableHeader><TableRow><TableHead>Target</TableHead><TableHead>Status</TableHead><TableHead>Last Update</TableHead><TableHead className="text-right">Simulate Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {campaignLog.map(entry => {
                                    const currentStatusIndex = statusHierarchy.indexOf(entry.status);
                                    return (
                                    <TableRow key={entry.id}>
                                        <TableCell>{entry.targetName}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(entry.status)}>{getStatusIcon(entry.status)} {entry.status}</Badge></TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{entry.timestamp.toLocaleTimeString()}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button size="sm" variant="outline" onClick={() => updateStatus(entry.id, 'Opened')} disabled={currentStatusIndex >= 1}>Open</Button>
                                            <Button size="sm" variant="outline" onClick={() => updateStatus(entry.id, 'Clicked')} disabled={currentStatusIndex >= 2}>Click</Button>
                                            <Button size="sm" variant="outline" onClick={() => updateStatus(entry.id, 'Compromised')} disabled={currentStatusIndex >= 3}>Compromise</Button>
                                        </TableCell>
                                    </TableRow>
                                )})}
                            </TableBody>
                         </Table>
                       </Card>
                    </div>
                ) : (
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label>1. Select Targets</Label>
                                <Card className="max-h-60"><ScrollArea className="h-60"><CardContent className="p-4 space-y-2">
                                {profiles.length > 0 ? profiles.map(profile => (
                                    <Controller key={profile.id} control={form.control} name="targetProfileIds" render={({ field }) => (
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id={profile.id} checked={field.value?.includes(profile.id)} onCheckedChange={(checked) => {return checked ? field.onChange([...(field.value || []), profile.id]) : field.onChange(field.value?.filter((value) => value !== profile.id))}}/>
                                        <label htmlFor={profile.id} className="text-sm font-medium leading-none flex items-center gap-2"><CircleUserRound className="h-4 w-4 text-muted-foreground"/> {profile.fullName}</label>
                                    </div> )}/>
                                )) : <p className="text-sm text-muted-foreground text-center py-4">No target profiles found.</p>}
                                </CardContent></ScrollArea></Card>
                                {form.formState.errors.targetProfileIds && <p className="text-sm text-destructive">{form.formState.errors.targetProfileIds.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>2. Select Email Template</Label>
                                <Controller control={form.control} name="templateId" render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger><SelectValue placeholder="Choose a template..." /></SelectTrigger>
                                        <SelectContent>
                                            {templates.map(template => (<SelectItem key={template.id} value={template.id}><div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/> {template.name}</div></SelectItem>))}
                                        </SelectContent>
                                    </Select> )}/>
                                {form.formState.errors.templateId && <p className="text-sm text-destructive">{form.formState.errors.templateId.message}</p>}
                            </div>
                        </div>
                        <Button type="submit" className="w-full"><Rocket className="mr-2 h-4 w-4"/>Launch Simulation</Button>
                    </form>
                )}
            </CardContent>
             {runningCampaign && (
                <CardFooter className="justify-end">
                    <Button variant="ghost" size="sm" onClick={handleStopCampaign}><Trash2 className="mr-2 h-4 w-4"/>Clear Campaign Log</Button>
                </CardFooter>
            )}
        </Card>
    )
}
