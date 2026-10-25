import { useState, useEffect, useRef, useCallback } from 'react';
import { Project, ProjectStatus } from '../../types';

interface ProjectDetailProps {
  project: Project;
  onUpdate: (id: string, updates: Partial<Project>) => Promise<Project>;
  onDelete: (id: string) => Promise<void>;
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: 'Planned',
  active: 'Active',
  in_development: 'In Development',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
};

const isUrl = (v: string) => /^(https?:\/\/|www\.)\S+$/i.test(v.trim());

export function ProjectDetail({ project, onUpdate, onDelete }: ProjectDetailProps) {
  const [local, setLocal] = useState<Project>(project);
  const [armDelete, setArmDelete] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocal(project);
    setArmDelete(false);
  }, [project.id]);

  const save = useCallback(
    (updates: Partial<Project>) => {
      onUpdate(project.id, updates);
    },
    [project.id, onUpdate]
  );

  const debouncedSave = useCallback(
    (updates: Partial<Project>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => save(updates), 300);
    },
    [save]
  );

  const handleChange = <K extends keyof Project>(key: K, value: Project[K]) => {
    setLocal(prev => ({ ...prev, [key]: value }));
    debouncedSave({ [key]: value });
  };

  const handleAddRow = () => {
    const rows = [...(local.custom_fields || []), { k: '', v: '' }];
    handleChange('custom_fields', rows);
  };

  const handleUpdateRow = (index: number, field: 'k' | 'v', val: string) => {
    const rows = (local.custom_fields || []).map((r, i) =>
      i === index ? { ...r, [field]: val } : r
    );
    handleChange('custom_fields', rows);
  };

  const handleDeleteRow = (index: number) => {
    const rows = (local.custom_fields || []).filter((_, i) => i !== index);
    handleChange('custom_fields', rows);
  };

  const handleCopy = async (index: number, val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedIdx(index);
      setTimeout(() => setCopiedIdx(null), 1200);
    } catch {
      // fallback
    }
  };

  const handleOpen = (val: string) => {
    let u = val.trim();
    if (!/^https?:/i.test(u)) u = 'https://' + u;
    window.open(u, '_blank', 'noopener');
  };

  const handleDeleteProject = async () => {
    if (!armDelete) {
      setArmDelete(true);
      setTimeout(() => setArmDelete(false), 2500);
    } else {
      await onDelete(project.id);
    }
  };

  return (
    <div className="page" id="pdet">
      <div className="wrap">
        <input
          className="ttl"
          value={local.name}
          onChange={e => handleChange('name', e.target.value)}
          placeholder="Project name"
        />

        <textarea
          className="desc"
          rows={1}
          value={local.description || ''}
          onChange={e => handleChange('description', e.target.value || null)}
          placeholder="What is it, in one line"
          onInput={e => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = 'auto';
            t.style.height = t.scrollHeight + 'px';
          }}
        />

        <select
          className="stsel"
          value={local.status}
          onChange={e => handleChange('status', e.target.value as ProjectStatus)}
        >
          {Object.entries(STATUS_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>

        <h4>Where everything lives</h4>

        {(local.custom_fields || []).map((r, i) => (
          <div className="kv" key={i}>
            <input
              data-k="k"
              value={r.k}
              onChange={e => handleUpdateRow(i, 'k', e.target.value)}
              placeholder="Label"
            />
            <input
              data-k="v"
              value={r.v}
              onChange={e => handleUpdateRow(i, 'v', e.target.value)}
              placeholder="URL, account, id…"
            />
            <span className="ac">
              {isUrl(r.v) && (
                <button type="button" onClick={() => handleOpen(r.v)}>
                  Open
                </button>
              )}
              <button type="button" onClick={() => handleCopy(i, r.v)}>
                {copiedIdx === i ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                aria-label="Remove row"
                onClick={() => handleDeleteRow(i)}
              >
                ×
              </button>
            </span>
          </div>
        ))}

        <button className="ghost" type="button" onClick={handleAddRow}>
          + Add field
        </button>

        <h4>Notes</h4>

        <textarea
          className="big"
          value={local.notes || ''}
          onChange={e => handleChange('notes', e.target.value || null)}
          placeholder="Passwords hints, which Gmail, deploy steps, anything you forget…"
          onInput={e => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = 'auto';
            t.style.height = t.scrollHeight + 'px';
          }}
        />

        <button
          className={`danger ${armDelete ? 'arm' : ''}`}
          type="button"
          onClick={handleDeleteProject}
        >
          {armDelete ? 'Click again to delete' : 'Delete project'}
        </button>
      </div>
    </div>
  );
}
