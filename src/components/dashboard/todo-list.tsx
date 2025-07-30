
'use client';

import { useState, useRef } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ListChecks, Trash2, Mic, ImageUp, Plus, Edit, X, StopCircle } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type NoteItem = {
    id: string;
    type: 'todo' | 'text' | 'audio' | 'image';
    content: string;
    completed?: boolean;
    timestamp: string;
};

export function TodoList() {
  const { value: notes, setValue: setNotes } = useLocalStorage<NoteItem[]>('netra-notes-and-todos', []);
  const [newTodo, setNewTodo] = useState('');
  const [newNote, setNewNote] = useState('');
  const [editingTodo, setEditingTodo] = useState<NoteItem | null>(null);

  const { toast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // States and refs for audio recording
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);


  const todos = notes.filter(n => n.type === 'todo');
  const textNotes = notes.filter(n => n.type !== 'todo');

  const handleAddTodo = () => {
    if (!newTodo.trim()) return;
    const newItem: NoteItem = {
      id: crypto.randomUUID(),
      type: 'todo',
      content: newTodo.trim(),
      completed: false,
      timestamp: new Date().toISOString(),
    };
    setNotes([...notes, newItem]);
    setNewTodo('');
  };
  
  const handleAddTextNote = () => {
      if (!newNote.trim()) return;
      const newItem: NoteItem = {
          id: crypto.randomUUID(),
          type: 'text',
          content: newNote.trim(),
          timestamp: new Date().toISOString(),
      };
      setNotes([...notes, newItem]);
      setNewNote('');
  }
  
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newItem: NoteItem = {
          id: crypto.randomUUID(),
          type: 'image',
          content: event.target?.result as string,
          timestamp: new Date().toISOString(),
        };
        setNotes(prev => [...prev, newItem]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleTodo = (id: string) => {
    const newItems = notes.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setNotes(newItems);
  };
  
  const handleEditTodo = () => {
      if(!editingTodo) return;
      const newItems = notes.map(item =>
        item.id === editingTodo.id ? editingTodo : item
      );
      setNotes(newItems);
      setEditingTodo(null);
  };

  const handleDeleteItem = (id: string) => {
    const newItems = notes.filter(item => item.id !== id);
    setNotes(newItems);
    toast({ title: 'Item removed' });
  };
  
  const handleClearCompleted = () => {
    const newItems = notes.filter(todo => todo.type !== 'todo' || !todo.completed);
    setNotes(newItems);
  };
  
  const handleStartAudioRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const newItem: NoteItem = {
                    id: crypto.randomUUID(),
                    type: 'audio',
                    content: audioUrl,
                    timestamp: new Date().toISOString(),
                };
                setNotes(prev => [...prev, newItem]);
                
                // Clean up tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorderRef.current.start();
            setIsAudioRecording(true);
            toast({ title: 'Recording started...' });

        } catch (err) {
            console.error("Error accessing microphone:", err);
            toast({ variant: 'destructive', title: "Microphone Access Denied", description: "Please enable microphone permissions in your browser settings." });
        }
    } else {
        toast({ variant: 'destructive', title: "Unsupported Browser", description: "Your browser does not support audio recording." });
    }
  };

  const handleStopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsAudioRecording(false);
        toast({ title: 'Recording stopped.', description: "Audio note has been saved." });
    }
  };


  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-3">
                <ListChecks />
                Personal Scratchpad
            </div>
             <Button variant="ghost" size="sm" onClick={handleClearCompleted} disabled={!todos.some(t => t.completed)}>
                <Trash2 className="mr-2 h-4 w-4"/>
                Clear Completed
            </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[280px] flex flex-col">
        <Tabs defaultValue="todos" className="flex-grow flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="todos">To-Do List</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="todos" className="flex-grow flex flex-col gap-2 mt-2">
                 <div className="flex gap-2">
                    <Input 
                        value={newTodo} 
                        onChange={(e) => setNewTodo(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                        placeholder="Add a new task..."
                    />
                    <Button onClick={handleAddTodo}><Plus className="h-4 w-4"/></Button>
                 </div>
                 <ScrollArea className="flex-grow pr-3">
                     <div className="space-y-2">
                        {todos.map(todo => (
                            <div key={todo.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-primary/20 group">
                                <Checkbox id={todo.id} checked={todo.completed} onCheckedChange={() => handleToggleTodo(todo.id)} />
                                {editingTodo?.id === todo.id ? (
                                    <Input
                                        value={editingTodo.content}
                                        onChange={(e) => setEditingTodo({ ...editingTodo, content: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && handleEditTodo()}
                                        onBlur={handleEditTodo}
                                        autoFocus
                                        className="h-8"
                                    />
                                ) : (
                                    <label htmlFor={todo.id} className={`flex-grow text-sm ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                                        {todo.content}
                                    </label>
                                )}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingTodo(todo)}><Edit className="h-3 w-3"/></Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteItem(todo.id)}><X className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        ))}
                        {todos.length === 0 && (
                            <div className="text-center text-muted-foreground py-10">
                                Your to-do list is empty.
                            </div>
                        )}
                    </div>
                 </ScrollArea>
            </TabsContent>
            <TabsContent value="notes" className="flex-grow flex flex-col gap-2 mt-2">
                 <ScrollArea className="flex-grow pr-3">
                     <div className="space-y-3">
                        {textNotes.map(note => (
                             <div key={note.id} className="flex gap-2 text-sm bg-primary/20 p-2 rounded-md group relative">
                                <div className="flex-grow min-w-0">
                                {note.type === 'text' && <p className="whitespace-pre-wrap break-words">{note.content}</p>}
                                {note.type === 'audio' && <audio controls src={note.content} className="w-full h-10"/>}
                                {note.type === 'image' && <Image src={note.content} alt="note" width={200} height={200} className="rounded-md"/>}
                                <p className="text-xs text-muted-foreground mt-1">{new Date(note.timestamp).toLocaleTimeString()}</p>
                                </div>
                                 <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteItem(note.id)}><X className="h-4 w-4"/></Button>
                             </div>
                        ))}
                     </div>
                 </ScrollArea>
                 <div className="flex gap-2 pt-2 border-t">
                    <Textarea placeholder="Type a note..." value={newNote} onChange={(e) => setNewNote(e.target.value)} className="h-10 resize-none"/>
                    <Button onClick={handleAddTextNote} className="h-10">Save</Button>
                    <Button type="button" variant="outline" size="icon" className="h-10 w-10" onClick={() => imageInputRef.current?.click()}><ImageUp className="h-4 w-4"/></Button>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        className={cn("h-10 w-10", isAudioRecording && "bg-destructive text-destructive-foreground animate-pulse")}
                        onClick={isAudioRecording ? handleStopAudioRecording : handleStartAudioRecording}
                    >
                      {isAudioRecording ? <StopCircle className="h-4 w-4"/> : <Mic className="h-4 w-4"/>}
                    </Button>
                    <Input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageFileChange} className="hidden"/>
                 </div>
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
