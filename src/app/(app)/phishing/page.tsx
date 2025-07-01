'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { generatePhishingEmail, type PhishingOutput } from '@/ai/flows/phishing-flow';
import { cloneLoginPage, type PageClonerInput, type PageClonerOutput } from '@/ai/flows/page-cloner-flow';
import { Loader2, AlertTriangle, Mail, Download, Link as LinkIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from '@/hooks/use-toast';

const emailSchema = z.object({
  company: z.string().min(2, { message: 'Company name is required.' }),
  role: z.string().min(2, { message: 'Target role is required.' }),
  scenario: z.string().min(10, { message: 'Scenario must be at least 10 characters.' }),
});

const pageClonerSchema = z.object({
  targetUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  pageDescription: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
});

export default function PhishingPage() {
  const { toast } = useToast();
  // Email Generator State
  const [emailResult, setEmailResult] = useState<PhishingOutput | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Page Cloner State
  const [clonerResult, setClonerResult] = useState<PageClonerOutput | null>(null);
  const [isClonerLoading, setIsClonerLoading] = useState(false);
  const [clonerError, setClonerError] = useState<string | null>(null);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      company: 'Global-Corp Inc.',
      role: 'Accountant',
      scenario: 'An urgent, overdue invoice requires immediate payment.',
    },
  });

  const clonerForm = useForm<z.infer<typeof pageClonerSchema>>({
    resolver: zodResolver(pageClonerSchema),
    defaultValues: {
      targetUrl: 'https://login.microsoftonline.com/',
      pageDescription: 'A standard Microsoft 365 login page.',
    },
  });

  async function onEmailSubmit(values: z.infer<typeof emailSchema>) {
    setIsEmailLoading(true);
    setEmailResult(null);
    setEmailError(null);
    try {
      const response = await generatePhishingEmail(values);
      setEmailResult(response);
    } catch (err) {
      setEmailError('Failed to generate phishing email. The content may have been blocked by safety filters.');
      console.error(err);
    } finally {
      setIsEmailLoading(false);
    }
  }

  async function onClonerSubmit(values: z.infer<typeof pageClonerSchema>) {
    setIsClonerLoading(true);
    setClonerResult(null);
    setClonerError(null);
    try {
      const response = await cloneLoginPage(values);
      setClonerResult(response);
    } catch (err) {
      setClonerError('Failed to clone page. The request may have been blocked by safety filters.');
      console.error(err);
    } finally {
      setIsClonerLoading(false);
    }
  }
  
  const handleDownloadHtml = () => {
    if (clonerResult?.htmlContent) {
        const blob = new Blob([clonerResult.htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cloned_login.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Download Started", description: "Your cloned HTML file is downloading." });
    }
  }


  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Phishing Campaign Simulator</h1>
        <p className="text-muted-foreground">Craft custom emails and clone login pages.</p>
      </div>
      <Tabs defaultValue="email-generator" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email-generator">Email Generator</TabsTrigger>
          <TabsTrigger value="page-cloner">Login Page Cloner</TabsTrigger>
        </TabsList>
        <TabsContent value="email-generator">
          <div className="grid lg:grid-cols-5 gap-6 mt-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Email Crafting</CardTitle>
                <CardDescription>Define the parameters for the simulated phishing email.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                    <FormField control={emailForm.control} name="company" render={({ field }) => ( <FormItem> <FormLabel>Target Company</FormLabel> <FormControl><Input placeholder="e.g., Acme Corp" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={emailForm.control} name="role" render={({ field }) => ( <FormItem> <FormLabel>Target Role</FormLabel> <FormControl><Input placeholder="e.g., Finance Manager" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={emailForm.control} name="scenario" render={({ field }) => ( <FormItem> <FormLabel>Scenario</FormLabel> <FormControl><Textarea placeholder="Describe the phishing pretext..." {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <Button type="submit" disabled={isEmailLoading} className="w-full">
                      {isEmailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Generate Email
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <div className="lg:col-span-3">
              {emailError && <Card className="border-destructive/50 mb-4"><CardHeader><div className="flex items-center gap-3"><AlertTriangle className="h-6 w-6 text-destructive" /><CardTitle className="text-destructive">Error</CardTitle></div></CardHeader><CardContent><p>{emailError}</p></CardContent></Card>}
              <Card className={`min-h-[400px] ${!emailResult && 'flex items-center justify-center'}`}>
                <CardHeader>
                  <div className="flex items-center gap-3"><Mail className="h-6 w-6" /><CardTitle>Email Preview</CardTitle></div>
                </CardHeader>
                <CardContent>
                  {!emailResult && !isEmailLoading && <p className="text-muted-foreground text-center">Generated email will be displayed here.</p>}
                  {isEmailLoading && <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
                  {emailResult && (<div className="border rounded-md p-4 bg-background"><div className="mb-4"><p className="text-sm font-bold">{emailResult.subject}</p></div><div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: emailResult.body }}/></div>)}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="page-cloner">
           <div className="grid lg:grid-cols-5 gap-6 mt-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Page Cloner</CardTitle>
                <CardDescription>Generate a static HTML clone of a login page.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...clonerForm}>
                  <form onSubmit={clonerForm.handleSubmit(onClonerSubmit)} className="space-y-4">
                    <FormField control={clonerForm.control} name="targetUrl" render={({ field }) => ( <FormItem> <FormLabel>Target URL</FormLabel> <FormControl><Input placeholder="https://example.com/login" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={clonerForm.control} name="pageDescription" render={({ field }) => ( <FormItem> <FormLabel>Page Description</FormLabel> <FormControl><Textarea placeholder="A corporate SSO portal with a blue color scheme..." {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <Button type="submit" disabled={isClonerLoading} className="w-full">
                      {isClonerLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Clone Page
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <div className="lg:col-span-3">
              {clonerError && <Card className="border-destructive/50 mb-4"><CardHeader><div className="flex items-center gap-3"><AlertTriangle className="h-6 w-6 text-destructive" /><CardTitle className="text-destructive">Error</CardTitle></div></CardHeader><CardContent><p>{clonerError}</p></CardContent></Card>}
              <Card className={`min-h-[400px] ${!clonerResult && 'flex items-center justify-center'}`}>
                <CardHeader className="w-full flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3"><LinkIcon className="h-6 w-6" /><CardTitle>Page Preview</CardTitle></div>
                  {clonerResult && (
                    <Button variant="outline" size="sm" onClick={handleDownloadHtml}>
                        <Download className="mr-2 h-4 w-4"/> Download HTML
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="w-full">
                  {!clonerResult && !isClonerLoading && <p className="text-muted-foreground text-center">Cloned page preview will appear here.</p>}
                  {isClonerLoading && <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
                  {clonerResult && (<div className="border rounded-md w-full h-[500px] bg-background"><iframe srcDoc={clonerResult.htmlContent} className="w-full h-full" title="Cloned Page Preview" /></div>)}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
