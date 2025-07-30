
'use client';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Check, Moon, Sun, Palette, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from './ui/dropdown-menu';
import { Label } from './ui/label';

const colorThemes = [
    { name: 'Dark', id: 'dark', icon: Moon },
    { name: 'Light', id: 'light', icon: Sun },
    { name: 'Delft Blue', id: 'theme-delft-blue', icon: Palette },
    { name: 'NETRA-X OS', id: 'theme-netrax-os', icon: Server },
];

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleThemeChange = (newTheme: string) => {
        if (newTheme === 'light' || newTheme === 'dark') {
             // For next-themes built-in themes
            localStorage.setItem('theme', newTheme);
        } else {
             // For our custom body-class themes
            localStorage.setItem('netra-color-theme', newTheme);
        }
       setTheme(newTheme);
    };
    
    // We can't render the UI until the component is mounted on the client
    // to avoid a hydration mismatch between server and client.
    if (!mounted) {
        return null;
    }

    return (
       <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
            {colorThemes.map(ct => {
                const Icon = ct.icon;
                return (
                    <DropdownMenuRadioItem key={ct.id} value={ct.id}>
                        <Icon className="mr-2 h-4 w-4" />
                        <span>{ct.name}</span>
                    </DropdownMenuRadioItem>
                );
            })}
       </DropdownMenuRadioGroup>
    )
}
