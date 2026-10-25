import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Project,
  ProjectStatus,
  ProjectPriority,
  DevelopmentStage,
  ProjectPurpose,
  OperatingModel,
  RevenueClass,
  PublicationStatus,
  ProjectMilestone,
  ProjectTask,
} from '../../types';
import { api } from '../../lib/api';

interface ProjectDetailProps {
  project: Project;
  onUpdate: (id: string, updates: Partial<Project>) => Promise<Project>;
  onDelete: (id: string) => Promise<void>;
}

type DetailTab = 'general' | 'technical' | 'tasks' | 'commercial' | 'showcase';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: 'Planned',
  active: 'Active',
  in_development: 'In Development',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
};

const STAGE_LABELS: Record<DevelopmentStage, string> = {
  concept: 'Concept / Ideation',
  prototype: 'Prototype / PoC',
  alpha_beta: 'Alpha / Beta',
  production: 'Production / Live',
  maintenance: 'Maintenance',
  deprecated: 'Deprecated',
};

const isUrl = (v: string) => /^(https?:\/\/|www\.)\S+$/i.test(v.trim());

export function ProjectDetail({ project, onUpdate, onDelete }: ProjectDetailProps) {
  const [local, setLocal] = useState<Project>(project);
  const [tab, setTab] = useState<DetailTab>('general');
  const [armDelete, setArmDelete] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Milestones and tasks state
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  useEffect(() => {
    setLocal(project);
    setArmDelete(false);
  }, [project.id]);

  // Load milestones and tasks when switching to the tasks tab or project change
  useEffect(() => {
    if (tab === 'tasks' && project.id) {
      setLoadingTasks(true);
      Promise.all([
        api.milestones.list(project.id),
        api.tasks.list(project.id),
      ])
        .then(([mList, tList]) => {
          setMilestones(mList);
          setTasks(tList);
        })
        .catch((err) => console.warn('Failed loading project tasks:', err))
        .finally(() => setLoadingTasks(false));
    }
  }, [project.id, tab]);

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
    setLocal((prev) => ({ ...prev, [key]: value }));
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

  // Milestone actions
  const handleAddMilestone = async () => {
    if (!newMilestoneTitle.trim()) return;
    try {
      const created = await api.milestones.create({
        project_id: project.id,
        title: newMilestoneTitle.trim(),
        status: 'planned',
      });
      setMilestones((prev) => [...prev, created]);
      setNewMilestoneTitle('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMilestone = async (m: ProjectMilestone) => {
    const nextStatus = m.status === 'completed' ? 'in_progress' : 'completed';
    const completedAt = nextStatus === 'completed' ? new Date().toISOString() : null;
    setMilestones((prev) =>
      prev.map((item) => (item.id === m.id ? { ...item, status: nextStatus, completed_at: completedAt } : item))
    );
    await api.milestones.update(m.id, { status: nextStatus, completed_at: completedAt });
  };

  // Task actions
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const created = await api.tasks.create({
        project_id: project.id,
        title: newTaskTitle.trim(),
        status: 'todo',
        priority: 'medium',
      });
      setTasks((prev) => [...prev, created]);
      setNewTaskTitle('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = async (t: ProjectTask) => {
    const nextStatus = t.status === 'done' ? 'todo' : 'done';
    const completedAt = nextStatus === 'done' ? new Date().toISOString() : null;
    setTasks((prev) =>
      prev.map((item) => (item.id === t.id ? { ...item, status: nextStatus, completed_at: completedAt } : item))
    );
    await api.tasks.update(t.id, { status: nextStatus, completed_at: completedAt });
  };

  return (
    <div className="page" id="pdet">
      <div className="wrap">
        {/* Title & Slug */}
        <input
          className="ttl"
          value={local.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Project name"
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '10.5px' }}>
          <span style={{ color: 'var(--mut)' }}>ID / Slug:</span>
          <input
            value={local.slug || ''}
            onChange={(e) => handleChange('slug', e.target.value)}
            placeholder="slug-name"
            style={{ borderBottom: '1px solid var(--ln2)', padding: '2px 4px', color: 'var(--dim)', width: '180px' }}
          />
          {local.migration_status && (
            <span
              style={{
                fontSize: '9.5px',
                padding: '2px 6px',
                border: '1px solid var(--gold)',
                color: 'var(--gold)',
              }}
            >
              {local.migration_status}
            </span>
          )}
        </div>

        {/* Short Description */}
        <textarea
          className="desc"
          rows={1}
          value={local.description || local.short_desc || ''}
          onChange={(e) => {
            handleChange('description', e.target.value || null);
            handleChange('short_desc', e.target.value || null);
          }}
          placeholder="What is it, in one line"
          onInput={(e) => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = 'auto';
            t.style.height = t.scrollHeight + 'px';
          }}
        />

        {/* Tab Navigation for Detailed Profiles */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--ln2)',
            marginTop: '22px',
            marginBottom: '20px',
            gap: '1px',
          }}
        >
          {(
            [
              ['general', 'General'],
              ['technical', 'Technical Specs'],
              ['tasks', `Tasks (${tasks.filter((t) => t.status !== 'done').length})`],
              ['commercial', 'Commercial & Impact'],
              ['showcase', `Showcase (${local.publication_status || 'draft'})`],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              style={{
                padding: '8px 14px',
                borderBottom: tab === k ? '2px solid var(--tx)' : '2px solid transparent',
                color: tab === k ? 'var(--tx)' : 'var(--dim)',
                background: tab === k ? 'rgba(255,255,255,0.03)' : 'transparent',
                fontWeight: tab === k ? 500 : 300,
                fontSize: '11px',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* TAB 1: GENERAL */}
        {tab === 'general' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Status</span>
                <select
                  className="stsel"
                  style={{ width: '100%', marginTop: '6px' }}
                  value={local.status}
                  onChange={(e) => handleChange('status', e.target.value as ProjectStatus)}
                >
                  {Object.entries(STATUS_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Stage</span>
                <select
                  className="stsel"
                  style={{ width: '100%', marginTop: '6px' }}
                  value={local.development_stage || 'concept'}
                  onChange={(e) => handleChange('development_stage', e.target.value as DevelopmentStage)}
                >
                  {Object.entries(STAGE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Priority</span>
                <select
                  className="stsel"
                  style={{ width: '100%', marginTop: '6px' }}
                  value={local.priority || 'medium'}
                  onChange={(e) => handleChange('priority', e.target.value as ProjectPriority)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Category</span>
                <input
                  type="text"
                  value={local.category || ''}
                  onChange={(e) => handleChange('category', e.target.value || null)}
                  placeholder="e.g. AI / Automation"
                  style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0', marginTop: '4px' }}
                />
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Target Completion</span>
                <input
                  type="date"
                  value={local.target_date || ''}
                  onChange={(e) => handleChange('target_date', e.target.value || null)}
                  style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0', marginTop: '4px', color: 'var(--tx)' }}
                />
              </div>
            </div>

            <h4>Where everything lives</h4>
            {(local.custom_fields || []).map((r, i) => (
              <div className="kv" key={i}>
                <input
                  data-k="k"
                  value={r.k}
                  onChange={(e) => handleUpdateRow(i, 'k', e.target.value)}
                  placeholder="Label"
                />
                <input
                  data-k="v"
                  value={r.v}
                  onChange={(e) => handleUpdateRow(i, 'v', e.target.value)}
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
                  <button type="button" aria-label="Remove row" onClick={() => handleDeleteRow(i)}>
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
              onChange={(e) => handleChange('notes', e.target.value || null)}
              placeholder="Passwords hints, deployment steps, ideas, reminders…"
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = 'auto';
                t.style.height = t.scrollHeight + 'px';
              }}
            />
          </div>
        )}

        {/* TAB 2: TECHNICAL SPECS */}
        {tab === 'technical' && (
          <div>
            <h4>Objectives & Solution</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Problem Statement</span>
                <textarea
                  className="big"
                  style={{ minHeight: '60px' }}
                  value={local.problem_statement || ''}
                  onChange={(e) => handleChange('problem_statement', e.target.value || null)}
                  placeholder="What problem does this project solve?"
                />
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Proposed Solution</span>
                <textarea
                  className="big"
                  style={{ minHeight: '60px' }}
                  value={local.proposed_solution || ''}
                  onChange={(e) => handleChange('proposed_solution', e.target.value || null)}
                  placeholder="How does it resolve the challenge?"
                />
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Architecture Description</span>
                <textarea
                  className="big"
                  style={{ minHeight: '70px' }}
                  value={local.architecture_desc || ''}
                  onChange={(e) => handleChange('architecture_desc', e.target.value || null)}
                  placeholder="System design, component breakdown, pipeline flow…"
                />
              </div>
            </div>

            <h4>Technologies & Frameworks</h4>
            <input
              type="text"
              value={(local.technologies || []).join(', ')}
              onChange={(e) =>
                handleChange(
                  'technologies',
                  e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                )
              }
              placeholder="e.g. React, TypeScript, Node.js, Supabase, Tailwind, Gemini API"
              style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '8px 0', color: 'var(--tx)' }}
            />

            <h4>Repository & Deployments</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Repository URL</span>
                <input
                  type="text"
                  value={local.repo_url || ''}
                  onChange={(e) => handleChange('repo_url', e.target.value || null)}
                  placeholder="https://github.com/..."
                  style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0' }}
                />
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Live Demo URL</span>
                <input
                  type="text"
                  value={local.live_url || ''}
                  onChange={(e) => handleChange('live_url', e.target.value || null)}
                  placeholder="https://..."
                  style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0' }}
                />
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Docs URL</span>
                <input
                  type="text"
                  value={local.docs_url || ''}
                  onChange={(e) => handleChange('docs_url', e.target.value || null)}
                  placeholder="https://..."
                  style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '14px' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Frontend Host</span>
                <input
                  type="text"
                  value={local.frontend_host || ''}
                  onChange={(e) => handleChange('frontend_host', e.target.value || null)}
                  placeholder="e.g. Netlify / Vercel"
                  style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0' }}
                />
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Backend Host</span>
                <input
                  type="text"
                  value={local.backend_host || ''}
                  onChange={(e) => handleChange('backend_host', e.target.value || null)}
                  placeholder="e.g. Render / Cloud Run"
                  style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0' }}
                />
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Database</span>
                <input
                  type="text"
                  value={local.database_info || ''}
                  onChange={(e) => handleChange('database_info', e.target.value || null)}
                  placeholder="e.g. Supabase (PostgreSQL)"
                  style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TASKS & MILESTONES */}
        {tab === 'tasks' && (
          <div>
            <h4>Milestones</h4>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                placeholder="New major milestone…"
                onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone()}
                style={{ flex: 1, borderBottom: '1px solid var(--ln2)', padding: '6px 8px', fontSize: '11px' }}
              />
              <button
                type="button"
                onClick={handleAddMilestone}
                style={{ padding: '6px 12px', border: '1px solid var(--ln2)', color: 'var(--tx)', fontSize: '10.5px' }}
              >
                + Add Milestone
              </button>
            </div>

            {milestones.length === 0 ? (
              <div style={{ color: 'var(--mut)', fontSize: '11px', margin: '8px 0' }}>No milestones recorded yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      border: '1px solid var(--ln)',
                      background: m.status === 'completed' ? 'rgba(255,255,255,0.02)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={m.status === 'completed'}
                      onChange={() => handleToggleMilestone(m)}
                    />
                    <span
                      style={{
                        flex: 1,
                        textDecoration: m.status === 'completed' ? 'line-through' : 'none',
                        color: m.status === 'completed' ? 'var(--mut)' : 'var(--tx)',
                      }}
                    >
                      {m.title}
                    </span>
                    <span style={{ fontSize: '9.5px', color: 'var(--dim)' }}>{m.status}</span>
                  </div>
                ))}
              </div>
            )}

            <h4>Execution Tasks</h4>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add actionable task…"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                style={{ flex: 1, borderBottom: '1px solid var(--ln2)', padding: '6px 8px', fontSize: '11px' }}
              />
              <button
                type="button"
                onClick={handleAddTask}
                style={{ padding: '6px 12px', border: '1px solid var(--ln2)', color: 'var(--tx)', fontSize: '10.5px' }}
              >
                + Add Task
              </button>
            </div>

            {loadingTasks ? (
              <div style={{ color: 'var(--mut)', fontSize: '11px' }}>Loading tasks…</div>
            ) : tasks.length === 0 ? (
              <div style={{ color: 'var(--mut)', fontSize: '11px' }}>No active tasks for this project.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '7px 8px',
                      borderBottom: '1px solid var(--ln)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={t.status === 'done'}
                      onChange={() => handleToggleTask(t)}
                    />
                    <span
                      style={{
                        flex: 1,
                        textDecoration: t.status === 'done' ? 'line-through' : 'none',
                        color: t.status === 'done' ? 'var(--mut)' : 'var(--tx)',
                        fontSize: '11px',
                      }}
                    >
                      {t.title}
                    </span>
                    <span style={{ fontSize: '9.5px', color: 'var(--dim)', textTransform: 'uppercase' }}>
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COMMERCIAL & IMPACT */}
        {tab === 'commercial' && (
          <div>
            <h4>Classification & Financials</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Revenue Class</span>
                <select
                  className="stsel"
                  style={{ width: '100%', marginTop: '6px' }}
                  value={local.revenue_class || 'free'}
                  onChange={(e) => handleChange('revenue_class', e.target.value as RevenueClass)}
                >
                  <option value="free">Free</option>
                  <option value="subscription">Subscription / SaaS</option>
                  <option value="ad_supported">Ad-Supported</option>
                  <option value="service">Service-Based</option>
                  <option value="internal">Internal Tool</option>
                </select>
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Verified Revenue ($)</span>
                <input
                  type="number"
                  value={local.verified_revenue ?? ''}
                  onChange={(e) => handleChange('verified_revenue', e.target.value ? parseFloat(e.target.value) : 0)}
                  placeholder="0.00"
                  style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0', marginTop: '6px' }}
                />
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Verified Expenses ($)</span>
                <input
                  type="number"
                  value={local.verified_expenses ?? ''}
                  onChange={(e) => handleChange('verified_expenses', e.target.value ? parseFloat(e.target.value) : 0)}
                  placeholder="0.00"
                  style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0', marginTop: '6px' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Verified Users / Reach</span>
                <input
                  type="number"
                  value={local.verified_users ?? ''}
                  onChange={(e) => handleChange('verified_users', e.target.value ? parseInt(e.target.value, 10) : 0)}
                  placeholder="e.g. 500"
                  style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0', marginTop: '6px' }}
                />
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Target Audience</span>
                <input
                  type="text"
                  value={local.target_audience || ''}
                  onChange={(e) => handleChange('target_audience', e.target.value || null)}
                  placeholder="e.g. Engineers, 3D Artists, Businesses"
                  style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0', marginTop: '6px' }}
                />
              </div>
            </div>

            <h4>Roadmap & Retrospective</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Challenges & Lessons Learned</span>
                <textarea
                  className="big"
                  style={{ minHeight: '60px' }}
                  value={local.challenges_learned || ''}
                  onChange={(e) => handleChange('challenges_learned', e.target.value || null)}
                  placeholder="What key challenges were encountered and what lessons were derived?"
                />
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Future Roadmap</span>
                <textarea
                  className="big"
                  style={{ minHeight: '60px' }}
                  value={local.future_roadmap || ''}
                  onChange={(e) => handleChange('future_roadmap', e.target.value || null)}
                  placeholder="Next planned phase, feature iterations, scale milestones…"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SHOWCASE & PUBLISHING */}
        {tab === 'showcase' && (
          <div>
            <h4>Public Showcase Status</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Publication Status</span>
                <select
                  className="stsel"
                  style={{ width: '100%', marginTop: '6px' }}
                  value={local.publication_status || 'draft'}
                  onChange={(e) => handleChange('publication_status', e.target.value as PublicationStatus)}
                >
                  <option value="draft">Draft (Private)</option>
                  <option value="published">Published (Visible in Showcase)</option>
                  <option value="private">Private (Workspace Only)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginTop: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!local.featured}
                    onChange={(e) => handleChange('featured', e.target.checked)}
                  />
                  <span style={{ color: local.featured ? 'var(--gold)' : 'var(--tx)', fontWeight: 500 }}>
                    ★ Feature on Showcase Home
                  </span>
                </label>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Cover Image URL</span>
              <input
                type="text"
                value={local.cover_image_url || ''}
                onChange={(e) => handleChange('cover_image_url', e.target.value || null)}
                placeholder="https://..."
                style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0', marginTop: '4px' }}
              />
            </div>

            {local.publication_status === 'published' && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '12px 14px',
                  border: '1px solid var(--tx)',
                  background: 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ color: 'var(--tx)', fontWeight: 500, fontSize: '11px' }}>
                    Live on Public Showcase
                  </div>
                  <div style={{ color: 'var(--dim)', fontSize: '10px' }}>
                    Public path: #{local.slug || local.id}
                  </div>
                </div>
                <a
                  href={`#p/${local.slug || local.id}`}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid var(--ln2)',
                    color: 'var(--tx)',
                    textDecoration: 'none',
                    fontSize: '10.5px',
                  }}
                >
                  Preview Public Page ↗
                </a>
              </div>
            )}
          </div>
        )}

        {/* Delete Project action */}
        <button
          className={`danger ${armDelete ? 'arm' : ''}`}
          type="button"
          onClick={handleDeleteProject}
          style={{ marginTop: '48px', display: 'block' }}
        >
          {armDelete ? 'Click again to permanently delete' : 'Delete project'}
        </button>
      </div>
    </div>
  );
}
