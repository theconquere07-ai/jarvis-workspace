import { Project } from '../../types';

interface ProjectListProps {
  projects: Project[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  loading: boolean;
}

export function ProjectList({
  projects,
  selectedId,
  onSelect,
  onNew,
  loading,
}: ProjectListProps) {
  return (
    <div className="side" id="plist">
      {loading && projects.length === 0 && (
        <div style={{ padding: '14px 18px', color: 'var(--mut)' }}>Loading…</div>
      )}
      {projects.map(p => (
        <button
          key={p.id}
          className={`li ${p.id === selectedId ? 'on' : ''}`}
          onClick={() => onSelect(p.id)}
        >
          <span className={`dot ${p.status}`} />
          <b>{p.name || 'Untitled'}</b>
        </button>
      ))}
      <button className="li add" onClick={onNew}>
        + New project
      </button>
    </div>
  );
}
