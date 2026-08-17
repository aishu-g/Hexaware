'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Profile, UserRole } from '@/types/database';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  isLoading: boolean;
  login: (email: string, role?: UserRole) => void;
  logout: () => Promise<void>;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const DEFAULT_USER: Profile = {
  id: 'usr_admin_001',
  email: 'admin@mospi.gov.in',
  full_name: 'Dr. R. K. Sharma (Director - Data Quality)',
  role: 'admin',
  department: 'National Sample Survey Office (NSSO)',
  region: 'HQ - New Delhi',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_USER,
  role: 'admin',
  isLoading: false,
  login: () => {},
  logout: async () => {},
  hasRole: () => true
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(DEFAULT_USER);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth');
      if (res.ok) {
        const json = await res.json();
        if (json.authenticated && json.profile) {
          setUser(json.profile);
          localStorage.setItem('survintel_user', JSON.stringify(json.profile));
          return;
        }
      }
      // Fallback local storage lookup
      const stored = localStorage.getItem('survintel_user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser(DEFAULT_USER);
      }
    } catch (err) {
      console.error('Session fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const login = (email: string, role: UserRole = 'supervisor') => {
    const newUser: Profile = {
      id: `usr_${role}_${Date.now()}`,
      email,
      full_name: email.split('@')[0].toUpperCase(),
      role,
      department: 'NSSO Survey Division',
      region: 'Western Zone - Maharashtra',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setUser(newUser);
    localStorage.setItem('survintel_user', JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('survintel_user');
      router.push('/login');
      router.refresh();
    }
  };

  const hasRole = (allowedRoles: UserRole[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'viewer',
        isLoading,
        login,
        logout,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
