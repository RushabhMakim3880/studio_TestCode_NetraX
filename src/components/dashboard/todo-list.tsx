
'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ListChecks, Trash2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

type TodoItem = {
    id: string;
    text: string;
    completed: boolean;
};

export function TodoList() {
  const { value: todos, setValue: setTodos } = useLocalStorage<TodoItem[]>('netra-todo-list', []);
  const [newTodo, setNewTodo] = useState('');

  const handleAddTodo = () => {
    if (!newTodo.trim()) return;
    const newItems = [...todos, { id: crypto.randomUUID(), text: newTodo.trim(), completed: false }];
    setTodos(newItems);
    setNewTodo('');
  };

  const handleToggleTodo = (id: string) => {
    const newItems = todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(newItems);
  };
  
  const handleClearCompleted = () => {
    const newItems = todos.filter(todo => !todo.completed);
    setTodos(newItems);
  };


  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-3">
                <ListChecks />
                Personal To-Do List
            </div>
            <Button variant="ghost" size="sm" onClick={handleClearCompleted} disabled={!todos.some(t => t.completed)}>
                <Trash2 className="mr-2 h-4 w-4"/>
                Clear Completed
            </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-1 flex flex-col h-full">
         <div className="flex gap-2">
            <Input 
                value={newTodo} 
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                placeholder="Add a new task..."
            />
            <Button onClick={handleAddTodo}>Add</Button>
        </div>
        <ScrollArea className="h-48 pr-3">
            <div className="space-y-2">
            {todos.map(todo => (
                <div key={todo.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-primary/20">
                    <Checkbox id={todo.id} checked={todo.completed} onCheckedChange={() => handleToggleTodo(todo.id)} />
                    <label htmlFor={todo.id} className={`flex-grow text-sm ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {todo.text}
                    </label>
                </div>
            ))}
            {todos.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                    Your personal to-do list is empty.
                </div>
            )}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
