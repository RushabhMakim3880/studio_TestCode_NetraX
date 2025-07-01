'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { analyzeImageForSteganography, type SteganographyAnalysisOutput } from '@/ai/flows/steganography-flow';
import { Loader2, AlertTriangle, Eye, CheckCircle, ShieldAlert, ShieldX, Unlock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const getVerdictIcon = (verdict?: string) => {
  switch (verdict) {
    case 'Hidden Data Detected':
      return <ShieldX className="h-8 w-8 text-destructive" />;
    case 'Suspicious Anomalies Found':
      return <ShieldAlert className="h-8 w-8 text-amber-400" />;
    case 'No Hidden Data Detected':
      return <CheckCircle className="h-8 w-8 text-green-400" />;
    default:
      return <Eye className="h-8 w-8 text-muted-foreground" />;
  }
};

const getVerdictColor = (verdict?: string): 'destructive' | 'secondary' | 'default' => {
  switch (verdict) {
    case 'Hidden Data Detected':
      return 'destructive';
    case 'Suspicious Anomalies Found':
      return 'secondary';
    case 'No Hidden Data Detected':
      return 'default';
    default:
      return 'default';
  }
}

export function SteganographyAnalyzer() {
  const [result, setResult] = useState<SteganographyAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: 'Please select an image file under 4MB.'
        });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setResult(null);
      setError(null);
    }
  }

  async function handleAnalyze() {
    if (!selectedFile || !previewUrl) {
      toast({
        variant: 'destructive',
        title: 'No File Selected',
        description: 'Please select an image to analyze.'
      });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await analyzeImageForSteganography({
        imageDataUri: previewUrl,
        filename: selectedFile.name,
      });
      setResult(response);
    } catch (err) {
      setError('Failed to analyze image. The simulation may have been blocked.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Steganography Analyzer</CardTitle>
        <CardDescription>Simulate the process of detecting hidden data within an image file.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <label htmlFor="image-upload" className="text-sm font-medium">Image File</label>
            <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
        </div>

        {previewUrl && (
            <div className="grid md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                    <div className="border p-2 rounded-md bg-card">
                       <Image src={previewUrl} alt="Preview" width={500} height={500} className="rounded-md w-full h-auto object-contain max-h-80" />
                    </div>
                    <Button onClick={handleAnalyze} disabled={isLoading || !selectedFile} className="w-full">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                        Analyze for Hidden Data
                    </Button>
                </div>
                
                <div className="min-h-80">
                    {isLoading && <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
                    {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
                    
                    {result && (
                        <div className="space-y-4">
                           <div className="flex justify-between items-center border-b pb-2">
                               <div className="flex items-center gap-2">
                                  {getVerdictIcon(result.verdict)}
                                  <Badge variant={getVerdictColor(result.verdict)}>{result.verdict}</Badge>
                               </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Confidence</p>
                                    <p className="text-lg font-bold">{result.confidence}%</p>
                                </div>
                           </div>
                           {result.method && (
                               <div>
                                   <p className="text-sm font-semibold">Suspected Method:</p>
                                   <p className="text-sm text-muted-foreground">{result.method}</p>
                               </div>
                           )}
                           {result.extractedMessage && (
                               <Card className="bg-primary/20">
                                   <CardHeader className="flex-row items-center gap-2 space-y-0 p-3">
                                        <Unlock className="h-4 w-4 text-accent" />
                                        <CardTitle className="text-base">Extracted Message</CardTitle>
                                   </CardHeader>
                                   <CardContent className="p-3 pt-0">
                                        <pre className="text-sm font-mono bg-background/50 p-2 rounded-md whitespace-pre-wrap">{result.extractedMessage}</pre>
                                   </CardContent>
                               </Card>
                           )}
                           <div>
                               <p className="text-sm font-semibold">Analysis Log:</p>
                               <pre className="mt-1 text-xs font-mono bg-primary/20 p-2 rounded-md max-h-40 overflow-y-auto">{result.analysisLog}</pre>
                           </div>
                        </div>
                    )}
                </div>
            </div>
        )}

      </CardContent>
    </Card>
  );
}
