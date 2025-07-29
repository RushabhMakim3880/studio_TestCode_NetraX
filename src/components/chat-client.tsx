
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, type User } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Users, Paperclip, Mic, StopCircle, File as FileIcon, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getConversationId, listenForMessages, sendTextMessage, sendFileMessage, type Message } from '@/services/chat-service';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/services/firebase';

export function ChatClient() {
  const { user: currentUser, users: teamMembers } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

   useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!currentUser || !selectedUser || !db) {
        setMessages([]);
        return;
    };

    const conversationId = getConversationId(currentUser.username, selectedUser.username);
    const unsubscribe = listenForMessages(conversationId, (newMessages) => {
        setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [currentUser, selectedUser]);
  
  const handleSendMessage = async () => {
    if (!message.trim() || !currentUser || !selectedUser) return;
    try {
        await sendTextMessage(currentUser, selectedUser, message);
        setMessage('');
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to send message.' });
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser || !selectedUser) return;
    
    try {
      await sendFileMessage(currentUser, selectedUser, file, () => {}); // Progress callback not needed for data URLs
      toast({ title: "File Sent!", description: `"${file.name}" has been sent.`});
    } catch(e) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not send the file.' });
    }
  };
  
  const handleRecordAudio = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
        handleFileChange({ target: { files: [audioFile] } } as any);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setIsRecording(true);
      toast({ title: 'Recording started...' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Microphone Error', description: 'Could not access the microphone.' });
    }
  };
  
  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };
  
  const MessageContent = ({ msg }: { msg: Message }) => {
    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    switch(msg.type) {
        case 'image': return <Image src={msg.content} alt={msg.fileName || 'image'} width={300} height={200} className="rounded-lg object-cover cursor-pointer" onClick={() => window.open(msg.content, '_blank')} />;
        case 'audio': return <audio controls src={msg.content} className="w-full h-10"/>;
        case 'file': return (
            <a href={msg.content} download={msg.fileName} className="flex items-center gap-2 p-2 bg-background/50 rounded-md">
                <FileIcon className="h-6 w-6"/>
                <div className="text-sm">
                    <p>{msg.fileName}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(msg.fileSize || 0)}</p>
                </div>
            </a>
        );
        case 'text':
        default: return <p className="text-sm whitespace-pre-wrap">{msg.content}</p>;
    }
  }

  if (!db) {
    return (
        <Card className="flex flex-grow items-center justify-center p-8">
            <div className="text-center text-muted-foreground">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <h3 className="text-xl font-semibold text-foreground">Firebase Not Configured</h3>
                <p className="mt-2">The chat feature is disabled. Please add your Firebase project<br/>configuration keys to your <code className="font-mono bg-primary/20 p-1 rounded-sm">.env</code> file.</p>
            </div>
        </Card>
    );
  }

  return (
    <Card className="flex flex-grow">
      <div className="w-1/3 border-r flex flex-col">
        <div className="p-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5"/>Team Members</h2>
        </div>
        <ScrollArea className="flex-grow">
          {teamMembers.filter(u => u.username !== currentUser?.username).map(user => (
            <button key={user.username} className={cn("w-full text-left p-3 flex items-center gap-3 hover:bg-primary/20", selectedUser?.username === user.username && 'bg-primary/20')} onClick={() => setSelectedUser(user)}>
              <Avatar className="h-9 w-9"><AvatarImage src={user.avatarUrl || ''} /><AvatarFallback>{getInitials(user.displayName)}</AvatarFallback></Avatar>
              <div className="flex-1"><p className="font-semibold">{user.displayName}</p><p className="text-xs text-muted-foreground">{user.role}</p></div>
            </button>
          ))}
        </ScrollArea>
      </div>
      <div className="w-2/3 flex flex-col bg-primary/10">
        {selectedUser && currentUser ? (
          <>
            <div className="p-4 border-b flex items-center gap-3 bg-card flex-shrink-0">
               <Avatar className="h-10 w-10"><AvatarImage src={selectedUser.avatarUrl || ''} /><AvatarFallback>{getInitials(selectedUser.displayName)}</AvatarFallback></Avatar>
              <div><p className="font-semibold">{selectedUser.displayName}</p><p className="text-xs text-muted-foreground">{selectedUser.role}</p></div>
            </div>
            <ScrollArea className="flex-grow p-4">
              <div className="space-y-4">
                {messages.map((msg, idx) => {
                  const fromSelf = msg.sender.username === currentUser.username;
                  return (
                    <div key={msg.id || idx} className={cn("flex gap-3", fromSelf ? 'justify-end' : 'justify-start')}>
                        {!fromSelf && <Avatar className="h-8 w-8"><AvatarImage src={msg.sender.avatarUrl || ''} /><AvatarFallback>{getInitials(msg.sender.displayName)}</AvatarFallback></Avatar>}
                        <div className={cn("p-3 rounded-lg max-w-sm", fromSelf ? 'bg-accent text-accent-foreground' : 'bg-card')}>
                            <MessageContent msg={msg} />
                            <p className="text-xs text-muted-foreground/80 mt-1 text-right">{format(msg.timestamp.toDate(), 'HH:mm')}</p>
                        </div>
                         {fromSelf && <Avatar className="h-8 w-8"><AvatarImage src={msg.sender.avatarUrl || ''} /><AvatarFallback>{getInitials(msg.sender.displayName)}</AvatarFallback></Avatar>}
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t bg-card flex-shrink-0">
              <div className="relative flex items-center gap-2">
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                 <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()}><Paperclip className="h-5 w-5"/></Button>
                 <Button size="icon" variant="ghost" onClick={handleRecordAudio}>
                    {isRecording ? <StopCircle className="h-5 w-5 text-destructive"/> : <Mic className="h-5 w-5"/>}
                 </Button>
                 <Input placeholder="Type a message..." className="pr-12" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}/>
                 <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-10" onClick={handleSendMessage} disabled={!message.trim()}><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><p>Select a user to start chatting.</p></div>
        )}
      </div>
    </Card>
  );
}
