
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
import { PlusCircle, MoreVertical, Edit, Trash2, Mail, MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Form, FormField, FormControl, FormMessage, FormLabel, FormItem } from '@/components/ui/form';
import { initialTemplates, type Template } from '@/lib/templates';

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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input id="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="SMS">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {form.watch('type') === 'Email' && (
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input id="subject" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body</FormLabel>
                    <FormControl>
                      <Textarea id="body" {...field} className="min-h-[150px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <CardDescription className="text-center pt-2">
                {'Use `{{variable_name}}` for personalization (e.g., `{{name}}`, `{{company}}`).'}
              </CardDescription>

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
