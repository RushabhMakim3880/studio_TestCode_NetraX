
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Clipboard, Search } from 'lucide-react';
import { Label } from '@/components/ui/label';

const dorkSchema = z.object({
  keywords: z.string().optional(),
  inurl: z.string().optional(),
  intitle: z.string().optional(),
  site: z.string().optional(),
  filetype: z.string().optional(),
  intext: z.string().optional(),
});

type DorkFormValues = z.infer<typeof dorkSchema>;

export function GoogleDorkGenerator() {
  const { toast } = useToast();
  const [generatedDork, setGeneratedDork] = useState('');

  const form = useForm<DorkFormValues>({
    resolver: zodResolver(dorkSchema),
    defaultValues: {
      keywords: '',
      inurl: '',
      intitle: '',
      site: '',
      filetype: '',
      intext: '',
    },
  });

  const onSubmit = (values: DorkFormValues) => {
    const parts = [];
    if (values.keywords) parts.push(values.keywords);
    if (values.inurl) parts.push(`inurl:${values.inurl}`);
    if (values.intitle) parts.push(`intitle:"${values.intitle}"`);
    if (values.site) parts.push(`site:${values.site}`);
    if (values.filetype) parts.push(`filetype:${values.filetype}`);
    if (values.intext) parts.push(`intext:"${values.intext}"`);

    const dork = parts.join(' ');
    setGeneratedDork(dork);
  };

  const copyToClipboard = () => {
    if (generatedDork) {
      navigator.clipboard.writeText(generatedDork);
      toast({
        title: 'Copied!',
        description: 'Google dork copied to clipboard.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Dork Generator</CardTitle>
        <CardDescription>
          Craft advanced search queries to find specific information.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'admin login'" {...field} value={field.value ?? ''} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="site"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., example.gov.in" {...field} value={field.value ?? ''} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="filetype"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Filetype</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., pdf, xls" {...field} value={field.value ?? ''} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inurl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>In URL (inurl:)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., /login.php" {...field} value={field.value ?? ''} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="intitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>In Title (intitle:)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'index of'" {...field} value={field.value ?? ''} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="intext"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>In Text (intext:)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'password'" {...field} value={field.value ?? ''} />
                    </FormControl>
                  </FormItem>
                )}
              />
          </CardContent>
          <CardFooter className="flex-col items-start gap-4">
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              Generate Dork
            </Button>
            {generatedDork && (
              <div className="w-full space-y-2">
                <Label>Generated Dork</Label>
                <div className="flex w-full items-center gap-2">
                  <Input readOnly value={generatedDork} className="bg-primary/20" />
                  <Button type="button" size="icon" variant="outline" onClick={copyToClipboard}>
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
