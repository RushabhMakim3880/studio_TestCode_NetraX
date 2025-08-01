
'use client';

import {
  collection,
  addDoc,
  query,
  onSnapshot,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import type { User } from '@/hooks/use-auth';

export type MessageType = 'text' | 'image' | 'audio' | 'file';

export type Message = {
  id?: string;
  conversationId: string;
  sender: Pick<User, 'uid' | 'username' | 'displayName' | 'avatarUrl'>;
  receiver: Pick<User, 'uid' | 'username' | 'displayName' | 'avatarUrl'>;
  participants: string[]; // Array of UIDs for sender and receiver
  type: MessageType;
  content: string; // text content or download URL for files
  fileName?: string;
  fileSize?: number;
  timestamp: Timestamp;
};

// Generates a consistent ID for a conversation between two users
export const getConversationId = (user1: string, user2: string) => {
  return [user1, user2].sort().join('--');
};

// Listens for real-time messages in a conversation
export const listenForMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void
) => {
  if (!db) return () => {}; // Return a no-op unsubscribe function if db is not available
  
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId)
  );

  return onSnapshot(q, (querySnapshot) => {
    const messages: Message[] = [];
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() } as Message);
    });
    
    // Sort messages by timestamp on the client side
    messages.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
    
    callback(messages);
  }, (error) => {
    console.error("Firestore snapshot error:", error);
  });
};

// Sends a text message
export const sendTextMessage = async (
  sender: User,
  receiver: User,
  content: string
) => {
  if (!content.trim() || !db) return;

  const conversationId = getConversationId(sender.username, receiver.username);

  try {
    await addDoc(collection(db, 'messages'), {
        conversationId,
        sender: {
          uid: sender.uid,
          username: sender.username,
          displayName: sender.displayName || sender.username,
          avatarUrl: sender.avatarUrl || null,
        },
        receiver: {
            uid: receiver.uid,
            username: receiver.username,
            displayName: receiver.displayName || receiver.username,
            avatarUrl: receiver.avatarUrl || null,
        },
        participants: [sender.uid, receiver.uid], // Added for security rules
        type: 'text',
        content,
        timestamp: Timestamp.now(),
    });
  } catch(e) {
      console.error("Failed to send text message:", e);
      throw new Error("Could not connect to the database to send message.");
  }
};


// Uploads a file and sends a message with its data URL
export const sendFileMessage = (
  sender: User,
  receiver: User,
  file: File,
  onProgress: (progress: number) => void // Kept for API consistency, but will be instant
): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!db) {
            return reject(new Error("Database not configured."));
        }
        onProgress(0);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const dataUrl = event.target?.result as string;
                if (!dataUrl) {
                    throw new Error("Failed to read file as data URL.");
                }

                const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'file';
                const conversationId = getConversationId(sender.username, receiver.username);

                await addDoc(collection(db, 'messages'), {
                    conversationId,
                     sender: { uid: sender.uid, username: sender.username, displayName: sender.displayName || sender.username, avatarUrl: sender.avatarUrl || null },
                     receiver: { uid: receiver.uid, username: receiver.username, displayName: receiver.displayName || receiver.username, avatarUrl: receiver.avatarUrl || null },
                    participants: [sender.uid, receiver.uid], // Added for security rules
                    type: fileType,
                    content: dataUrl,
                    fileName: file.name,
                    fileSize: file.size,
                    timestamp: Timestamp.now(),
                });
                onProgress(100);
                resolve();

            } catch (error) {
                 reject(error);
            }
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsDataURL(file);
    });
};
