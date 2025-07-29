
'use client';

import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatClient } from './chat-client';
import { cn } from '@/lib/utils';
import type { User } from '@/hooks/use-auth';

export function ChatPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const toggleChat = () => {
    // Don't reset selected user when closing, to preserve state.
    setIsOpen(!isOpen);
  };
  
  const handleUserSelect = (user: User | null) => {
    setSelectedUser(user);
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="icon"
          className="rounded-full w-14 h-14 bg-accent text-accent-foreground shadow-lg hover:bg-accent/90"
          onClick={toggleChat}
          aria-label="Toggle chat"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        </Button>
      </div>

      <div
        className={cn(
          "fixed bottom-20 right-4 z-50 w-full max-w-md md:max-w-xl lg:max-w-2xl xl:max-w-4xl rounded-xl border bg-card shadow-2xl transition-all duration-300 ease-in-out",
          isOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none"
        )}
      >
        <ChatClient 
            isPopup={true} 
            onUserSelect={handleUserSelect}
            initialSelectedUser={selectedUser}
        />
      </div>
    </>
  );
}
