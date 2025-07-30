
'use client'

import { useTheme } from 'next-themes';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Moon, Sun } from 'lucide-react';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

export function AppearanceSettings() {
    const { theme, setTheme } = useTheme();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Switch between the light and dark theme for the application.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label>Theme</Label>
                        <CardDescription>Select either the light or dark theme.</CardDescription>
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
            </CardContent>
        </Card>
    )
}
