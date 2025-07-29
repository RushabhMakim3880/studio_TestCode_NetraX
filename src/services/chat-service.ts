
'use client';

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  or,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
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
  if (!content.trim()) return;

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


// Uploads a file and sends a message with its URL
export const sendFileMessage = (
  sender: User,
  receiver: User,
  file: File,
  onProgress: (progress: number) => void
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const fileId = crypto.randomUUID();
        const conversationId = getConversationId(sender.username, receiver.username);
        const storageRef = ref(storage, `chat/${conversationId}/${fileId}-${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress(progress);
            },
            (error) => {
                console.error('File upload failed:', error);
                reject(error);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'file';

                await addDoc(collection(db, 'messages'), {
                    conversationId,
                     sender: { username: sender.username, displayName: sender.displayName, avatarUrl: sender.avatarUrl || null },
                     receiver: { username: receiver.username, displayName: receiver.displayName, avatarUrl: receiver.avatarUrl || null },
                    type: fileType,
                    content: downloadURL,
                    fileName: file.name,
                    fileSize: file.size,
                    timestamp: Timestamp.now(),
                });
                resolve();
            }
        );
    });
};
