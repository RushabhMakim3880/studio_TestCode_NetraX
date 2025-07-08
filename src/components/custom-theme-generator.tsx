
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

export function CustomThemeGenerator() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const { data: color, loading: colorLoading } = useColor(imageSrc, 'rgbArray', { crossOrigin: 'anonymous', quality: 10 });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    if (color && imageSrc) {
      const customTheme = generateThemeFromColor(color);
      applyCustomTheme(customTheme);
      saveCustomTheme(imageSrc, customTheme);
      setIsLoading(false);
      toast({ title: 'Custom Theme Applied!', description: 'UI colors have been updated based on your image.' });
    }
  }, [color, imageSrc]);

  const applyCustomTheme = (theme: CustomTheme) => {
    document.body.className = "custom-theme"; // A generic class to denote a custom theme is active
    for (const [key, value] of Object.entries(theme.colors)) {
      document.body.style.setProperty(`--${key}`, value);
    }
  }

  const saveCustomTheme = (imageDataUrl: string, theme: CustomTheme) => {
    const themeToStore = {
        imageDataUrl,
        ...theme
    };
    localStorage.setItem('netra-custom-theme', JSON.stringify(themeToStore));
    localStorage.removeItem('netra-color-theme'); // Remove preset theme
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ variant: 'destructive', title: 'Image Too Large', description: 'Please select an image under 2MB.' });
        return;
      }
      setIsLoading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
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
                    {(isLoading || colorLoading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageUp className="mr-2 h-4 w-4" />}
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
      </CardContent>
    </Card>
  );
}
