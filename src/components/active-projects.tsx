
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowRight, FolderSearch, Briefcase } from 'lucide-react';

type Project = {
  id: string;
  name: string;
  target: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed';
};

type Task = {
  id: string;
  projectId: string;
  status: 'To Do' | 'In Progress' | 'Completed';
};

export function ActiveProjects() {
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    try {
      const storedProjects = localStorage.getItem('netra-projects');
      const allProjects = storedProjects ? JSON.parse(storedProjects) : [];
      setActiveProjects(allProjects.filter((c: Project) => c.status === 'Active'));

      const storedTasks = localStorage.getItem('netra-tasks');
      setTasks(storedTasks ? JSON.parse(storedTasks) : []);
    } catch (error) {
      console.error('Failed to load project data from localStorage', error);
    }
  }, []);

  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
    return (completedTasks / projectTasks.length) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className='flex items-center gap-3'>
                <Briefcase className="h-5 w-5" />
                <CardTitle className="text-lg">Active Projects</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild>
                <Link href="/project-management">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeProjects.length > 0 ? (
          <div className="space-y-4">
            {activeProjects.map(project => {
              const progress = getProjectProgress(project.id);
              return (
                <div key={project.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{project.name}</p>
                    <p className="text-sm text-muted-foreground">{Math.round(progress)}%</p>
                  </div>
                   <Progress value={progress} className="h-2" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-6">
            <FolderSearch className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2"/>
            <p className="text-sm">No active projects.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
