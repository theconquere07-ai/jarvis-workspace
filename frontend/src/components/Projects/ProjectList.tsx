import { useState, useMemo } from 'react';
import { Project, ProjectStatus, ProjectPurpose, OperatingModel, RevenueClass } from '../../types';

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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [purposeFilter, setPurposeFilter] = useState<string>('all');
  const [revenueFilter, setRevenueFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (purposeFilter !== 'all' && !(p.project_purposes || []).includes(purposeFilter as ProjectPurpose)) return false;
      if (revenueFilter !== 'all' && p.revenue_class !== revenueFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const inName = (p.name || '').toLowerCase().includes(q);
        const inDesc = (p.description || p.short_desc || '').toLowerCase().includes(q);
        const inTags = (p.tags || []).some((t) => t.toLowerCase().includes(q));
        const inTech = (p.technologies || []).some((t) => t.toLowerCase().includes(q));
        if (!inName && !inDesc && !inTags && !inTech) return false;
      }
      return true;
    });
  }, [projects, search, statusFilter, purposeFilter, revenueFilter]);

  return (
    <div className="side" id="plist" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search and filter header */}
      <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--ln)', flex: 'none' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter projects, tags, tech…"
          style={{
            width: '100%',
            padding: '6px 8px',
            fontSize: '10.5px',
            border: '1px solid var(--ln2)',
            background: 'rgba(0,0,0,0.2)',
            color: 'var(--tx)',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          <span style={{ fontSize: '9.5px', color: 'var(--mut)' }}>
            {filtered.length} of {projects.length}
          </span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{ fontSize: '9.5px', color: showFilters ? 'var(--gold)' : 'var(--dim)' }}
          >
            {showFilters ? 'Hide filters ▲' : 'Filters ▼'}
          </button>
        </div>

        {showFilters && (
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '9.5px' }}>
            <div>
              <span style={{ color: 'var(--mut)', display: 'block', marginBottom: '2px' }}>Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '100%', padding: '3px 4px', border: '1px solid var(--ln2)', background: 'var(--bg)', color: 'var(--tx)', fontSize: '9.5px' }}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="in_development">In Development</option>
                <option value="completed">Completed</option>
                <option value="planned">Planned</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <span style={{ color: 'var(--mut)', display: 'block', marginBottom: '2px' }}>Purpose</span>
              <select
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value)}
                style={{ width: '100%', padding: '3px 4px', border: '1px solid var(--ln2)', background: 'var(--bg)', color: 'var(--tx)', fontSize: '9.5px' }}
              >
                <option value="all">All purposes</option>
                <option value="personal_growth">Personal Growth</option>
                <option value="client_work">Client Work</option>
                <option value="commercial_saas">Commercial / SaaS</option>
                <option value="open_source">Open Source</option>
                <option value="research">Research</option>
                <option value="content_creation">Content Creation</option>
              </select>
            </div>
            <div>
              <span style={{ color: 'var(--mut)', display: 'block', marginBottom: '2px' }}>Revenue Class</span>
              <select
                value={revenueFilter}
                onChange={(e) => setRevenueFilter(e.target.value)}
                style={{ width: '100%', padding: '3px 4px', border: '1px solid var(--ln2)', background: 'var(--bg)', color: 'var(--tx)', fontSize: '9.5px' }}
              >
                <option value="all">All revenue models</option>
                <option value="free">Free</option>
                <option value="subscription">Subscription / SaaS</option>
                <option value="ad_supported">Ad-Supported</option>
                <option value="service">Service-Based</option>
                <option value="internal">Internal Tool</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Project list items */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && projects.length === 0 && (
          <div style={{ padding: '14px 18px', color: 'var(--mut)' }}>Loading inventory…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: '14px 18px', color: 'var(--mut)', fontSize: '10.5px' }}>
            No matching projects found
          </div>
        )}
        {filtered.map((p) => (
          <button
            key={p.id}
            className={`li ${p.id === selectedId ? 'on' : ''}`}
            onClick={() => onSelect(p.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span className={`dot ${p.status}`} />
            <b style={{ flex: 1 }}>{p.name || 'Untitled'}</b>
            {p.featured && (
              <span title="Featured in Showcase" style={{ color: 'var(--gold)', fontSize: '10px' }}>
                ★
              </span>
            )}
            {p.publication_status === 'published' && (
              <span
                title="Publicly Published"
                style={{
                  fontSize: '8.5px',
                  padding: '1px 4px',
                  border: '1px solid var(--tx)',
                  color: 'var(--tx)',
                  borderRadius: '2px',
                }}
              >
                PUB
              </span>
            )}
          </button>
        ))}
      </div>

      <button className="li add" onClick={onNew} style={{ flex: 'none', borderTop: '1px solid var(--ln)' }}>
        + New project
      </button>
    </div>
  );
}
