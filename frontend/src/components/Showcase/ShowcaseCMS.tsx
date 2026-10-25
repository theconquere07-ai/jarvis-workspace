import { useState, useEffect } from 'react';
import { Project, Publication, PublicationStatus } from '../../types';
import { api } from '../../lib/api';

interface ShowcaseCMSProps {
  projects: Project[];
  onUpdateProject: (id: string, updates: Partial<Project>) => Promise<Project>;
}

export function ShowcaseCMS({ projects, onUpdateProject }: ShowcaseCMSProps) {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loadingPubs, setLoadingPubs] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'publications'>('projects');

  // Publication Form modal/inline
  const [editingPub, setEditingPub] = useState<Partial<Publication> | null>(null);

  useEffect(() => {
    setLoadingPubs(true);
    api.publications
      .list(false)
      .then((data) => setPublications(data))
      .catch((err) => console.warn('Could not load publications:', err))
      .finally(() => setLoadingPubs(false));
  }, []);

  const handleTogglePublish = async (p: Project) => {
    const nextStatus: PublicationStatus = p.publication_status === 'published' ? 'draft' : 'published';
    const publishedAt = nextStatus === 'published' ? new Date().toISOString() : null;
    await onUpdateProject(p.id, {
      publication_status: nextStatus,
      published_at: publishedAt,
    });
  };

  const handleToggleFeatured = async (p: Project) => {
    await onUpdateProject(p.id, {
      featured: !p.featured,
    });
  };

  const handleSavePublication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPub?.title) return;
    try {
      if (editingPub.id) {
        const updated = await api.publications.update(editingPub.id, editingPub);
        setPublications((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const slug = (editingPub.slug || editingPub.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
        const created = await api.publications.create({
          ...editingPub,
          slug,
          publication_status: editingPub.publication_status || 'draft',
        });
        setPublications((prev) => [created, ...prev]);
      }
      setEditingPub(null);
    } catch (err: any) {
      alert(`Error saving publication: ${err.message}`);
    }
  };

  const handleDeletePublication = async (id: string) => {
    if (!confirm('Are you sure you want to delete this publication?')) return;
    await api.publications.delete(id);
    setPublications((prev) => prev.filter((p) => p.id !== id));
  };

  const publishedCount = projects.filter((p) => p.publication_status === 'published').length;
  const featuredCount = projects.filter((p) => p.featured).length;

  return (
    <div className="page" style={{ height: '100%', overflowY: 'auto', padding: '34px 44px 90px' }}>
      <div className="wrap" style={{ maxWidth: '900px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
          <div>
            <h1 style={{ font: '400 42px/1 var(--ser)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              Showcase CMS
            </h1>
            <p style={{ color: 'var(--dim)', margin: 0, fontSize: '11px' }}>
              Publish, curate, and configure projects and research articles displayed on your public showcase.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href="#showcase"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 14px',
                border: '1px solid var(--tx)',
                color: '#000',
                background: 'var(--tx)',
                fontSize: '11px',
                fontWeight: 500,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Open Public Showcase ↗
            </a>
          </div>
        </div>

        {/* CMS Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--ln2)', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('projects')}
            style={{
              padding: '8px 16px',
              borderBottom: activeTab === 'projects' ? '2px solid var(--tx)' : '2px solid transparent',
              color: activeTab === 'projects' ? 'var(--tx)' : 'var(--dim)',
              fontSize: '11px',
            }}
          >
            Projects ({publishedCount} Published · {featuredCount} Featured)
          </button>
          <button
            onClick={() => setActiveTab('publications')}
            style={{
              padding: '8px 16px',
              borderBottom: activeTab === 'publications' ? '2px solid var(--tx)' : '2px solid transparent',
              color: activeTab === 'publications' ? 'var(--tx)' : 'var(--dim)',
              fontSize: '11px',
            }}
          >
            Publications & Research ({publications.length})
          </button>
        </div>

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {projects.map((p) => {
                const isPub = p.publication_status === 'published';
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      border: '1px solid var(--ln)',
                      background: isPub ? 'rgba(255,255,255,0.02)' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <span className={`dot ${p.status}`} />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <b style={{ color: 'var(--tx)', fontSize: '12px' }}>{p.name || 'Untitled'}</b>
                          <span style={{ color: 'var(--dim)', fontSize: '10px' }}>
                            {p.slug ? `/${p.slug}` : ''}
                          </span>
                        </div>
                        <div
                          style={{
                            color: 'var(--dim)',
                            fontSize: '10.5px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {p.short_desc || p.description || 'No description recorded'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 'none' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px' }}>
                        <input
                          type="checkbox"
                          checked={!!p.featured}
                          onChange={() => handleToggleFeatured(p)}
                        />
                        <span style={{ color: p.featured ? 'var(--gold)' : 'var(--dim)' }}>
                          ★ Featured
                        </span>
                      </label>

                      <button
                        onClick={() => handleTogglePublish(p)}
                        style={{
                          padding: '5px 10px',
                          border: isPub ? '1px solid var(--tx)' : '1px solid var(--ln2)',
                          background: isPub ? 'var(--tx)' : 'transparent',
                          color: isPub ? '#000' : 'var(--dim)',
                          fontSize: '10px',
                          fontWeight: isPub ? 500 : 300,
                        }}
                      >
                        {isPub ? 'Published' : 'Draft'}
                      </button>

                      {isPub && (
                        <a
                          href={`#p/${p.slug || p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--dim)', fontSize: '10px', textDecoration: 'underline' }}
                        >
                          View ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PUBLICATIONS TAB */}
        {activeTab === 'publications' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
              <button
                onClick={() =>
                  setEditingPub({
                    title: '',
                    slug: '',
                    abstract: '',
                    content: '',
                    authors: ['Abhishek Gangadhar'],
                    publication_type: 'article',
                    publication_status: 'draft',
                    tags: [],
                  })
                }
                style={{
                  padding: '6px 14px',
                  border: '1px solid var(--tx)',
                  background: 'var(--tx)',
                  color: '#000',
                  fontSize: '10.5px',
                  fontWeight: 500,
                }}
              >
                + New Publication
              </button>
            </div>

            {loadingPubs ? (
              <div style={{ color: 'var(--mut)', padding: '14px' }}>Loading publications…</div>
            ) : publications.length === 0 ? (
              <div style={{ color: 'var(--mut)', padding: '14px' }}>No publications found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {publications.map((pub) => (
                  <div
                    key={pub.id}
                    style={{
                      border: '1px solid var(--ln)',
                      padding: '14px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <b style={{ font: '400 18px/1.2 var(--ser)', color: 'var(--tx)' }}>{pub.title}</b>
                        <span
                          style={{
                            fontSize: '9px',
                            padding: '1px 5px',
                            border: '1px solid var(--ln2)',
                            color: 'var(--dim)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {pub.publication_type}
                        </span>
                        <span
                          style={{
                            fontSize: '9px',
                            padding: '1px 5px',
                            border: pub.publication_status === 'published' ? '1px solid var(--tx)' : '1px solid var(--ln2)',
                            color: pub.publication_status === 'published' ? 'var(--tx)' : 'var(--dim)',
                          }}
                        >
                          {pub.publication_status}
                        </span>
                      </div>
                      <p style={{ color: 'var(--dim)', fontSize: '11px', margin: '6px 0 0' }}>
                        {pub.abstract || 'No abstract'}
                      </p>
                      <div style={{ fontSize: '9.5px', color: 'var(--mut)', marginTop: '8px' }}>
                        By {pub.authors?.join(', ') || 'Unknown'} · Slug: /{pub.slug}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setEditingPub(pub)}
                        style={{ padding: '4px 8px', border: '1px solid var(--ln2)', color: 'var(--dim)', fontSize: '10px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePublication(pub.id)}
                        style={{ padding: '4px 8px', border: '1px solid var(--ln2)', color: 'var(--red)', fontSize: '10px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Edit / New Modal */}
            {editingPub && (
              <div className="migration-overlay">
                <div className="migration-box" style={{ maxWidth: '600px' }}>
                  <div className="migration-title">{editingPub.id ? 'Edit Publication' : 'New Publication'}</div>
                  <form onSubmit={handleSavePublication} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Title</span>
                      <input
                        type="text"
                        value={editingPub.title || ''}
                        onChange={(e) => setEditingPub({ ...editingPub, title: e.target.value })}
                        required
                        style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0', color: 'var(--tx)' }}
                      />
                    </div>

                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Slug</span>
                      <input
                        type="text"
                        value={editingPub.slug || ''}
                        onChange={(e) => setEditingPub({ ...editingPub, slug: e.target.value })}
                        placeholder="generative-models-cad"
                        style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0', color: 'var(--tx)' }}
                      />
                    </div>

                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Abstract</span>
                      <textarea
                        value={editingPub.abstract || ''}
                        onChange={(e) => setEditingPub({ ...editingPub, abstract: e.target.value })}
                        rows={2}
                        style={{ width: '100%', border: '1px solid var(--ln2)', padding: '6px', color: 'var(--tx)', marginTop: '4px' }}
                      />
                    </div>

                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Content / Full Text</span>
                      <textarea
                        value={editingPub.content || ''}
                        onChange={(e) => setEditingPub({ ...editingPub, content: e.target.value })}
                        rows={6}
                        required
                        style={{ width: '100%', border: '1px solid var(--ln2)', padding: '6px', color: 'var(--tx)', marginTop: '4px' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Type</span>
                        <select
                          value={editingPub.publication_type || 'article'}
                          onChange={(e) => setEditingPub({ ...editingPub, publication_type: e.target.value as any })}
                          style={{ width: '100%', padding: '6px', border: '1px solid var(--ln2)', background: '#000', color: 'var(--tx)' }}
                        >
                          <option value="article">Article</option>
                          <option value="whitepaper">Whitepaper</option>
                          <option value="research_note">Research Note</option>
                          <option value="case_study">Case Study</option>
                          <option value="tutorial">Tutorial</option>
                        </select>
                      </div>

                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Status</span>
                        <select
                          value={editingPub.publication_status || 'draft'}
                          onChange={(e) => setEditingPub({ ...editingPub, publication_status: e.target.value as any })}
                          style={{ width: '100%', padding: '6px', border: '1px solid var(--ln2)', background: '#000', color: 'var(--tx)' }}
                        >
                          <option value="draft">Draft (Private)</option>
                          <option value="published">Published</option>
                          <option value="private">Private</option>
                        </select>
                      </div>
                    </div>

                    <div className="migration-actions" style={{ marginTop: '14px' }}>
                      <button type="button" className="migration-btn" onClick={() => setEditingPub(null)}>
                        Cancel
                      </button>
                      <button type="submit" className="migration-btn primary">
                        Save Publication
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
