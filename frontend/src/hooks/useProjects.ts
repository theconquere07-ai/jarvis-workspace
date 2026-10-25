import { useState, useEffect, useCallback } from 'react';
import { Project } from '../types';
import { api } from '../lib/api';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = (await api.projects.list()) as Project[];
      setProjects(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (initial?: Partial<Project> | string) => {
    const payload =
      typeof initial === 'string'
        ? { name: initial }
        : initial || { name: 'New Project' };
    const data = (await api.projects.create(payload)) as Project;
    setProjects(prev => [data, ...prev]);
    return data;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    // Optimistic update
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    try {
      const data = (await api.projects.update(id, updates)) as Project;
      setProjects(prev => prev.map(p => (p.id === id ? data : p)));
      return data;
    } catch (e) {
      // Revert on failure
      await fetchProjects();
      throw e;
    }
  };

  const deleteProject = async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    try {
      await api.projects.delete(id);
    } catch (e) {
      await fetchProjects();
      throw e;
    }
  };

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
}
