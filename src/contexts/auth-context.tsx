'use client';

import { createContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ROLES, type Role } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

export type User = {
  username: string;
  role: Role;
  password?: string; // Should be hashed in a real app
  lastLogin?: string;
};

type LoginCredentials = Pick<User, 'username' | 'password'>;
type RegisterCredentials = Required<Pick<User, 'username' | 'password' | 'role'>>;
type PasswordChangeCredentials = {
    currentPassword: any;
    newPassword: any;
};

type AuthContextType = {
  user: User | null;
  users: User[];
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (credentials: RegisterCredentials) => Promise<void>;
  updateUser: (username: string, data: Partial<User>) => void;
  deleteUser: (username: string) => void;
  changePassword: (credentials: PasswordChangeCredentials) => Promise<void>;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const seedUsers: User[] = [
    { username: 'admin', password: 'password123', role: ROLES.ADMIN, lastLogin: new Date().toISOString() },
    { username: 'analyst', password: 'password123', role: ROLES.ANALYST },
    { username: 'operator', password: 'password123', role: ROLES.OPERATOR },
    { username: 'auditor', password: 'password123', role: ROLES.AUDITOR },
];


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const syncUsers = useCallback((updatedUsers: User[]) => {
      setUsers(updatedUsers);
      localStorage.setItem('netra-users', JSON.stringify(updatedUsers));
  }, []);

  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('netra-users');
      const allUsers = storedUsers ? JSON.parse(storedUsers) : seedUsers;
      if (!storedUsers) {
        localStorage.setItem('netra-users', JSON.stringify(seedUsers));
      }
      setUsers(allUsers);

      const storedCurrentUser = localStorage.getItem('netra-currentUser');
      if (storedCurrentUser) {
        setUser(JSON.parse(storedCurrentUser));
      }
    } catch (error) {
      console.error('Failed to parse data from localStorage', error);
      localStorage.clear();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const foundUser = users.find(u => u.username === credentials.username);

    // In a real app, you'd compare hashed passwords
    if (foundUser && foundUser.password === credentials.password) {
      const loggedInUser = { ...foundUser, lastLogin: new Date().toISOString() };
      const updatedUsers = users.map(u => u.username === loggedInUser.username ? loggedInUser : u);
      
      syncUsers(updatedUsers);
      setUser(loggedInUser);
      localStorage.setItem('netra-currentUser', JSON.stringify(loggedInUser));

      toast({
        title: `Login Successful`,
        description: `Welcome back, ${loggedInUser.username}.`,
      });
      router.push('/dashboard');
    } else {
      throw new Error('Invalid username or password.');
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    if (users.some(u => u.username === credentials.username)) {
      throw new Error('Username already exists.');
    }
    const newUser = { ...credentials, lastLogin: new Date().toISOString() };
    const updatedUsers = [...users, newUser];
    
    syncUsers(updatedUsers);
    setUser(newUser);
    localStorage.setItem('netra-currentUser', JSON.stringify(newUser));

    toast({
        title: `Successfully registered!`,
        description: `Welcome to NETRA-X, ${credentials.username}.`,
    });
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('netra-currentUser');
    setUser(null);
    router.push('/login');
  };

  const updateUser = (username: string, data: Partial<User>) => {
    const updatedUsers = users.map(u => u.username === username ? { ...u, ...data } : u);
    syncUsers(updatedUsers);
    if(user && user.username === username) {
        const updatedCurrentUser = {...user, ...data};
        setUser(updatedCurrentUser);
        localStorage.setItem('netra-currentUser', JSON.stringify(updatedCurrentUser));
    }
  };
  
  const changePassword = async (credentials: PasswordChangeCredentials) => {
      if (!user) {
          throw new Error("No user is currently logged in.");
      }
      
      const foundUser = users.find(u => u.username === user.username);
      if (!foundUser || foundUser.password !== credentials.currentPassword) {
          throw new Error("Your current password is not correct.");
      }

      updateUser(user.username, { password: credentials.newPassword });
  };

  const deleteUser = (username: string) => {
    if(user && user.username === username) {
        // This case is handled in the UI, but as a safeguard
        logout();
    }
    const updatedUsers = users.filter(u => u.username !== username);
    syncUsers(updatedUsers);
  };

  const value = { user, users, login, logout, register, updateUser, deleteUser, changePassword, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
