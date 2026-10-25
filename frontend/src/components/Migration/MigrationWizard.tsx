import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface MigrationData {
  projects: unknown[];
  items: unknown[];
  log: unknown[];
  sessions: unknown[];
}

interface MigrationWizardProps {
  onDone: () => void;
}

function mapStatus(old: string): string {
  const map: Record<string, string> = {
    live: 'active',
    build: 'in_development',
    idea: 'planned',
    pause: 'paused',
  };
  return map[old] || old;
}

const LS_KEY = 'migrationDone';

export function MigrationWizard({ onDone }: MigrationWizardProps) {
  const [data, setData] = useState<MigrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    readIndexedDB();
  }, []);

  const readIndexedDB = async () => {
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open('workspace1');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        req.onupgradeneeded = () => reject(new Error('No data found'));
      });

      const tx = db.transaction('k', 'readonly');
      const store = tx.objectStore('k');
      const val = await new Promise<unknown>((resolve, reject) => {
        const req = store.get('s');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (!val) {
        onDone(); // No data to migrate
        return;
      }

      const parsed = val as { projects?: unknown[]; items?: unknown[]; log?: unknown[]; sessions?: unknown[] };
      setData({
        projects: parsed.projects || [],
        items: parsed.items || [],
        log: parsed.log || [],
        sessions: parsed.sessions || [],
      });
    } catch {
      // No IndexedDB data — skip wizard
      localStorage.setItem(LS_KEY, 'true');
      onDone();
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!data) return;
    setImporting(true);
    setError(null);

    try {
      // Import projects
      for (const p of data.projects as Array<{ name?: string; d?: string; st?: string; n?: string; rows?: Array<{ k: string; v: string }> }>) {
        await api.projects.create({
          name: p.name || 'Untitled',
          description: p.d || null,
          status: mapStatus(p.st || 'planned'),
          notes: p.n || null,
          custom_fields: p.rows || [],
        });
      }

      // Import notes (prototype item: { id, t: 'note'|'img'|'doc', s, u, n, sz, x, y, w, h, z })
      for (const item of data.items as Array<{ t?: string; s?: string; u?: string; n?: string; sz?: number; x?: number; y?: number; w?: number; h?: number; z?: number }>) {
        const itemType = item.t === 'img' ? 'img' : item.t === 'doc' ? 'doc' : 'note';
        await api.notes.create({
          type: itemType,
          content: itemType === 'note' ? (item.s || null) : null,
          x: item.x || 0,
          y: item.y || 0,
          w: item.w || 260,
          h: item.h || null,
          z_index: item.z || 1,
          file_url: item.u || null,
          file_name: item.n || null,
          file_size: item.sz || null,
        });
      }

      // Import analyzer topics (prototype sessions: array of { id, t: string, b: [{ id, k: string, s: string }] })
      for (const s of data.sessions as Array<{ t?: string; b?: Array<{ k: string; s: string }> }>) {
        const topic = await api.analyzer.createTopic({ title: s.t || 'Untitled topic' }) as { id: string };
        if (s.b && Array.isArray(s.b)) {
          for (let i = 0; i < s.b.length; i++) {
            const blk = s.b[i];
            if (blk.k) {
              await api.analyzer.upsertSection(topic.id, blk.k, { content: blk.s || '', sort_order: i });
            }
          }
        }
      }

      // Import work sessions (prototype log: array of { id, task: string, s: number, d: number })
      for (const l of data.log as Array<{ task?: string; s?: number; d?: number }>) {
        if (l.s) {
          await api.timer.createSession({
            task_name: l.task || 'Untitled work',
            started_at: new Date(l.s).toISOString(),
            ended_at: l.d ? new Date(l.s + l.d).toISOString() : null,
            duration_ms: l.d || null,
          });
        }
      }

      localStorage.setItem(LS_KEY, 'true');
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(LS_KEY, 'true');
    onDone();
  };

  if (loading) return null;
  if (!data) return null;

  return (
    <div className="migration-overlay">
      <div className="migration-box">
        <div className="migration-header">
          <div className="migration-title">Local data found</div>
          <div className="migration-sub">Import your existing workspace data to the cloud?</div>
        </div>

        <div className="migration-body">
          <div className="migration-stat">
            <span className="migration-stat-label">Projects</span>
            <span className="migration-stat-val">{(data.projects as unknown[]).length}</span>
          </div>
          <div className="migration-stat">
            <span className="migration-stat-label">Note cards</span>
            <span className="migration-stat-val">{(data.items as unknown[]).length}</span>
          </div>
          <div className="migration-stat">
            <span className="migration-stat-label">Work sessions</span>
            <span className="migration-stat-val">{(data.sessions as unknown[]).length}</span>
          </div>
          {error && (
            <div className="auth-error" style={{ marginTop: 12 }}>{error}</div>
          )}
        </div>

        <div className="migration-actions">
          <button className="migration-btn" onClick={handleSkip} disabled={importing}>Skip</button>
          <button className="migration-btn primary" onClick={handleImport} disabled={importing}>
            {importing ? 'Importing…' : 'Import data'}
          </button>
        </div>
      </div>
    </div>
  );
}
