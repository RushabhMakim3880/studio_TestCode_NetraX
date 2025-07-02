'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Folder, File, FolderPlus, FileUp, Trash2, ChevronRight, FileQuestion } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FileSystemNode = {
  id: string;
  name: string;
  type: 'folder' | 'file';
  parentId: string | null;
  content?: string; // For text content or data URI
  mimeType?: string;
};

const initialFileSystem: FileSystemNode[] = [
  { id: 'root', name: 'root', type: 'folder', parentId: null },
  { id: '1', name: 'Campaigns', type: 'folder', parentId: 'root' },
  { id: '2', name: 'Reports', type: 'folder', parentId: 'root' },
  { id: '3', name: 'Evidence', type: 'folder', parentId: 'root' },
  { id: '1-1', name: 'Project Chimera', type: 'folder', parentId: '1' },
  { id: '1-2', name: 'Operation Viper', type: 'folder', parentId: '1' },
  { id: '2-1', name: 'Q4_Vulnerability_Report.pdf', type: 'file', parentId: '2', content: 'This is a mock PDF report. In a real scenario, this would contain detailed findings and recommendations from the Q4 vulnerability assessment.', mimeType: 'application/pdf' },
  { id: '3-1', name: 'log_evidence_10-11-23.zip', type: 'file', parentId: '3', mimeType: 'application/zip' },
  { id: '3-2', name: 'target_network_map.png', type: 'file', parentId: '3', mimeType: 'image/png', content: 'https://placehold.co/800x600.png'},
  { id: '3-3', name: 'meeting_notes.txt', type: 'file', parentId: '3', mimeType: 'text/plain', content: 'Meeting Notes - 2023-11-15\n\n- Discussed initial recon phase for Operation Viper.\n- John to handle OSINT on key personnel.\n- Jane to prepare initial phishing lure.'},
];

