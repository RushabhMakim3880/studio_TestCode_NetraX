
'use client';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Check, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from './ui/dropdown-menu';
import { Label } from './ui/label';

const colorThemes = [
    { name: 'Dark', id: 'dark' },
    { name: 'Light', id: 'light' },
    { name: 'Delft Blue', id: 'theme-delft-blue' },
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
            {colorThemes.map(ct => (
                <DropdownMenuRadioItem key={ct.id} value={ct.id}>
                    {ct.id === 'light' ? <Sun className="mr-2 h-4 w-4" /> : ct.id === 'dark' ? <Moon className="mr-2 h-4 w-4" /> : <div className="mr-2 h-4 w-4" /> }
                    <span>{ct.name}</span>
                </DropdownMenuRadioItem>
            ))}
       </DropdownMenuRadioGroup>
    )
}
