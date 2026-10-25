import { useState, useEffect, useRef, useCallback } from 'react';
import { WorkSession, ActiveTimer } from '../types';
import { api } from '../lib/api';

const LS_KEY = 'jarvis_active_timer';

function loadTimer(): ActiveTimer | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveTimer;
  } catch {
    return null;
  }
}

function saveTimer(t: ActiveTimer | null) {
  if (t) {
    localStorage.setItem(LS_KEY, JSON.stringify(t));
  } else {
    localStorage.removeItem(LS_KEY);
  }
}

export function useTimer() {
  const [timer, setTimer] = useState<ActiveTimer>(() => {
    const saved = loadTimer();
    if (saved) {
      return saved;
    }
    return { task: '', acc: 0, at: 0, run: false, s: 0 };
  });
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [recovered, setRecovered] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detect recovery
  useEffect(() => {
    const saved = loadTimer();
    if (saved && saved.run) {
      setRecovered(true);
      setTimeout(() => setRecovered(false), 5000);
    }
  }, []);

  // Tick
  useEffect(() => {
    if (timer.run) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => {
          const now = Date.now();
          const elapsed = now - prev.at;
          const updated = { ...prev, acc: prev.acc + elapsed, at: now };
          saveTimer(updated);
          return updated;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timer.run]);

  const fetchSessions = useCallback(async (range: 'today' | '7d' | 'all' = 'today') => {
    try {
      const data = await api.timer.listSessions(range) as WorkSession[];
      setSessions(data);
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }
  }, []);

  useEffect(() => { fetchSessions('today'); }, [fetchSessions]);

  const start = async (task: string) => {
    const now = Date.now();
    const t: ActiveTimer = { task, acc: 0, at: now, run: true, s: now };
    setTimer(t);
    saveTimer(t);
    try {
      const session = await api.timer.createSession({
        task_name: task || 'Untitled work',
        started_at: new Date(now).toISOString(),
      }) as WorkSession;
      setActiveSessionId(session.id);
    } catch (e) {
      console.error('Failed to create session:', e);
    }
  };

  const pause = () => {
    setTimer(prev => {
      const updated = { ...prev, run: false, acc: prev.acc + (Date.now() - prev.at) };
      saveTimer(updated);
      return updated;
    });
  };

  const resume = () => {
    setTimer(prev => {
      const updated = { ...prev, run: true, at: Date.now() };
      saveTimer(updated);
      return updated;
    });
  };

  const stop = async () => {
    const now = Date.now();
    const totalMs = timer.acc + (timer.run ? (now - timer.at) : 0);
    const task = timer.task;

    setTimer({ task: '', acc: 0, at: 0, run: false, s: 0 });
    saveTimer(null);

    try {
      if (activeSessionId) {
        const updated = await api.timer.endSession(activeSessionId, {
          ended_at: new Date(now).toISOString(),
          duration_ms: totalMs,
        }) as WorkSession;
        setSessions(prev => [updated, ...prev]);
        setActiveSessionId(null);
      } else {
        // Create a complete session record
        const session = await api.timer.createSession({
          task_name: task || 'Untitled work',
          started_at: new Date(now - totalMs).toISOString(),
          ended_at: new Date(now).toISOString(),
          duration_ms: totalMs,
        }) as WorkSession;
        setSessions(prev => [session, ...prev]);
      }
    } catch (e) {
      console.error('Failed to end session:', e);
    }
  };

  const elapsed = timer.run
    ? timer.acc + (Date.now() - timer.at)
    : timer.acc;

  return { timer, elapsed, sessions, recovered, start, pause, resume, stop, fetchSessions };
}