export function FileBrowser() {
  const [fs, setFs] = useState<FileSystemNode[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [newFolderName, setNewFolderName] = useState('');
  const [viewingFile, setViewingFile] = useState<FileSystemNode | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const storedFs = localStorage.getItem('netra-fs');
      if (storedFs) {
        setFs(JSON.parse(storedFs));
      } else {
        setFs(initialFileSystem);
        localStorage.setItem('netra-fs', JSON.stringify(initialFileSystem));
      }
    } catch (error) {
      console.error('Failed to initialize file system from localStorage', error);
      setFs(initialFileSystem);
    }
  }, []);

  const updateFs = (newFs: FileSystemNode[]) => {
    setFs(newFs);
    localStorage.setItem('netra-fs', JSON.stringify(newFs));
  };

  const currentFolder = useMemo(() => fs.find(node => node.id === currentFolderId), [fs, currentFolderId]);
  const breadcrumbs = useMemo(() => {
    const path = [];
    let current = currentFolder;
    while (current && current.parentId !== null) {
      path.unshift(current);
      current = fs.find(node => node.id === current.parentId);
    }
    path.unshift({id: 'root', name: 'Home', type: 'folder', parentId: null, content: undefined, mimeType: undefined});
    return path;
  }, [currentFolder, fs]);

  const children = useMemo(() => {
      if (!currentFolderId) return [];
      return fs.filter(node => node.parentId === currentFolderId).sort((a,b) => a.name.localeCompare(b.name)).sort((a,b) => a.type === 'folder' ? -1 : 1);
  }, [fs, currentFolderId]);

  const handleAddFolder = () => {
    const name = newFolderName.trim();
    if (!name) {
      toast({ variant: 'destructive', title: 'Error', description: 'Folder name cannot be empty.' });
      return;
    }

    const newNode: FileSystemNode = {
      id: crypto.randomUUID(),
      name,
      type: 'folder',
      parentId: currentFolderId,
    };

    updateFs([...fs, newNode]);
    setNewFolderName('');
    toast({ title: 'Success', description: 'Folder created.' });
  };
  
  const handleDeleteNode = (nodeId: string) => {
    // Recursive delete
    const nodesToDelete = new Set<string>([nodeId]);
    const queue = [nodeId];
    while(queue.length > 0) {
        const currentId = queue.shift()!;
        const children = fs.filter(n => n.parentId === currentId);
        for (const child of children) {
            nodesToDelete.add(child.id);
            if (child.type === 'folder') {
                queue.push(child.id);
            }
        }
    }
    const newFs = fs.filter(node => !nodesToDelete.has(node.id));
    updateFs(newFs);
    toast({ title: 'Success', description: 'Item and its contents deleted.' });
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      if (!event.target?.result) return;
        const newNode: FileSystemNode = {
            id: crypto.randomUUID(),
            name: file.name,
            type: 'file',
            parentId: currentFolderId,
            content: event.target.result as string,
            mimeType: file.type,
        };
        updateFs([...fs, newNode]);
        toast({ title: 'File Uploaded', description: `${file.name} has been added.` });
    };

    reader.onerror = () => {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to read file.' });
    };
    
    // For simplicity, we'll try to read most common types as text or data URL
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        reader.readAsDataURL(file);
    } else if (file.type.startsWith('text/') || file.type.endsWith('json') || file.type.endsWith('xml')) {
        reader.readAsText(file);
    } else {
        // For other files, just store metadata without content
        const newNode: FileSystemNode = {
            id: crypto.randomUUID(),
            name: file.name,
            type: 'file',
            parentId: currentFolderId,
            content: undefined,
            mimeType: file.type,
        };
        updateFs([...fs, newNode]);
        toast({ title: 'File Info Saved', description: `${file.name} metadata stored. Preview not available.` });
    }
    
    if (e.target) e.target.value = '';
  };
  
  const handleNodeDoubleClick = (node: FileSystemNode) => {
    if (node.type === 'folder') {
      setCurrentFolderId(node.id);
    } else {
      setViewingFile(node);
      setIsViewModalOpen(true);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-primary/10 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm overflow-x-auto">
              {breadcrumbs.map((b, i) => (
                  <div key={b.id} className="flex items-center shrink-0">
                      <Button variant="link" size="sm" onClick={() => setCurrentFolderId(b.id)} disabled={b.id === currentFolderId} className="px-1 text-muted-foreground disabled:text-foreground disabled:opacity-100 disabled:no-underline">
                          {b.name}
                      </Button>
                      {i < breadcrumbs.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </div>
              ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex gap-2">
              <Input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="New folder name..." onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}/>
              <Button size="icon" onClick={handleAddFolder}><FolderPlus/></Button>
          </div>
          <div className="flex gap-2">
              <Button onClick={handleUploadClick} variant="outline" className="w-full justify-start">
                  <FileUp className="mr-2 h-4 w-4" /> Upload File
              </Button>
              <Input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          </div>
        </div>

        <div className="flex-grow overflow-auto rounded-md bg-card p-2">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {children.map(node => (
                  <div key={node.id} onDoubleClick={() => handleNodeDoubleClick(node)} className="group relative flex flex-col items-center justify-center p-4 rounded-md hover:bg-primary/20 cursor-pointer transition-colors text-center">
                      {node.type === 'folder' ? <Folder className="h-16 w-16 text-accent"/> : <File className="h-16 w-16 text-muted-foreground"/>}
                      <p className="text-sm mt-2 truncate w-full" title={node.name}>{node.name}</p>

                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100">
                                  <Trash2 className="h-4 w-4 text-destructive"/>
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete "{node.name}" and all its contents.
                              </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteNode(node.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                  </div>
              ))}
              {children.length === 0 && <p className="col-span-full text-center text-muted-foreground p-8">This folder is empty.</p>}
          </div>
        </div>
      </div>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{viewingFile?.name}</DialogTitle>
            <DialogDescription>MIME Type: {viewingFile?.mimeType || 'unknown'}</DialogDescription>
          </DialogHeader>
          <div className="py-4 flex-grow overflow-auto">
            {viewingFile?.mimeType?.startsWith('image/') && viewingFile.content ? (
              <Image src={viewingFile.content} alt={viewingFile.name || 'Image preview'} width={800} height={600} className="w-full h-auto object-contain"/>
            ) : viewingFile?.mimeType?.startsWith('text/') && viewingFile.content ? (
              <pre className="bg-primary/10 p-4 rounded-md text-sm whitespace-pre-wrap">{viewingFile.content}</pre>
            ) : viewingFile?.mimeType === 'application/pdf' && viewingFile.content ? (
              <iframe src={viewingFile.content} className="w-full h-full border-0" title={viewingFile.name}></iframe>
            ) : (
              <div className="text-center p-8 flex flex-col items-center justify-center h-full">
                <FileQuestion className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="mt-4">No preview available for this file type.</p>
                {viewingFile?.content && <p className="text-muted-foreground text-xs mt-2">(Mock content present but not previewable)</p>}
              </div>
            )}
          </div>
          <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
