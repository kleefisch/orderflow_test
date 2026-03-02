import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../types';
import * as api from '../services/api';

interface AuthContextType {
  user: User | null;
  role: 'waiter' | 'kitchen' | 'manager' | null;
  isLoading: boolean;
  login: (user: User, role: 'waiter' | 'kitchen' | 'manager') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'waiter' | 'kitchen' | 'manager' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore authentication from localStorage on mount
  useEffect(() => {
    const storedAuth = api.getStoredAuth();
    if (storedAuth) {
      setUser(storedAuth.user);
      setRole(storedAuth.role);
    }
    setIsLoading(false);
  }, []);

  const login = (user: User, role: 'waiter' | 'kitchen' | 'manager') => {
    setUser(user);
    setRole(role);
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
