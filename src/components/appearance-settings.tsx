
'use client'
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Check, Moon, Sun, Palette, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import convert from 'color-convert';
import { Button } from './ui/button';

const colorThemes = [
    { name: 'Default', id: 'theme-default', colors: { primary: 'hsl(var(--primary))', accent: 'hsl(var(--accent))' } },
    { name: 'Matrix', id: 'theme-matrix', colors: { primary: 'hsl(120 60% 30%)', accent: 'hsl(120 100% 50%)' } },
    { name: 'Crimson', id: 'theme-crimson', colors: { primary: 'hsl(0 60% 30%)', accent: 'hsl(0 80% 55%)' } },
    { name: 'Cyberpunk', id: 'theme-cyberpunk', colors: { primary: 'hsl(320 50% 30%)', accent: 'hsl(320 100% 60%)' } },
    { name: 'Cobalt', id: 'theme-cobalt', colors: { primary: 'hsl(210 70% 45%)', accent: 'hsl(200 100% 60%)' } },
    { name: 'Amber', id: 'theme-amber', colors: { primary: 'hsl(35 80% 45%)', accent: 'hsl(45 100% 55%)' } },
    { name: 'Emerald', id: 'theme-emerald', colors: { primary: 'hsl(145, 63%, 32%)', accent: 'hsl(145, 80%, 60%)' } },
    { name: 'Slate', id: 'theme-slate', colors: { primary: 'hsl(220, 10%, 40%)', accent: 'hsl(220, 15%, 80%)' } },
];

const getAccentFromCss = (): string => {
    if (typeof window === 'undefined') return '#000000';
    const accentVar = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    if (!accentVar) return '#00A3FF'; // A default blue
    try {
        const [h, s, l] = accentVar.split(' ').map(parseFloat);
        return `#${convert.hsl.hex([h, s, l])}`;
    } catch {
        return '#00A3FF';
    }
}


export function AppearanceSettings() {
    const { theme, setTheme } = useTheme();
    const [colorTheme, setColorTheme] = useState('theme-default');
    const [accentColor, setAccentColor] = useState('#000000');

    useEffect(() => {
        // This effect runs once on mount to initialize the state from localStorage
        const isCustomThemeActive = localStorage.getItem('netra-custom-theme-active') === 'true';
        if (isCustomThemeActive) {
            setColorTheme('custom');
        } else {
            const savedColorTheme = localStorage.getItem('netra-color-theme') || 'theme-default';
            setColorTheme(savedColorTheme);
            document.body.className = document.body.className.replace(/theme-[\w-]+/g, '').trim();
            document.body.classList.add(savedColorTheme);
        }
        
        const savedAccent = localStorage.getItem('netra-manual-accent');
        setAccentColor(savedAccent || getAccentFromCss());

    }, []);
    
    // Function to determine if foreground should be light or dark
    const getContrastingForegroundColor = (hex: string) => {
        const [r, g, b] = convert.hex.rgb(hex);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? 'hsl(0 0% 10%)' : 'hsl(0 0% 98%)'; // dark vs light
    };

    const handleAccentColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColorHex = e.target.value;
        const [h, s, l] = convert.hex.hsl(newColorHex);
        
        setAccentColor(newColorHex);
        
        // Clear preset and custom themes
        localStorage.removeItem('netra-custom-theme');
        localStorage.removeItem('netra-custom-theme-active');
        localStorage.removeItem('netra-color-theme');
        setColorTheme('manual');
        
        // Save manual accent color
        localStorage.setItem('netra-manual-accent', newColorHex);
        
        // Clear preset theme classes from body
        document.body.className = document.body.className.replace(/theme-[\w-]+/g, '').trim();

        // Apply new colors via inline styles
        document.body.style.setProperty('--accent', `${h} ${s}% ${l}%`);
        document.body.style.setProperty('--ring', `${h} ${s}% ${l}%`);
        document.body.style.setProperty('--accent-foreground', getContrastingForegroundColor(newColorHex));
    };

    const handleColorThemeChange = (themeId: string) => {
        // Clear custom and manual themes
        localStorage.removeItem('netra-custom-theme');
        localStorage.removeItem('netra-custom-theme-active');
        localStorage.removeItem('netra-manual-accent');
        document.body.style.cssText = ""; // Clear all inline styles

        document.body.className = document.body.className.replace(/theme-[\w-]+/g, '').trim();
        document.body.classList.add(themeId);
        
        localStorage.setItem('netra-color-theme', themeId);
        setColorTheme(themeId);
        
        // Update the color picker to reflect the new theme's accent color
        setTimeout(() => setAccentColor(getAccentFromCss()), 100);
    };

    const handleResetToDefault = () => {
        // Clear all theme-related storage
        localStorage.removeItem('netra-custom-theme');
        localStorage.removeItem('netra-custom-theme-active');
        localStorage.removeItem('netra-color-theme');
        localStorage.removeItem('netra-manual-accent');
        
        // Clear inline styles from body
        document.body.style.cssText = "";

        // Remove any theme classes, preserving the dark/light mode class
        document.body.className = document.body.className.replace(/theme-[\w-]+/g, '').trim();
        document.body.classList.add('theme-default');

        setColorTheme('theme-default');
        
        // Force re-evaluation of CSS variables to update the color picker
        setTimeout(() => setAccentColor(getAccentFromCss()), 100);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Choose your visual theme for the NETRA-X interface.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label>Appearance</Label>
                        <CardDescription>Switch between light and dark mode.</CardDescription>
                    </div>
                     <div className="flex items-center gap-2">
                        <Sun className="h-5 w-5"/>
                        <Switch
                            checked={theme === 'dark'}
                            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                            aria-label="Toggle dark mode"
                        />
                        <Moon className="h-5 w-5"/>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <Label>Color Scheme</Label>
                        <CardDescription className="mb-4">Select a color palette. This will override any custom theme.</CardDescription>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {colorThemes.map(ct => (
                                <button
                                    key={ct.id}
                                    onClick={() => handleColorThemeChange(ct.id)}
                                    className={cn(
                                        "rounded-md border-2 p-4 text-left transition-all",
                                        colorTheme === ct.id ? 'border-accent' : 'border-border hover:border-foreground/50'
                                    )}
                                    aria-pressed={colorTheme === ct.id}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-semibold">{ct.name}</p>
                                        {colorTheme === ct.id && <Check className="h-5 w-5 text-accent" />}
                                    </div>
                                    <div className="flex gap-2">
                                    <div className="h-8 w-full rounded-sm" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                                    <div className="h-8 w-full rounded-sm" style={{ backgroundColor: ct.colors.primary }} />
                                    <div className="h-8 w-full rounded-sm" style={{ backgroundColor: ct.colors.accent }} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                     <div className="space-y-4">
                        <div>
                            <Label>Accent Color</Label>
                            <CardDescription className="mb-4">Manually pick an accent color. This will override presets.</CardDescription>
                             <div className="flex items-center gap-2 p-4 border rounded-lg">
                                <Palette className="h-5 w-5 text-muted-foreground" />
                                <Input 
                                    type="color" 
                                    value={accentColor}
                                    onChange={handleAccentColorChange}
                                    className="h-10 p-1"
                                />
                                <Input 
                                    value={accentColor}
                                    onChange={handleAccentColorChange}
                                    className="font-mono"
                                />
                             </div>
                        </div>
                    </div>
                </div>
            </CardContent>
             <CardFooter className="justify-end border-t pt-6">
                <Button variant="outline" onClick={handleResetToDefault}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to Default
                </Button>
            </CardFooter>
        </Card>
    )
}
