
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Clipboard, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import thirtyTwo from 'thirty-two';
import bs58 from 'bs58';

const rot13 = (str: string): string => {
  return str.replace(/[a-zA-Z]/g, (c) => {
    const charCode = c.charCodeAt(0);
    const shift = charCode <= 90 ? 65 : 97;
    return String.fromCharCode(((charCode - shift + 13) % 26) + shift);
  });
};

export function EncoderDecoder() {
  const [input, setInput] = useState('Hello NETRA-X!');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [outputs, setOutputs] = useState({
    base64: '',
    base32: '',
    base58: '',
    hex: '',
    url: '',
    rot13: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!input) {
      setOutputs({ base64: '', base32: '', base58: '', hex: '', url: '', rot13: '' });
      return;
    }
    
    if (mode === 'encode') {
      try {
        const utf8Encoder = new TextEncoder();
        const encodedData = utf8Encoder.encode(input);
        
        setOutputs({
            base64: btoa(unescape(encodeURIComponent(input))),
            base32: thirtyTwo.encode(encodedData).toString(),
            base58: bs58.encode(encodedData),
            hex: Array.from(input).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
            url: encodeURIComponent(input),
            rot13: rot13(input),
        });
      } catch (e) {
        console.error("Encoding error:", e);
      }
    } else { // decode
      let decodedValues: typeof outputs = { base64: '', base32: '', base58: '', hex: '', url: '', rot13: '' };
      
      try { decodedValues.base64 = decodeURIComponent(escape(atob(input))); } catch (e) { decodedValues.base64 = "Invalid Base64 input"; }
      try { const decoded = thirtyTwo.decode(input); decodedValues.base32 = new TextDecoder().decode(decoded); } catch (e) { decodedValues.base32 = "Invalid Base32 input"; }
      try { const decoded = bs58.decode(input); decodedValues.base58 = new TextDecoder().decode(decoded); } catch (e) { decodedValues.base58 = "Invalid Base58 input"; }
      try { const hexResult = input.replace(/\s/g, '').match(/.{1,2}/g)?.map(byte => String.fromCharCode(parseInt(byte, 16))).join(''); decodedValues.hex = hexResult && !hexResult.includes('NaN') ? hexResult : "Invalid Hex input"; } catch (e) { decodedValues.hex = "Invalid Hex input"; }
      try { decodedValues.url = decodeURIComponent(input.replace(/\+/g, ' ')); } catch (e) { decodedValues.url = "Invalid URL encoding"; }
      decodedValues.rot13 = rot13(input);

      setOutputs(decodedValues);
    }
  }, [input, mode]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Output copied to clipboard.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Languages className="h-6 w-6" />
          <CardTitle>Encoder / Decoder</CardTitle>
        </div>
        <CardDescription>
          Encode and decode text using common formats.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <Label htmlFor="encoder-input">{mode === 'encode' ? 'Plain Text' : 'Encoded Text'}</Label>
                   <RadioGroup defaultValue="encode" value={mode} onValueChange={(v: 'encode' | 'decode') => setMode(v)} className="flex items-center">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="encode" id="mode-encode" />
                            <Label htmlFor="mode-encode">Encode</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="decode" id="mode-decode" />
                            <Label htmlFor="mode-decode">Decode</Label>
                        </div>
                    </RadioGroup>
                </div>
                <Textarea 
                    id="encoder-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="font-mono h-full"
                    placeholder="Type or paste text here..."
                />
            </div>
             <div className="space-y-4">
                <OutputRow label="Base64" value={outputs.base64} onCopy={handleCopy} />
                <OutputRow label="Base32" value={outputs.base32} onCopy={handleCopy} />
                <OutputRow label="Base58" value={outputs.base58} onCopy={handleCopy} />
                <OutputRow label="Hex" value={outputs.hex} onCopy={handleCopy} />
                <OutputRow label="URL" value={outputs.url} onCopy={handleCopy} />
                <OutputRow label="ROT13" value={outputs.rot13} onCopy={handleCopy} />
             </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OutputRow({ label, value, onCopy }: { label: string, value: string, onCopy: (text: string) => void }) {
    return (
        <div className="space-y-1">
            <Label>{label}</Label>
            <div className="relative">
                <Textarea readOnly value={value} className="font-mono bg-primary/20 pr-10" rows={2}/>
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => onCopy(value)}>
                    <Clipboard className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
