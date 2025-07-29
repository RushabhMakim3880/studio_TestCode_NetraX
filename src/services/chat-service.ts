
'use client';

import {
  collection,
  addDoc,
  query,
  orderBy,
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
  sender: Pick<User, 'username' | 'displayName' | 'avatarUrl'>;
  receiver: Pick<User, 'username' | 'displayName' | 'avatarUrl'>;
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
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const messages: Message[] = [];
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() } as Message);
    });
    callback(messages);
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

  await addDoc(collection(db, 'messages'), {
    conversationId,
    sender: {
      username: sender.username,
      displayName: sender.displayName,
      avatarUrl: sender.avatarUrl || null,
    },
    receiver: {
        username: receiver.username,
        displayName: receiver.displayName,
        avatarUrl: receiver.avatarUrl || null,
    },
    type: 'text',
    content,
    timestamp: Timestamp.now(),
  });
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
                     sender: { username: sender.username, displayName: sender.displayName, avatarUrl: sender.avatarUrl || null },
                     receiver: { username: receiver.username, displayName: receiver.displayName, avatarUrl: receiver.avatarUrl || null },
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
