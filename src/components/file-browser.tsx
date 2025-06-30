'use client';

import { useState, useEffect, useMemo } from 'react';
import { Folder, File, MoreVertical, FolderPlus, FilePlus, Trash2, Edit, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type FileSystemNode = {
  id: string;
  name: string;
  type: 'folder' | 'file';
  parentId: string | null;
  children?: FileSystemNode[];
};

const initialFileSystem: FileSystemNode[] = [
  { id: 'root', name: 'root', type: 'folder', parentId: null },
  { id: '1', name: 'Campaigns', type: 'folder', parentId: 'root' },
  { id: '2', name: 'Reports', type: 'folder', parentId: 'root' },
  { id: '3', name: 'Evidence', type: 'folder', parentId: 'root' },
  { id: '1-1', name: 'Project Chimera', type: 'folder', parentId: '1' },
  { id: '1-2', name: 'Operation Viper', type: 'folder', parentId: '1' },
  { id: '2-1', name: 'Q4_Vulnerability_Report.pdf', type: 'file', parentId: '2' },
  { id: '3-1', name: 'log_evidence_10-11-23.zip', type: 'file', parentId: '3' },
];

export function FileBrowser() {
  const [fs, setFs] = useState<FileSystemNode[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const { toast } = useToast();

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
    path.unshift({id: 'root', name: 'Home', type: 'folder', parentId: null});
    return path;
  }, [currentFolder, fs]);

  const children = useMemo(() => {
      if (!currentFolderId) return [];
      return fs.filter(node => node.parentId === currentFolderId).sort((a,b) => a.name.localeCompare(b.name)).sort((a,b) => a.type === 'folder' ? -1 : 1);
  }, [fs, currentFolderId]);

  const handleAddNode = (type: 'folder' | 'file') => {
    const name = type === 'folder' ? newFolderName : newFileName;
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Name cannot be empty.' });
      return;
    }

    const newNode: FileSystemNode = {
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      parentId: currentFolderId,
    };

    updateFs([...fs, newNode]);
    if (type === 'folder') setNewFolderName('');
    if (type === 'file') setNewFileName('');
    toast({ title: 'Success', description: `${type === 'folder' ? 'Folder' : 'File'} created.` });
  };
  
  const handleDeleteNode = (nodeId: string) => {
    const newFs = fs.filter(node => node.id !== nodeId && node.parentId !== nodeId); // Simple non-recursive delete
    updateFs(newFs);
    toast({ title: 'Success', description: 'Item deleted.' });
  }

  return (
    <div className="flex flex-col h-full bg-primary/10 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-sm">
            {breadcrumbs.map((b, i) => (
                <div key={b.id} className="flex items-center">
                    <Button variant="link" size="sm" onClick={() => setCurrentFolderId(b.id)} disabled={b.id === currentFolderId} className="px-1 text-muted-foreground disabled:text-foreground disabled:opacity-100 disabled:no-underline">
                        {b.name}
                    </Button>
                    {i < breadcrumbs.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </div>
            ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <div className="flex gap-2">
            <Input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="New folder name..."/>
            <Button size="icon" onClick={() => handleAddNode('folder')}><FolderPlus/></Button>
        </div>
        <div className="flex gap-2">
            <Input value={newFileName} onChange={e => setNewFileName(e.target.value)} placeholder="New file name..."/>
            <Button size="icon" onClick={() => handleAddNode('file')}><FilePlus /></Button>
        </div>
      </div>

      <div className="flex-grow overflow-auto rounded-md bg-card p-2">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {children.map(node => (
                <div key={node.id} onDoubleClick={() => node.type === 'folder' && setCurrentFolderId(node.id)} className="group relative flex flex-col items-center justify-center p-4 rounded-md hover:bg-primary/20 cursor-pointer transition-colors">
                    {node.type === 'folder' ? <Folder className="h-16 w-16 text-accent"/> : <File className="h-16 w-16 text-muted-foreground"/>}
                    <p className="text-sm text-center mt-2 truncate w-full">{node.name}</p>

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
                                This action cannot be undone. This will permanently delete "{node.name}".
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
  );
}
