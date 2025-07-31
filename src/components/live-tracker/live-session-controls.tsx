
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '../ui/button';
import { Webcam, Video, Mic, StopCircle, CameraIcon } from 'lucide-react';
import Image from 'next/image';

type LiveSessionControlsProps = {
    isStreaming: boolean;
    isRecording: boolean;
    onStartStream: () => void;
    onStopStream: () => void;
    onRecordVideo: () => void;
    onRecordAudio: () => void;
    onStopRecording: () => void;
    onCaptureImage: () => void;
};

export function LiveSessionControls({
    isStreaming,
    isRecording,
    onStartStream,
    onStopStream,
    onRecordVideo,
    onRecordAudio,
    onStopRecording,
    onCaptureImage,
}: LiveSessionControlsProps) {
    const [liveFeedSrc, setLiveFeedSrc] = useState<string | null>(null);

    // This could be updated via a BroadcastChannel listener if needed
    // For now, it's just a placeholder for the live view
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Webcam className="h-5 w-5"/> Device Controls
                </CardTitle>
                <CardDescription>Remotely activate device hardware.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="w-full aspect-video rounded-md bg-black flex items-center justify-center overflow-hidden">
                    {isStreaming && liveFeedSrc ? (
                        <Image src={liveFeedSrc} alt="Live screen feed" width={1920} height={1080} className="w-full h-full object-contain" />
                    ) : (
                        <p className="text-sm text-muted-foreground">Stream Inactive</p>
                    )}
                </div>
                 <div className="grid grid-cols-2 gap-2">
                    {!isStreaming ? (
                        <Button variant="outline" onClick={onStartStream}><Video className="mr-2 h-4 w-4"/> Start Stream</Button>
                    ) : (
                        <Button variant="destructive" onClick={onStopStream}><StopCircle className="mr-2 h-4 w-4"/> Stop Stream</Button>
                    )}
                    <Button variant="outline" onClick={onCaptureImage} disabled={!isStreaming}><CameraIcon className="mr-2 h-4 w-4"/> Snapshot</Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                     <Button variant="outline" onClick={onRecordVideo} disabled={!isStreaming || isRecording}><Video className="mr-2 h-4 w-4 text-red-500"/> Record Video</Button>
                     <Button variant="outline" onClick={onRecordAudio} disabled={!isStreaming || isRecording}><Mic className="mr-2 h-4 w-4 text-red-500"/> Record Audio</Button>
                </div>
                <Button variant="destructive" onClick={onStopRecording} disabled={!isRecording} className="w-full">
                    <StopCircle className="mr-2 h-4 w-4" /> Stop Recording
                </Button>
            </CardContent>
        </Card>
    )
}
