import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppData, Project, Task, TeamMember, Activity } from '../types';
import { getStoredData, saveData } from '../utils/storage';
import { isDemoMode } from '../lib/supabase';
import * as api from '../lib/api';
import { useAuth } from './AuthContext';

interface DataContextType {
  data: AppData;
  loading: boolean;
  refreshData: () => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addActivity: (activity: Activity) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);
const EMPTY: AppData = { users: [], projects: [], tasks: [], teamMembers: [], activities: [] };

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  // Demo mode starts from localStorage (instant); live mode starts empty and fetches after auth.
  const [data, setData] = useState<AppData>(() => (isDemoMode ? getStoredData() : EMPTY));
  const [loading, setLoading] = useState<boolean>(!isDemoMode);

  // Optimistic local update; persists to localStorage in demo mode.
  const commit = useCallback((updater: (prev: AppData) => AppData) => {
    setData(prev => {
      const next = updater(prev);
      if (isDemoMode) saveData(next);
      return next;
    });
  }, []);

  const refreshData = useCallback(() => {
    if (isDemoMode) { setData(getStoredData()); return; }
    setLoading(true);
    api.fetchAll().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isDemoMode) { setData(getStoredData()); return; }
    // Live: only fetch once authenticated (RLS requires a signed-in user), and
    // re-run on login/logout so the data and realtime channel track the session.
    if (!isAuthenticated) { setData(EMPTY); setLoading(false); return; }
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        await api.seedIfEmpty();
        const d = await api.fetchAll();
        if (mounted) { setData(d); setLoading(false); }
      } catch {
        if (mounted) setLoading(false);
      }
    })();
    const channel = api.subscribeRealtime(() => {
      api.fetchAll().then(d => { if (mounted) setData(d); }).catch(() => {});
    });
    return () => { mounted = false; channel?.unsubscribe(); };
  }, [isAuthenticated]);

  const addProject = useCallback((project: Project) => {
    commit(prev => ({ ...prev, projects: [...prev.projects, project] }));
    if (!isDemoMode) void api.insertProject(project);
  }, [commit]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    commit(prev => ({ ...prev, projects: prev.projects.map(p => (p.id === id ? { ...p, ...updates } : p)) }));
    if (!isDemoMode) void api.updateProjectRow(id, updates);
  }, [commit]);

  const deleteProject = useCallback((id: string) => {
    commit(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id),
      tasks: prev.tasks.filter(t => t.projectId !== id),
    }));
    if (!isDemoMode) void api.deleteProjectRow(id); // tasks cascade via FK
  }, [commit]);

  const addTask = useCallback((task: Task) => {
    commit(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
    if (!isDemoMode) void api.insertTask(task);
  }, [commit]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    commit(prev => ({ ...prev, tasks: prev.tasks.map(t => (t.id === id ? { ...t, ...updates } : t)) }));
    if (!isDemoMode) void api.updateTaskRow(id, updates);
  }, [commit]);

  const deleteTask = useCallback((id: string) => {
    commit(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
    if (!isDemoMode) void api.deleteTaskRow(id);
  }, [commit]);

  const addActivity = useCallback((activity: Activity) => {
    commit(prev => ({ ...prev, activities: [activity, ...prev.activities].slice(0, 50) }));
    if (!isDemoMode) void api.insertActivity(activity);
  }, [commit]);

  const updateTeamMember = useCallback((id: string, updates: Partial<TeamMember>) => {
    commit(prev => ({ ...prev, teamMembers: prev.teamMembers.map(m => (m.id === id ? { ...m, ...updates } : m)) }));
    if (!isDemoMode) void api.updateTeamMemberRow(id, updates);
  }, [commit]);

  return (
    <DataContext.Provider value={{
      data,
      loading,
      refreshData,
      addProject,
      updateProject,
      deleteProject,
      addTask,
      updateTask,
      deleteTask,
      addActivity,
      updateTeamMember,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
