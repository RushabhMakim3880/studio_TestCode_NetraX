
'use client';

import { useEffect } from 'react';
import type { CustomTheme } from '@/lib/colors';

// This component runs once on the client to apply any stored custom theme.
export function ThemeInitializer() {
    useEffect(() => {
        try {
            const customThemeString = localStorage.getItem('netra-custom-theme');
            if (customThemeString) {
                const customTheme: CustomTheme = JSON.parse(customThemeString);
                document.body.className = "custom-theme"; // A generic class
                 for (const [key, value] of Object.entries(customTheme.colors)) {
                    document.body.style.setProperty(`--${key}`, value);
                }
            } else {
                 const savedColorTheme = localStorage.getItem('netra-color-theme') || 'theme-default';
                 document.body.className = savedColorTheme;
            }
        } catch (error) {
            console.error("Failed to apply custom theme from localStorage", error);
        }
    }, []);

    return null;
}
