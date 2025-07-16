
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, MoreVertical, Edit, Trash2, MessageSquarePlus, Mail, MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Form, FormField, FormControl, FormMessage, FormLabel } from '@/components/ui/form';

type Template = {
  id: string;
  name: string;
  type: 'Email' | 'SMS';
  subject?: string;
  body: string;
};

const initialTemplates: Template[] = [
  {
    id: 'TPL-001',
    name: 'Urgent Password Reset',
    type: 'Email',
    subject: 'Action Required: Your {{company}} password has expired',
    body: 'Dear {{name}},\n\nOur records indicate that your password for your {{company}} account has expired. For security reasons, you must reset it immediately.\n\nPlease click the link below to update your password:\n[Link]\n\nIf you did not request this, please contact IT support.\n\nThank you,\n{{company}} IT Department'
  },
  {
    id: 'TPL-002',
    name: 'Unusual Login Attempt SMS',
    type: 'SMS',
    body: '{{company}} Alert: We detected an unusual login attempt on your account from a new device. If this was not you, please secure your account immediately at [Link].'
  },
  {
    id: 'TPL-003',
    name: 'Invoice Overdue',
    type: 'Email',
    subject: 'Action Needed: Invoice {{invoice_number}} is Overdue',
    body: 'Hi {{name}},\n\nThis is a reminder that invoice #{{invoice_number}} for ${{amount}} is now overdue. Please make a payment as soon as possible to avoid service interruption.\n\nYou can view and pay the invoice here:\n[Link]\n\nRegards,\n{{company}} Billing Team'
  },
  {
    id: 'TPL-004',
    name: 'HR Policy Update',
    type: 'Email',
    subject: 'Important: New {{company}} Work From Home Policy',
    body: 'Hello Team,\n\nPlease be advised that there has been an important update to our Work From Home policy, effective immediately. All employees are required to read and acknowledge the new policy document.\n\nYou can access the updated policy here:\n[Link]\n\nThank you,\n{{company}} Human Resources'
  },
  {
    id: 'TPL-005',
    name: 'Missed Package Delivery',
    type: 'Email',
    subject: 'We missed you! Your package delivery from {{courier}}',
    body: 'Hello {{name}},\n\nOur driver attempted to deliver your package today but was unable to. To avoid having the package returned to the sender, please schedule a new delivery date.\n\nTracking Number: {{tracking_number}}\n\nReschedule your delivery here: [Link]\n\nSincerely,\nThe {{courier}} Team'
  },
  {
    id: 'TPL-006',
    name: 'Shared Document Notification',
    type: 'Email',
    subject: '{{sender_name}} has shared a document with you',
    body: 'Hi {{name}},\n\n{{sender_name}} has shared a file with you titled "{{document_title}}".\n\nPlease review the document by clicking the link below.\n\n[Open Document]\n\nThis link will expire in 24 hours.'
  },
  {
    id: 'TPL-007',
    name: 'IT Security Scan',
    type: 'Email',
    subject: 'Mandatory Security Scan for Your Device',
    body: 'Dear Employee,\n\nAs part of our regular security updates, we require all employees to run a mandatory security scan on their primary work device. Please install the updated security agent from the link below to begin the scan.\n\n[Install Security Agent]\n\nCompliance is required by end of day.\n\nThanks,\n{{company}} IT Security'
  },
  {
    id: 'TPL-008',
    name: 'Cloud Storage Full',
    type: 'Email',
    subject: 'Warning: Your {{cloud_service}} account storage is almost full',
    body: 'Your {{cloud_service}} account has reached 95% of its storage capacity. To avoid losing access to your files, please upgrade your storage plan or free up space.\n\nClick here to manage your storage:\n[Manage Storage]\n\nThank you for using {{cloud_service}}.'
  },
  {
    id: 'TPL-009',
    name: 'CEO Urgent Request (BEC)',
    type: 'Email',
    subject: 'Urgent task - Need your help',
    body: '{{name}},\n\nI need you to handle an urgent wire transfer for me. I\'m in a meeting and can\'t do it myself. Please let me know if you are available to help and I will send the details.\n\nSent from my iPhone\n\n{{ceo_name}}\nCEO, {{company}}'
  },
  {
    id: 'TPL-010',
    name: 'Video Conference Invitation',
    type: 'Email',
    subject: 'Invitation: Project Titan Kick-off Meeting',
    body: 'You are invited to a project kick-off meeting for Project Titan.\n\nPlease join the meeting using the link below:\n[Join Zoom/Teams Meeting]\n\nWe look forward to seeing you there.\n\nBest,\n{{sender_name}}'
  },
  {
    id: 'TPL-011',
    name: 'LinkedIn Connection Request',
    type: 'Email',
    subject: 'You have a new connection request on LinkedIn',
    body: 'Hi {{name}},\n\nYou have a new invitation to connect on LinkedIn from {{sender_name}}, a {{sender_role}} at {{sender_company}}.\n\n[View Invitation]\n\n'
  },
  {
    id: 'TPL-012',
    name: 'E-Fax Notification',
    type: 'Email',
    subject: 'You have received a new E-Fax of {{pages}} pages',
    body: 'You have received a new secure fax.\n\nTo view the document, please log in to our secure portal using the link below.\n\n[View Fax]\n\nReference ID: {{fax_id}}'
  },
  {
    id: 'TPL-013',
    name: 'Microsoft 365 Password Sync Error',
    type: 'Email',
    subject: 'Action Required: Microsoft 365 Password Sync Failed',
    body: 'We were unable to sync your password for your Microsoft 365 account. This might be due to a recent password change.\n\nPlease re-enter your credentials to re-sync your account and avoid being locked out.\n\n[Re-sync Account]\n\nMicrosoft 365 Team'
  },
  {
    id: 'TPL-014',
    name: 'Payroll Report',
    type: 'Email',
    subject: 'Confidential: Quarterly Payroll Report',
    body: 'Hi {{name}},\n\nPlease find the attached quarterly payroll report for your review. This document contains sensitive information and should be handled with care.\n\n[Download Report.zip]\n\nThanks,\nFinance Department'
  },
  {
    id: 'TPL-015',
    name: 'Customer Satisfaction Survey',
    type: 'Email',
    subject: 'Share your feedback and get a $25 gift card',
    body: 'Hello {{name}},\n\nThank you for being a loyal customer. We value your opinion! Please take 2 minutes to complete our satisfaction survey. As a thank you, the first 100 respondents will receive a $25 gift card.\n\n[Start Survey]\n\nBest regards,\n{{company}}'
  },
  {
    id: 'TPL-016',
    name: 'IT Helpdesk Ticket Closed',
    type: 'Email',
    subject: 'RE: Your Helpdesk Ticket #{{ticket_id}} has been closed',
    body: 'Hello,\n\nYour support ticket #{{ticket_id}} regarding "{{ticket_subject}}" has been marked as resolved and closed. If you feel this issue is not resolved, please re-open the ticket by clicking the link below.\n\n[View Ticket Details]\n\n{{company}} IT Support'
  },
  {
    id: 'TPL-017',
    name: 'Website Voicemail Notification',
    type: 'Email',
    subject: 'You have a new voicemail from your website',
    body: 'You have a new voicemail message.\n\nCaller ID: {{caller_id}}\nDuration: {{duration}}\n\nClick the attachment to listen to the message.\n\n[voicemail.wav]'
  },
  {
    id: 'TPL-018',
    name: 'Social Media Mention',
    type: 'Email',
    subject: 'Your brand was mentioned on {{platform}}',
    body: 'Hi team,\n\nYour brand, {{company}}, was mentioned in a new post on {{platform}}. View the post to see what people are saying.\n\n[View Mention]\n\nThis is an automated notification.'
  },
  {
    id: 'TPL-019',
    name: 'Secure Document Delivery',
    type: 'Email',
    subject: 'You have received a secure document from {{sender_name}}',
    body: '{{sender_name}} has sent you a secure document via {{secure_service}}.\n\nTo access the document, you will need to verify your identity. Please click the link below to proceed to the secure portal.\n\n[Access Document]\n\nThis link is valid for one-time use only.'
  },
  {
    id: 'TPL-020',
    name: 'Benefits Enrollment Reminder',
    type: 'Email',
    subject: 'REMINDER: Open Enrollment for {{company}} Benefits Ends Soon',
    body: 'Dear {{name}},\n\nThis is a reminder that the open enrollment period for your {{company}} benefits ends in 3 days. If you do not make any changes, your current elections will roll over.\n\nTo review or change your benefits, please visit the employee portal:\n[Employee Portal]\n\nHR Department'
  },
];

const templateSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  type: z.enum(['Email', 'SMS']),
  subject: z.string().optional(),
  body: z.string().min(10, 'Body must be at least 10 characters.'),
}).refine(data => data.type === 'Email' ? (data.subject && data.subject.length > 0) : true, {
  message: 'Subject is required for email templates.',
  path: ['subject'],
});

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});

  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
  });

  useEffect(() => {
    try {
      const storedTemplates = localStorage.getItem('netra-templates');
      if (storedTemplates) {
        setTemplates(JSON.parse(storedTemplates));
      } else {
        setTemplates(initialTemplates);
        localStorage.setItem('netra-templates', JSON.stringify(initialTemplates));
      }
    } catch (error) {
      console.error('Failed to load templates from localStorage', error);
      setTemplates(initialTemplates);
    }
  }, []);

  const updateTemplates = (newTemplates: Template[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('netra-templates', JSON.stringify(newTemplates));
  }

  const handleCreate = () => {
    setSelectedTemplate(null);
    form.reset({
      name: '',
      type: 'Email',
      subject: '',
      body: '',
    });
    setIsFormOpen(true);
  }
  
  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    form.reset(template);
    setIsFormOpen(true);
  }
  
  const handleDelete = (template: Template) => {
    setSelectedTemplate(template);
    setIsDeleteAlertOpen(true);
  }
  
  const handlePreview = (template: Template) => {
      setPreviewTemplate(template);
      setPreviewData({});
  }

  const confirmDelete = () => {
    if (selectedTemplate) {
      const newTemplates = templates.filter(t => t.id !== selectedTemplate.id);
      updateTemplates(newTemplates);
      toast({ title: 'Template Deleted', description: `Template "${selectedTemplate.name}" has been removed.` });
      setIsDeleteAlertOpen(false);
      setSelectedTemplate(null);
    }
  }

  const onSubmit = (values: z.infer<typeof templateSchema>) => {
    if(selectedTemplate) {
      const updatedTemplates = templates.map(t => 
        t.id === selectedTemplate.id ? { ...t, ...values } : t
      );
      updateTemplates(updatedTemplates);
      toast({ title: 'Template Updated', description: `Template "${values.name}" has been updated.` });
    } else {
      const newTemplate: Template = {
        id: `TPL-${crypto.randomUUID()}`,
        ...values,
      }
      updateTemplates([...templates, newTemplate]);
      toast({ title: 'Template Created', description: `New template "${values.name}" has been added.` });
    }
    setIsFormOpen(false);
    setSelectedTemplate(null);
  }
  
  const getVariables = (template: Template | null): string[] => {
      if (!template) return [];
      const combinedText = `${template.subject || ''} ${template.body}`;
      const matches = combinedText.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
      const uniqueMatches = [...new Set(matches)];
      return uniqueMatches.map(v => v.replace(/[{}]/g, ''));
  }

  const variablesToPreview = useMemo(() => getVariables(previewTemplate), [previewTemplate]);
  
  const renderPreview = (text?: string): string => {
      if (!text) return '';
      let renderedText = text;
      for (const key in previewData) {
          renderedText = renderedText.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), previewData[key] || `{{${key}}}`);
      }
      return renderedText;
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-3xl font-semibold">Message Templates</h1>
            <p className="text-muted-foreground">Create and manage reusable templates for social engineering.</p>
          </div>
          <Button onClick={handleCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {templates.map((template) => (
                  <Card key={template.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                           <div>
                                <CardTitle className="flex items-center gap-2">
                                {template.type === 'Email' ? <Mail className="h-5 w-5"/> : <MessageSquare className="h-5 w-5"/>}
                                {template.name}
                                </CardTitle>
                                <CardDescription>{template.type} Template</CardDescription>
                           </div>
                            <Button variant="outline" size="sm" onClick={() => handlePreview(template)}>Preview</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-2">
                        {template.subject && <p className="text-sm"><strong>Subject:</strong> {template.subject}</p>}
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4"><strong>Body:</strong> {template.body}</p>
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                       <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}><Edit className="mr-2 h-4 w-4"/>Edit</Button>
                       <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(template)}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>
                    </CardFooter>
                  </Card>
                ))}
                </div>
                {templates.length === 0 && (
                    <Card className="flex flex-col items-center justify-center py-20">
                        <CardHeader><CardTitle>No Templates Yet</CardTitle><CardDescription>Click "New Template" to get started.</CardDescription></CardHeader>
                    </Card>
                )}
            </div>
            
            <div className="xl:col-span-1">
                <Card className="sticky top-20">
                    <CardHeader>
                        <CardTitle>Template Preview</CardTitle>
                        <CardDescription>Fill in variables to see a live preview.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!previewTemplate ? (
                             <div className="text-center text-muted-foreground py-10">Select a template to preview it here.</div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-semibold">Variables</h4>
                                    {variablesToPreview.length > 0 ? variablesToPreview.map(variable => (
                                        <div key={variable} className="grid grid-cols-3 items-center gap-2">
                                            <Label htmlFor={`preview-${variable}`} className="text-right">{variable}</Label>
                                            <Input 
                                                id={`preview-${variable}`} 
                                                value={previewData[variable] || ''} 
                                                onChange={e => setPreviewData({...previewData, [variable]: e.target.value})}
                                                className="col-span-2"
                                            />
                                        </div>
                                    )) : <p className="text-sm text-muted-foreground">No variables found in this template.</p>}
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="font-semibold mb-2">Rendered Output</h4>
                                    <div className="border p-4 rounded-md bg-primary/10 text-sm">
                                        {previewTemplate.type === 'Email' && (
                                            <p className="font-bold mb-2">{renderPreview(previewTemplate.subject)}</p>
                                        )}
                                        <p className="whitespace-pre-wrap">{renderPreview(previewTemplate.body)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
            <DialogDescription>{selectedTemplate ? `Update the details for "${selectedTemplate.name}".` : 'Create a reusable template for emails or SMS.'}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-4 py-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <FormControl>
                                    <Input id="name" {...field} className="col-span-3"/>
                                </FormControl>
                                <div className="col-start-2 col-span-3">
                                    <FormMessage />
                                </div>
                            </div>
                        )}
                    />
                   <FormField
                        control={form.control}
                        name="type"
                        render={({field}) => (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <FormLabel className="text-right">Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} >
                                    <FormControl><SelectTrigger className="col-span-3"><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Email">Email</SelectItem>
                                        <SelectItem value="SMS">SMS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    />
                  {form.watch('type') === 'Email' && (
                    <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <FormLabel htmlFor="subject" className="text-right">Subject</FormLabel>
                                <FormControl>
                                    <Input id="subject" {...field} value={field.value ?? ''} className="col-span-3"/>
                                </FormControl>
                                 <div className="col-start-2 col-span-3">
                                    <FormMessage />
                                </div>
                            </div>
                        )}
                    />
                  )}
                  <FormField
                        control={form.control}
                        name="body"
                        render={({ field }) => (
                            <div className="grid grid-cols-4 items-start gap-4">
                                <FormLabel htmlFor="body" className="text-right pt-2">Body</FormLabel>
                                <FormControl>
                                    <Textarea id="body" {...field} className="col-span-3 min-h-[150px]"/>
                                </FormControl>
                                 <div className="col-start-2 col-span-3">
                                    <FormMessage />
                                </div>
                            </div>
                        )}
                    />
                  <CardDescription className="col-span-4 text-center">{'Use `{{variable_name}}` for personalization (e.g., `{{name}}`, `{{company}}`).'}</CardDescription>
                </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit">Save Template</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the template "{selectedTemplate?.name}".</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    