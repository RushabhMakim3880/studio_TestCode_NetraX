
'use client';

import { useEffect } from 'react';
import type { CustomTheme } from '@/lib/colors';

// This component runs once on the client to apply any stored custom theme.
export function ThemeInitializer() {
    useEffect(() => {
        try {
            const customThemeString = localStorage.getItem('netra-custom-theme');
            const body = document.body;

            if (customThemeString) {
                const customTheme: CustomTheme = JSON.parse(customThemeString);
                body.className = "custom-theme"; // A generic class
                 for (const [key, value] of Object.entries(customTheme.colors)) {
                    body.style.setProperty(`--${key}`, value);
                }
            } else {
                 const savedColorTheme = localStorage.getItem('netra-color-theme') || 'theme-default';
                 // Ensure no inline styles are left over from a previous custom theme
                 body.style.cssText = "";
                 body.className = savedColorTheme;
            }
        } catch (error) {
            console.error("Failed to apply custom theme from localStorage", error);
        }
    }, []);

    return null;
}
