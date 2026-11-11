import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User as SupaUser } from '@supabase/supabase-js';
import { User, AuthState } from '../types';
import { getAuthState, saveAuthState, clearAuthState, findUserByEmail, addUser, getStoredData, saveData } from '../utils/storage';
import { supabase, isDemoMode } from '../lib/supabase';
import { upsertUser } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  initializing: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapUser(su: SupaUser): User {
  const meta = (su.user_metadata || {}) as Record<string, unknown>;
  return {
    id: su.id,
    email: su.email || '',
    name: (meta.name as string) || (su.email ? su.email.split('@')[0] : 'User'),
    role: (meta.role as string) || 'Team Member',
    createdAt: (su.created_at || new Date().toISOString()).split('T')[0],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() =>
    isDemoMode ? getAuthState() : { user: null, isAuthenticated: false }
  );
  const [initializing, setInitializing] = useState<boolean>(!isDemoMode);

  useEffect(() => {
    if (isDemoMode) { setAuth(getAuthState()); setInitializing(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setAuth({ user: mapUser(data.session.user), isAuthenticated: true });
      setInitializing(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setAuth({ user: mapUser(session.user), isAuthenticated: true });
      else setAuth({ user: null, isAuthenticated: false });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 700));
      const user = findUserByEmail(email);
      if (!user) return { success: false, error: 'Invalid email or password' };
      const state: AuthState = { user, isAuthenticated: true };
      setAuth(state); saveAuthState(state);
      return { success: true };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    if (data.user) setAuth({ user: mapUser(data.user), isAuthenticated: true });
    return { success: true };
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 700));
      if (findUserByEmail(email)) return { success: false, error: 'An account with this email already exists' };
      const user: User = { id: `u${Date.now()}`, name, email, role: 'Team Member', createdAt: new Date().toISOString().split('T')[0] };
      addUser(user);
      const state: AuthState = { user, isAuthenticated: true };
      setAuth(state); saveAuthState(state);
      return { success: true };
    }
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, role: 'Team Member' } } });
    if (error) return { success: false, error: error.message };
    if (data.user) {
      const mapped = mapUser(data.user);
      if (data.session) setAuth({ user: mapped, isAuthenticated: true });
      void upsertUser(mapped);
    }
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    if (isDemoMode) { clearAuthState(); setAuth({ user: null, isAuthenticated: false }); return; }
    void supabase.auth.signOut();
    setAuth({ user: null, isAuthenticated: false });
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    if (!auth.user) return;
    const updatedUser = { ...auth.user, ...updates };
    setAuth({ user: updatedUser, isAuthenticated: true });
    if (isDemoMode) {
      const state: AuthState = { user: updatedUser, isAuthenticated: true };
      saveAuthState(state);
      const d = getStoredData();
      const idx = d.users.findIndex(u => u.id === updatedUser.id);
      if (idx >= 0) { d.users[idx] = updatedUser; saveData(d); }
      return;
    }
    void supabase.auth.updateUser({ data: { name: updatedUser.name, role: updatedUser.role } });
    void upsertUser(updatedUser);
  }, [auth.user]);

  return (
    <AuthContext.Provider value={{
      user: auth.user,
      isAuthenticated: auth.isAuthenticated,
      initializing,
      login,
      register,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
