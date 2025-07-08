'use client'
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const themes = [
    { name: 'Default', id: 'theme-default', colors: { bg: 'hsl(220 12% 10%)', primary: 'hsl(220 10% 18%)', accent: 'hsl(200 100% 70%)' } },
    { name: 'Matrix', id: 'theme-matrix', colors: { bg: 'hsl(120 15% 5%)', primary: 'hsl(120 60% 15%)', accent: 'hsl(120 100% 50%)' } },
    { name: 'Crimson', id: 'theme-crimson', colors: { bg: 'hsl(0 15% 8%)', primary: 'hsl(0 60% 20%)', accent: 'hsl(0 80% 50%)' } },
    { name: 'Cyberpunk', id: 'theme-cyberpunk', colors: { bg: 'hsl(250 20% 8%)', primary: 'hsl(320 50% 20%)', accent: 'hsl(320 100% 60%)' } },
];

export function ThemeSwitcher() {
    const [activeTheme, setActiveTheme] = useState('');

    useEffect(() => {
        const savedTheme = localStorage.getItem('netra-theme') || 'theme-default';
        setActiveTheme(savedTheme);
        // Initial theme application
        document.documentElement.className = 'dark';
        document.documentElement.classList.add(savedTheme);
    }, []);

    const handleThemeChange = (themeId: string) => {
        // Remove all theme classes before adding the new one
        themes.forEach(t => document.documentElement.classList.remove(t.id));
        document.documentElement.classList.add(themeId);
        
        localStorage.setItem('netra-theme', themeId);
        setActiveTheme(themeId);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Theme Selector</CardTitle>
                <CardDescription>Choose your visual theme for the NETRA-X interface.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {themes.map(theme => (
                    <button 
                        key={theme.id} 
                        onClick={() => handleThemeChange(theme.id)} 
                        className={cn( 
                            "rounded-md border-2 p-4 text-left transition-all", 
                            activeTheme === theme.id ? 'border-accent' : 'border-border hover:border-foreground/50'
                        )}
                        aria-pressed={activeTheme === theme.id}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <p className="font-semibold">{theme.name}</p>
                            {activeTheme === theme.id && <Check className="h-5 w-5 text-accent" />}
                        </div>
                        <div className="flex gap-2">
                           <div className="h-8 w-full rounded-sm" style={{ backgroundColor: theme.colors.bg, border: '1px solid hsl(var(--border))' }} />
                           <div className="h-8 w-full rounded-sm" style={{ backgroundColor: theme.colors.primary }} />
                           <div className="h-8 w-full rounded-sm" style={{ backgroundColor: theme.colors.accent }} />
                        </div>
                    </button>
                ))}
            </CardContent>
        </Card>
    )
}
