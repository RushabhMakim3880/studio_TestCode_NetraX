
'use client';

import { createContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ROLES, type Role, getAllModuleNamesForRole } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

export type User = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: Role;
  password?: string; // Should be hashed in a real app
  lastLogin?: string;
  enabledModules?: string[];
};

type LoginCredentials = Pick<User, 'username' | 'password'>;
type RegisterCredentials = Required<Pick<User, 'username' | 'password' | 'role' | 'displayName'>>;
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
    { username: 'admin', displayName: 'Admin', password: 'password123', role: ROLES.ADMIN, lastLogin: new Date().toISOString(), avatarUrl: null, enabledModules: getAllModuleNamesForRole(ROLES.ADMIN) },
    { username: 'analyst', displayName: 'Analyst', password: 'password123', role: ROLES.ANALYST, avatarUrl: null, enabledModules: getAllModuleNamesForRole(ROLES.ANALYST) },
    { username: 'operator', displayName: 'Operator', password: 'password123', role: ROLES.OPERATOR, avatarUrl: null, enabledModules: getAllModuleNamesForRole(ROLES.OPERATOR) },
    { username: 'auditor', displayName: 'Auditor', password: 'password123', role: ROLES.AUDITOR, avatarUrl: null, enabledModules: getAllModuleNamesForRole(ROLES.AUDITOR) },
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
      const storedUsersJSON = localStorage.getItem('netra-users');
      let allUsers: User[] = storedUsersJSON ? JSON.parse(storedUsersJSON) : seedUsers;

      // Data migration for users in localStorage that don't have enabledModules
      const migratedUsers = allUsers.map((u: User) => {
          if (!u.enabledModules) {
              return { ...u, enabledModules: getAllModuleNamesForRole(u.role) };
          }
          return u;
      });

      setUsers(migratedUsers);

      if (!storedUsersJSON || JSON.stringify(allUsers) !== JSON.stringify(migratedUsers)) {
          localStorage.setItem('netra-users', JSON.stringify(migratedUsers));
      }

      const storedCurrentUserJSON = localStorage.getItem('netra-currentUser');
      if (storedCurrentUserJSON) {
        let currentUser: User = JSON.parse(storedCurrentUserJSON);
        // Also migrate the current user object if needed
        if (!currentUser.enabledModules) {
            currentUser = { ...currentUser, enabledModules: getAllModuleNamesForRole(currentUser.role) };
            localStorage.setItem('netra-currentUser', JSON.stringify(currentUser));
        }
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Failed to parse data from localStorage', error);
      localStorage.clear();
      setUsers(seedUsers);
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
        description: `Welcome back, ${loggedInUser.displayName}.`,
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
    const newUser: User = { 
        ...credentials, 
        lastLogin: new Date().toISOString(),
        avatarUrl: null,
        enabledModules: getAllModuleNamesForRole(credentials.role),
    };
    const updatedUsers = [...users, newUser];
    
    syncUsers(updatedUsers);
    setUser(newUser);
    localStorage.setItem('netra-currentUser', JSON.stringify(newUser));

    toast({
        title: `Successfully registered!`,
        description: `Welcome to NETRA-X, ${credentials.displayName}.`,
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
