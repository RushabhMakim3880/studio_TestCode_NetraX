
'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { analyzeImageMetadata, type MetadataAnalysisOutput } from '@/ai/flows/metadata-scrubber-flow';
import { Loader2, AlertTriangle, Eraser, Download, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function MetadataScrubber() {
  const [result, setResult] = useState<MetadataAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({ variant: 'destructive', title: 'File Too Large', description: 'Please select an image file under 4MB.' });
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

  const handleAnalyze = async () => {
    if (!selectedFile || !previewUrl) {
      toast({ variant: 'destructive', title: 'No File Selected', description: 'Please select an image to analyze.' });
      return;
    }
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await analyzeImageMetadata({
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
  };

  const handleDownloadScrubbed = () => {
    if (!previewUrl || !selectedFile) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `scrubbed_${selectedFile.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Image Downloaded", description: "The 'scrubbed' image has been downloaded. (Note: This is a simulation; metadata is not actually removed)."});
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Eraser className="h-6 w-6" />
          <CardTitle>Metadata Scrubber</CardTitle>
        </div>
        <CardDescription>Upload an image to analyze and simulate scrubbing its EXIF metadata.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <label htmlFor="image-upload" className="text-sm font-medium">Image File</label>
            <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        {previewUrl && (
            <div className="grid md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                    <div className="border p-2 rounded-md bg-card">
                       <Image src={previewUrl} alt="Preview" width={500} height={500} className="rounded-md w-full h-auto object-contain max-h-80" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button onClick={handleAnalyze} disabled={isLoading || !selectedFile} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                            Analyze Metadata
                        </Button>
                        <Button onClick={handleDownloadScrubbed} disabled={!result} className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            Download Scrubbed
                        </Button>
                    </div>
                </div>
                
                <div className="min-h-80">
                    {isLoading && <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
                    {error && <div className="text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</div>}
                    
                    {result && (
                        <div className="space-y-4">
                           <Card className={result.hasPii ? 'bg-destructive/10 border-destructive/20' : ''}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Analysis Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{result.summary}</p>
                                </CardContent>
                           </Card>
                           <div>
                               <p className="text-sm font-semibold mb-2">Simulated EXIF Data:</p>
                               <div className="border rounded-md max-h-60 overflow-y-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Tag</TableHead><TableHead>Value</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {result.exifData.map(tag => (
                                            <TableRow key={tag.tag} className={tag.tag.includes('GPS') ? 'text-destructive' : ''}>
                                                <TableCell className="font-semibold">{tag.tag}</TableCell>
                                                <TableCell className="font-mono text-xs">{tag.value}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                               </div>
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
