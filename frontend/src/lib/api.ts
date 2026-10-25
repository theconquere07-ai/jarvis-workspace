import { supabase } from './supabase';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function getHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await getHeaders();
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { ...headers, ...(init?.headers ?? {}) } });
  if (res.status === 401) {
    await supabase.auth.signOut();
    window.location.reload();
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Projects
  projects: {
    list: () => request<unknown[]>('/api/projects'),
    create: (body: object) => request<unknown>('/api/projects', { method: 'POST', body: JSON.stringify(body) }),
    get: (id: string) => request<unknown>(`/api/projects/${id}`),
    update: (id: string, body: object) => request<unknown>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/api/projects/${id}`, { method: 'DELETE' }),
  },

  // Notes
  notes: {
    list: () => request<unknown[]>('/api/notes'),
    create: (body: object) => request<unknown>('/api/notes', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: object) => request<unknown>(`/api/notes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/api/notes/${id}`, { method: 'DELETE' }),
  },

  // Analyzer
  analyzer: {
    listTopics: () => request<unknown[]>('/api/analyzer/topics'),
    createTopic: (body: object) => request<unknown>('/api/analyzer/topics', { method: 'POST', body: JSON.stringify(body) }),
    updateTopic: (id: string, body: object) => request<unknown>(`/api/analyzer/topics/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    deleteTopic: (id: string) => request<void>(`/api/analyzer/topics/${id}`, { method: 'DELETE' }),
    upsertSection: (topicId: string, sectionKey: string, body: object) =>
      request<unknown>(`/api/analyzer/topics/${topicId}/sections/${sectionKey}`, { method: 'PUT', body: JSON.stringify(body) }),
  },

  // Timer
  timer: {
    listSessions: (range?: 'today' | '7d' | 'all') =>
      request<unknown[]>(`/api/timer/sessions${range ? `?range=${range}` : ''}`),
    createSession: (body: object) => request<unknown>('/api/timer/sessions', { method: 'POST', body: JSON.stringify(body) }),
    endSession: (id: string, body: object) => request<unknown>(`/api/timer/sessions/${id}/end`, { method: 'PATCH', body: JSON.stringify(body) }),
  },
};
