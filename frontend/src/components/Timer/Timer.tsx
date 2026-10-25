import { useState, useEffect, useMemo, useRef } from 'react';
import { useTimer } from '../../hooks/useTimer';
import { WorkSession } from '../../types';

interface TimerProps {
  onClose: () => void;
  projects?: Array<{ name: string }>;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function hms(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

function dur(ms: number): string {
  const m = Math.round(ms / 60000);
  const h = Math.floor(m / 60);
  if (h) return `${h}h ${pad(m % 60)}m`;
  if (m) return `${m}m`;
  return `${Math.round(ms / 1000)}s`;
}

type Range = 'today' | 'week' | 'all';

export function Timer({ onClose, projects = [] }: TimerProps) {
  const { timer, sessions, start, pause, resume, stop, fetchSessions } = useTimer();
  const [taskInput, setTaskInput] = useState(timer.task || '');
  const [rg, setRg] = useState<Range>('today');
  const [armClear, setArmClear] = useState(false);
  const [, setTick] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);

  // Tick every second when running
  useEffect(() => {
    if (!timer.run) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [timer.run]);

  useEffect(() => {
    fetchSessions(rg === 'today' ? 'today' : rg === 'week' ? '7d' : undefined);
  }, [rg, fetchSessions]);

  useEffect(() => {
    if (timer.task) setTaskInput(timer.task);
  }, [timer.task]);

  // Click outside and escape handling
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('#tm') || target?.closest('.tm')) return;
      if (popupRef.current && !popupRef.current.contains(target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const elapsed = timer.acc + (timer.run ? Date.now() - timer.at : 0);

  const handleStartOrToggle = () => {
    if (!timer.s) {
      start(taskInput.trim() || 'Untitled work');
    } else if (timer.run) {
      pause();
    } else {
      resume();
    }
  };

  const handleStop = async () => {
    if (!timer.s) return;
    await stop();
    setTaskInput('');
  };

  // Group sessions by task
  const { rows, totalMs, maxMs } = useMemo(() => {
    const map: Record<string, number> = {};
    const d0 = new Date();
    d0.setHours(0, 0, 0, 0);
    const limit = rg === 'today' ? d0.getTime() : rg === 'week' ? d0.getTime() - 6 * 86400000 : 0;

    sessions.forEach((s: WorkSession) => {
      const startTime = new Date(s.started_at).getTime();
      if (startTime >= limit && s.duration_ms) {
        map[s.task_name] = (map[s.task_name] || 0) + s.duration_ms;
      }
    });

    if (timer.s && timer.s >= limit) {
      const curTask = timer.task || 'Untitled work';
      map[curTask] = (map[curTask] || 0) + elapsed;
    }

    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((acc, [, val]) => acc + val, 0);
    const max = sorted[0] ? sorted[0][1] : 1;
    return { rows: sorted, totalMs: total, maxMs: max };
  }, [sessions, timer, elapsed, rg]);

  const taskOptions = useMemo(() => {
    const names = new Set<string>();
    projects.forEach(p => names.add(p.name));
    sessions.forEach((s: WorkSession) => names.add(s.task_name));
    return Array.from(names).filter(Boolean);
  }, [projects, sessions]);

  return (
    <div id="tp" ref={popupRef}>
      <div className="tph">What are you working on?</div>
      <input
        id="tn"
        placeholder="Project or task name"
        list="tl"
        autoComplete="off"
        value={taskInput}
        onChange={e => setTaskInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleStartOrToggle();
        }}
      />
      <datalist id="tl">
        {taskOptions.map(t => (
          <option key={t} value={t} />
        ))}
      </datalist>

      <div className="tpr">
        <button id="ts" onClick={handleStartOrToggle}>
          {!timer.s ? 'Start' : timer.run ? 'Pause' : 'Resume'}
        </button>
        <button id="tx" disabled={!timer.s} onClick={handleStop}>
          Stop and save
        </button>
      </div>

      <div className="tpr2">
        <span id="tr">
          <button className={rg === 'today' ? 'on' : ''} onClick={() => setRg('today')}>
            Today
          </button>
          <button className={rg === 'week' ? 'on' : ''} onClick={() => setRg('week')}>
            7 days
          </button>
          <button className={rg === 'all' ? 'on' : ''} onClick={() => setRg('all')}>
            All time
          </button>
        </span>
        <b id="tsum">{dur(totalMs)}</b>
      </div>

      <div id="tlog">
        {rows.length > 0 ? (
          rows.map(([task, durVal]) => (
            <div key={task} className="lr">
              <i style={{ width: `${(durVal / maxMs) * 100}%` }} />
              <span>{task}</span>
              <b>{dur(durVal)}</b>
            </div>
          ))
        ) : (
          <p className="emp">Nothing logged yet. Name the work and press Start.</p>
        )}
      </div>

      <button
        id="tc"
        className={armClear ? 'arm' : ''}
        onClick={() => {
          if (!armClear) {
            setArmClear(true);
            setTimeout(() => setArmClear(false), 2500);
          } else {
            setArmClear(false);
          }
        }}
      >
        {armClear ? 'Click again to clear' : 'Clear log'}
      </button>
    </div>
  );
}
