'use client'
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Check, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

const colorThemes = [
    { name: 'Default', id: 'theme-default', colors: { primary: 'hsl(220 10% 18%)', accent: 'hsl(200 100% 70%)' } },
    { name: 'Matrix', id: 'theme-matrix', colors: { primary: 'hsl(120 60% 30%)', accent: 'hsl(120 100% 50%)' } },
    { name: 'Crimson', id: 'theme-crimson', colors: { primary: 'hsl(0 60% 30%)', accent: 'hsl(0 80% 55%)' } },
    { name: 'Cyberpunk', id: 'theme-cyberpunk', colors: { primary: 'hsl(320 50% 30%)', accent: 'hsl(320 100% 60%)' } },
    { name: 'Cobalt', id: 'theme-cobalt', colors: { primary: 'hsl(210 70% 45%)', accent: 'hsl(200 100% 60%)' } },
    { name: 'Amber', id: 'theme-amber', colors: { primary: 'hsl(35 80% 45%)', accent: 'hsl(45 100% 55%)' } },
];

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    const [colorTheme, setColorTheme] = useState('theme-default');

    useEffect(() => {
        const savedColorTheme = localStorage.getItem('netra-color-theme') || 'theme-default';
        setColorTheme(savedColorTheme);
        document.body.className = savedColorTheme;
    }, []);

    const handleColorThemeChange = (themeId: string) => {
        document.body.className = themeId;
        localStorage.setItem('netra-color-theme', themeId);
        setColorTheme(themeId);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Theme Selector</CardTitle>
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

                <div>
                    <Label>Color Scheme</Label>
                    <CardDescription className="mb-4">Select a color palette.</CardDescription>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </CardContent>
        </Card>
    )
}
