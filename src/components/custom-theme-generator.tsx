
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useColor } from 'color-thief-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ImageUp, Loader2, Palette } from 'lucide-react';
import { generateThemeFromColor, type CustomTheme } from '@/lib/colors';

function ColorThiefComponent({ imageSrc }: { imageSrc: string }) {
    const { toast } = useToast();
    const { data: color } = useColor(imageSrc, 'rgbArray', { crossOrigin: 'anonymous', quality: 10 });

    useEffect(() => {
        if (color) {
            const customTheme = generateThemeFromColor(color);
            applyCustomTheme(customTheme);
            saveCustomTheme(imageSrc, customTheme);
            toast({ title: 'Custom Theme Applied!', description: 'UI colors have been updated based on your image.' });
        }
    }, [color, imageSrc, toast]);

    const applyCustomTheme = (theme: CustomTheme) => {
        const body = document.body;
        body.className = "custom-theme"; // A generic class
        for (const [key, value] of Object.entries(theme.colors)) {
            body.style.setProperty(`--${key}`, value);
        }
        localStorage.setItem('netra-custom-theme-active', 'true');
        localStorage.removeItem('netra-color-theme');
    }

    const saveCustomTheme = (imageDataUrl: string, theme: CustomTheme) => {
        const themeToStore = { imageDataUrl, ...theme };
        localStorage.setItem('netra-custom-theme', JSON.stringify(themeToStore));
    }

    return null; // This component does not render anything itself
}


export function CustomThemeGenerator() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ variant: 'destructive', title: 'Image Too Large', description: 'Please select an image under 5MB.' });
        return;
      }
      setIsLoading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Palette className="h-6 w-6" />
          <CardTitle>Custom Theme Generator</CardTitle>
        </div>
        <CardDescription>Upload an image to automatically generate a new UI color theme from its palette.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Select an image, and we'll extract its dominant color to create a unique theme. Your new theme will be applied instantly.</p>
                <Input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} />
                <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageUp className="mr-2 h-4 w-4" />}
                    Upload Theme Image
                </Button>
            </div>
             <div className="h-48 border rounded-lg bg-primary/10 flex items-center justify-center p-4">
                {imageSrc ? (
                    <Image src={imageSrc} alt="Theme preview" width={200} height={200} className="max-h-full w-auto object-contain rounded-md" />
                ) : (
                    <p className="text-sm text-muted-foreground">Image preview will appear here</p>
                )}
             </div>
        </div>
        {imageSrc && <ColorThiefComponent imageSrc={imageSrc} />}
      </CardContent>
    </Card>
  );
}
