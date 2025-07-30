
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from './ui/dropdown-menu';

const colorThemes = [
    { name: 'Light', id: 'light', icon: Sun },
    { name: 'Dark', id: 'dark', icon: Moon },
];

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleThemeChange = (newTheme: string) => {
       setTheme(newTheme);
    };
    
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
