import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileBrowser } from '@/components/file-browser';

export default function FilesPage() {
  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-10rem)]">
      <div>
        <h1 className="font-headline text-3xl font-semibold">File Manager</h1>
        <p className="text-muted-foreground">Manage operational files and evidence.</p>
      </div>

      <Card className="flex-grow">
        <CardHeader>
          <CardTitle>Evidence Locker</CardTitle>
          <CardDescription>Browse, upload, and manage project files securely.</CardDescription>
        </CardHeader>
        <CardContent className="h-[calc(100%-8rem)]">
          <FileBrowser />
        </CardContent>
      </Card>
    </div>
  );
}
