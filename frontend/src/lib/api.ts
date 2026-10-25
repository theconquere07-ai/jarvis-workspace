import { supabase } from './supabase';

const BASE = import.meta.env.VITE_API_URL;

async function getHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE || BASE === 'http://localhost:3001') {
    throw new Error('No remote backend configured');
  }
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

async function withFallback<T>(apiFn: () => Promise<T>, supabaseFn: () => Promise<T>): Promise<T> {
  if (BASE && BASE !== 'http://localhost:3001') {
    try {
      return await apiFn();
    } catch (err) {
      console.warn('Backend API request failed, falling back to direct Supabase:', err);
    }
  }
  return await supabaseFn();
}

export const api = {
  // Projects
  projects: {
    list: () =>
      withFallback(
        () => request<unknown[]>('/api/projects'),
        async () => {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw new Error(error.message);
          return data || [];
        }
      ),

    create: (body: object) =>
      withFallback(
        () => request<unknown>('/api/projects', { method: 'POST', body: JSON.stringify(body) }),
        async () => {
          const userId = await getUserId();
          const { data, error } = await supabase
            .from('projects')
            .insert({ ...body, user_id: userId })
            .select()
            .single();
          if (error) throw new Error(error.message);
          return data;
        }
      ),

    get: (id: string) =>
      withFallback(
        () => request<unknown>(`/api/projects/${id}`),
        async () => {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();
          if (error) throw new Error(error.message);
          return data;
        }
      ),

    update: (id: string, body: object) =>
      withFallback(
        () => request<unknown>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
        async () => {
          const { data, error } = await supabase
            .from('projects')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
          if (error) throw new Error(error.message);
          return data;
        }
      ),

    delete: (id: string) =>
      withFallback(
        () => request<void>(`/api/projects/${id}`, { method: 'DELETE' }),
        async () => {
          const { error } = await supabase.from('projects').delete().eq('id', id);
          if (error) throw new Error(error.message);
        }
      ),
  },

  // Notes
  notes: {
    list: () =>
      withFallback(
        () => request<unknown[]>('/api/notes'),
        async () => {
          const { data, error } = await supabase
            .from('notes')
            .select('*')
            .order('created_at', { ascending: true });
          if (error) throw new Error(error.message);
          return data || [];
        }
      ),

    create: (body: object) =>
      withFallback(
        () => request<unknown>('/api/notes', { method: 'POST', body: JSON.stringify(body) }),
        async () => {
          const userId = await getUserId();
          const { data, error } = await supabase
            .from('notes')
            .insert({ ...body, user_id: userId })
            .select()
            .single();
          if (error) throw new Error(error.message);
          return data;
        }
      ),

    update: (id: string, body: object) =>
      withFallback(
        () => request<unknown>(`/api/notes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
        async () => {
          const { data, error } = await supabase
            .from('notes')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
          if (error) throw new Error(error.message);
          return data;
        }
      ),

    delete: (id: string) =>
      withFallback(
        () => request<void>(`/api/notes/${id}`, { method: 'DELETE' }),
        async () => {
          const { error } = await supabase.from('notes').delete().eq('id', id);
          if (error) throw new Error(error.message);
        }
      ),
  },

  // Analyzer
  analyzer: {
    listTopics: () =>
      withFallback(
        () => request<unknown[]>('/api/analyzer/topics'),
        async () => {
          const { data, error } = await supabase
            .from('analyzer_topics')
            .select('*, analyzer_sections(*)')
            .order('created_at', { ascending: false });
          if (error) throw new Error(error.message);
          return data || [];
        }
      ),

    createTopic: (body: object) =>
      withFallback(
        () => request<unknown>('/api/analyzer/topics', { method: 'POST', body: JSON.stringify(body) }),
        async () => {
          const userId = await getUserId();
          const { data, error } = await supabase
            .from('analyzer_topics')
            .insert({ ...body, user_id: userId })
            .select('*, analyzer_sections(*)')
            .single();
          if (error) throw new Error(error.message);
          return data;
        }
      ),

    updateTopic: (id: string, body: object) =>
      withFallback(
        () => request<unknown>(`/api/analyzer/topics/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
        async () => {
          const { data, error } = await supabase
            .from('analyzer_topics')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('*, analyzer_sections(*)')
            .single();
          if (error) throw new Error(error.message);
          return data;
        }
      ),

    deleteTopic: (id: string) =>
      withFallback(
        () => request<void>(`/api/analyzer/topics/${id}`, { method: 'DELETE' }),
        async () => {
          const { error } = await supabase.from('analyzer_topics').delete().eq('id', id);
          if (error) throw new Error(error.message);
        }
      ),

    upsertSection: (topicId: string, sectionKey: string, body: object) =>
      withFallback(
        () =>
          request<unknown>(`/api/analyzer/topics/${topicId}/sections/${sectionKey}`, {
            method: 'PUT',
            body: JSON.stringify(body),
          }),
        async () => {
          const userId = await getUserId();
          const { data, error } = await supabase
            .from('analyzer_sections')
            .upsert(
              {
                topic_id: topicId,
                section_key: sectionKey,
                user_id: userId,
                ...body,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'topic_id,section_key' }
            )
            .select()
            .single();
          if (error) throw new Error(error.message);
          return data;
        }
      ),
  },

  // Timer
  timer: {
    listSessions: (range?: 'today' | '7d' | 'all') =>
      withFallback(
        () => request<unknown[]>(`/api/timer/sessions${range ? `?range=${range}` : ''}`),
        async () => {
          let q = supabase
            .from('work_sessions')
            .select('*')
            .order('started_at', { ascending: false });
          const now = new Date();
          if (range === 'today') {
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            q = q.gte('started_at', startOfDay);
          } else if (range === '7d') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
            q = q.gte('started_at', sevenDaysAgo);
          }
          const { data, error } = await q;
          if (error) throw new Error(error.message);
          return data || [];
        }
      ),

    createSession: (body: object) =>
      withFallback(
        () => request<unknown>('/api/timer/sessions', { method: 'POST', body: JSON.stringify(body) }),
        async () => {
          const userId = await getUserId();
          const { data, error } = await supabase
            .from('work_sessions')
            .insert({ ...body, user_id: userId })
            .select()
            .single();
          if (error) throw new Error(error.message);
          return data;
        }
      ),

    endSession: (id: string, body: object) =>
      withFallback(
        () => request<unknown>(`/api/timer/sessions/${id}/end`, { method: 'PATCH', body: JSON.stringify(body) }),
        async () => {
          const { data, error } = await supabase
            .from('work_sessions')
            .update(body)
            .eq('id', id)
            .select()
            .single();
          if (error) throw new Error(error.message);
          return data;
        }
      ),
  },
};
