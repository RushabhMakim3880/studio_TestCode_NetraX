'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clipboard, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MD5 from 'crypto-js/md5';
import SHA1 from 'crypto-js/sha1';
import SHA256 from 'crypto-js/sha256';
import SHA512 from 'crypto-js/sha512';

export function HashCalculator() {
  const [inputText, setInputText] = useState('hello world');
  const [hashes, setHashes] = useState({
    md5: '',
    sha1: '',
    sha256: '',
    sha512: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (inputText) {
      setHashes({
        md5: MD5(inputText).toString(),
        sha1: SHA1(inputText).toString(),
        sha256: SHA256(inputText).toString(),
        sha512: SHA512(inputText).toString(),
      });
    } else {
      setHashes({ md5: '', sha1: '', sha256: '', sha512: '' });
    }
  }, [inputText]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Hash copied to clipboard.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <Hash className="h-6 w-6" />
            <CardTitle>Hash Calculator</CardTitle>
        </div>
        <CardDescription>
          Calculate common hashes for a given text input in real-time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="hash-input">Input Text</Label>
            <Textarea 
                id="hash-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="font-mono h-24"
                placeholder="Type something to hash..."
            />
        </div>
        <div className="space-y-4">
            <HashOutputRow label="MD5" value={hashes.md5} onCopy={handleCopy} />
            <HashOutputRow label="SHA1" value={hashes.sha1} onCopy={handleCopy} />
            <HashOutputRow label="SHA256" value={hashes.sha256} onCopy={handleCopy} />
            <HashOutputRow label="SHA512" value={hashes.sha512} onCopy={handleCopy} />
        </div>
      </CardContent>
    </Card>
  );
}

function HashOutputRow({ label, value, onCopy }: { label: string, value: string, onCopy: (text: string) => void }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
                <Input readOnly value={value} className="font-mono bg-primary/20" />
                <Button variant="outline" size="icon" onClick={() => onCopy(value)}>
                    <Clipboard className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
