
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth, type User, type UserStatus } from '@/hooks/use-auth';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { getConversationId, listenForMessages, Message } from '@/services/chat-service';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';

const getStatusColor = (status: UserStatus) => {
    switch (status) {
        case 'Active': return 'bg-green-400';
        case 'Away': return 'bg-amber-400';
        case 'In Meeting': return 'bg-purple-400';
        case 'DND': return 'bg-red-500';
        case 'Out of Office':
        case 'Offline':
        default: return 'bg-muted-foreground/50';
    }
}

export function ChatSummary() {
  const { user: currentUser, users: teamMembers } = useAuth();
  const { value: unreadCounts, setValue: setUnreadCounts } = useLocalStorage<Record<string, number>>('netra-unread-counts', {});
  
  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const updateUnreadCount = useCallback((conversationId: string, messages: Message[]) => {
      if (!currentUser) return;
      
      const lastReadTimestamp = JSON.parse(localStorage.getItem(`lastRead_${conversationId}`) || '0');
      const newMessages = messages.filter(m => m.sender.username !== currentUser.username && m.timestamp.toMillis() > lastReadTimestamp);
      
      const otherUser = conversationId.replace(currentUser.username, '').replace('--', '');
      setUnreadCounts(prev => ({ ...prev, [otherUser]: newMessages.length }));

  }, [currentUser, setUnreadCounts]);
  
   useEffect(() => {
    if (!currentUser) return;
    
    const unsubscribes = teamMembers.map(member => {
        if (member.username === currentUser.username) return () => {};
        const conversationId = getConversationId(currentUser.username, member.username);
        return listenForMessages(conversationId, (newMessages) => {
            updateUnreadCount(conversationId, newMessages);
        });
    });

    return () => unsubscribes.forEach(unsub => unsub());

  }, [currentUser, teamMembers, updateUnreadCount]);
  
  const onlineUsers = teamMembers.filter(u => u.username !== currentUser?.username);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <MessageSquare />
          Team Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-full max-h-60">
            <div className="space-y-1 px-6">
            {onlineUsers.map((member) => {
                const unreadCount = unreadCounts[member.username] || 0;
                return (
                <Link href="/chat" key={member.username} className="block">
                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-primary/20">
                        <div className="relative">
                            <Avatar className="h-9 w-9">
                            <AvatarImage src={member.avatarUrl || ''} />
                            <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
                            </Avatar>
                            <span className={cn(
                                "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-card",
                                getStatusColor(member.status)
                            )} />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">{member.displayName}</p>
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                        </div>
                        {unreadCount > 0 && (
                            <div className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs font-bold">
                                {unreadCount}
                            </div>
                        )}
                    </div>
                </Link>
            )})}
            </div>
        </ScrollArea>
      </CardContent>
       <CardFooter className="pt-6">
        <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/chat">
                Open Full Chat <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
