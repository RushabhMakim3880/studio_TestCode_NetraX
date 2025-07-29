
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth, type User } from '@/hooks/use-auth';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type Message = {
  id: string;
  sender: string; // username
  receiver: string; // username
  content: string;
  timestamp: string;
};

const getConversationId = (user1: string, user2: string) => {
  return [user1, user2].sort().join('--');
};

export function ChatClient() {
  const { user: currentUser, users: teamMembers } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const { value: allMessages, setValue: setAllMessages } = useLocalStorage<Record<string, Message[]>>('netra-chat-messages', {});
  
  const channelRef = useRef<BroadcastChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Initialize BroadcastChannel
    channelRef.current = new BroadcastChannel('netra-chat-channel');

    const handleMessage = (event: MessageEvent) => {
      const newMessage: Message = event.data;
      const conversationId = getConversationId(newMessage.sender, newMessage.receiver);
      
      setAllMessages(prev => {
        const existing = prev[conversationId] || [];
        return { ...prev, [conversationId]: [...existing, newMessage] };
      });
    };

    channelRef.current.addEventListener('message', handleMessage);

    return () => {
      channelRef.current?.removeEventListener('message', handleMessage);
      channelRef.current?.close();
    };
  }, [setAllMessages]);

  useEffect(() => {
    // Auto-scroll to the latest message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages, selectedUser]);
  
  const handleSendMessage = () => {
    if (!message.trim() || !currentUser || !selectedUser) return;
    
    const newMessage: Message = {
      id: crypto.randomUUID(),
      sender: currentUser.username,
      receiver: selectedUser.username,
      content: message,
      timestamp: new Date().toISOString(),
    };
    
    // Post to broadcast channel for other tabs/windows
    channelRef.current?.postMessage(newMessage);

    // Update local state and storage
    const conversationId = getConversationId(currentUser.username, selectedUser.username);
    const existingMessages = allMessages[conversationId] || [];
    setAllMessages({ ...allMessages, [conversationId]: [...existingMessages, newMessage] });

    setMessage('');
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };
  
  const conversationId = currentUser && selectedUser ? getConversationId(currentUser.username, selectedUser.username) : null;
  const currentChatMessages = conversationId ? allMessages[conversationId] || [] : [];

  return (
    <Card className="flex h-[calc(100vh-12rem)]">
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5"/>Team Members</h2>
        </div>
        <ScrollArea className="h-[calc(100%-4.5rem)]">
          {teamMembers.filter(u => u.username !== currentUser?.username).map(user => (
            <button 
              key={user.username} 
              className={cn(
                "w-full text-left p-3 flex items-center gap-3 hover:bg-primary/20",
                selectedUser?.username === user.username && 'bg-primary/20'
              )}
              onClick={() => setSelectedUser(user)}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatarUrl || ''} />
                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{user.displayName}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
            </button>
          ))}
        </ScrollArea>
      </div>
      <div className="w-2/3 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
               <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser.avatarUrl || ''} />
                <AvatarFallback>{getInitials(selectedUser.displayName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{selectedUser.displayName}</p>
                <p className="text-xs text-muted-foreground">{selectedUser.role}</p>
              </div>
            </div>
            <ScrollArea className="flex-grow p-4">
              <div className="space-y-4">
                {currentChatMessages.map((msg) => (
                    <div key={msg.id} className={cn("flex gap-3", msg.sender === currentUser?.username ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                            "p-3 rounded-lg max-w-sm",
                            msg.sender === currentUser?.username ? 'bg-accent text-accent-foreground' : 'bg-muted'
                        )}>
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs text-muted-foreground/80 mt-1 text-right">{format(new Date(msg.timestamp), 'HH:mm')}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="relative">
                <Input 
                    placeholder="Type a message..." 
                    className="pr-12"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-10" onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>Select a user to start chatting.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
