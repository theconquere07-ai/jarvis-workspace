import { useState, useEffect } from 'react';
import { Project, ProjectDocument } from '../../types';
import { api } from '../../lib/api';

interface StorageManagerProps {
  projects: Project[];
}

export function StorageManager({ projects }: StorageManagerProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState<string>('all');
  const [newDoc, setNewDoc] = useState<Partial<ProjectDocument>>({
    title: '',
    doc_type: 'spec',
    file_url: '',
    is_public: false,
    project_id: null,
  });
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    api.documents
      .list()
      .then((data) => setDocuments(data))
      .catch((err) => console.warn('Could not load documents:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title || !newDoc.file_url) return;
    try {
      const created = await api.documents.create({
        ...newDoc,
        metadata: {},
      });
      setDocuments((prev) => [created, ...prev]);
      setShowAddModal(false);
      setNewDoc({
        title: '',
        doc_type: 'spec',
        file_url: '',
        is_public: false,
        project_id: null,
      });
    } catch (err: any) {
      alert(`Error adding document: ${err.message}`);
    }
  };

  const handleTogglePublic = async (doc: ProjectDocument) => {
    const nextPublic = !doc.is_public;
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, is_public: nextPublic } : d))
    );
    await api.documents.update(doc.id, { is_public: nextPublic });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document record?')) return;
    await api.documents.delete(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const filteredDocs = documents.filter((d) => {
    if (filterProject !== 'all' && d.project_id !== filterProject) return false;
    return true;
  });

  return (
    <div className="page" style={{ height: '100%', overflowY: 'auto', padding: '34px 44px 90px' }}>
      <div className="wrap" style={{ maxWidth: '900px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
          <div>
            <h1 style={{ font: '400 42px/1 var(--ser)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              Storage & Documents
            </h1>
            <p style={{ color: 'var(--dim)', margin: 0, fontSize: '11px' }}>
              Centralized library of project specifications, architecture diagrams, assets, and public deliverables.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--tx)',
                background: 'var(--tx)',
                color: '#000',
                fontSize: '11px',
                fontWeight: 500,
              }}
            >
              + Add Document
            </button>
          </div>
        </div>

        {/* Filter by project */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: 'var(--dim)' }}>Filter by Project:</span>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            style={{
              padding: '6px 10px',
              border: '1px solid var(--ln2)',
              background: '#000',
              color: 'var(--tx)',
              fontSize: '11px',
            }}
          >
            <option value="all">All Projects ({documents.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Document list */}
        {loading ? (
          <div style={{ color: 'var(--mut)', padding: '20px 0' }}>Loading documents…</div>
        ) : filteredDocs.length === 0 ? (
          <div style={{ color: 'var(--mut)', padding: '20px 0', fontSize: '11px' }}>
            No documents found for this selection.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredDocs.map((doc) => {
              const proj = projects.find((p) => p.id === doc.project_id);
              return (
                <div
                  key={doc.id}
                  style={{
                    border: '1px solid var(--ln)',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.015)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <b style={{ color: 'var(--tx)', fontSize: '12.5px' }}>{doc.title}</b>
                      <span
                        style={{
                          fontSize: '9px',
                          padding: '1px 5px',
                          border: '1px solid var(--ln2)',
                          color: 'var(--dim)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {doc.doc_type}
                      </span>
                      {proj && (
                        <span style={{ fontSize: '10px', color: 'var(--gold)' }}>
                          [{proj.name}]
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--mut)', marginTop: '4px' }}>
                      {doc.file_url}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => handleTogglePublic(doc)}
                      style={{
                        padding: '4px 8px',
                        border: doc.is_public ? '1px solid var(--tx)' : '1px solid var(--ln2)',
                        background: doc.is_public ? 'var(--tx)' : 'transparent',
                        color: doc.is_public ? '#000' : 'var(--dim)',
                        fontSize: '9.5px',
                        fontWeight: doc.is_public ? 500 : 300,
                      }}
                    >
                      {doc.is_public ? 'Public' : 'Private'}
                    </button>

                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--ln2)',
                        color: 'var(--tx)',
                        fontSize: '10px',
                        textDecoration: 'none',
                      }}
                    >
                      Open ↗
                    </a>

                    <button
                      onClick={() => handleDelete(doc.id)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--ln2)',
                        color: 'var(--red)',
                        fontSize: '10px',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Document Modal */}
        {showAddModal && (
          <div className="migration-overlay">
            <div className="migration-box" style={{ maxWidth: '500px' }}>
              <div className="migration-title">Add Document Record</div>
              <form onSubmit={handleAddDocument} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Document Title</span>
                  <input
                    type="text"
                    value={newDoc.title}
                    onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                    required
                    placeholder="System Architecture Diagram"
                    style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0', color: 'var(--tx)' }}
                  />
                </div>

                <div>
                  <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>File URL</span>
                  <input
                    type="text"
                    value={newDoc.file_url}
                    onChange={(e) => setNewDoc({ ...newDoc, file_url: e.target.value })}
                    required
                    placeholder="https://drive.google.com/... or https://..."
                    style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0', color: 'var(--tx)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Type</span>
                    <select
                      value={newDoc.doc_type}
                      onChange={(e) => setNewDoc({ ...newDoc, doc_type: e.target.value as any })}
                      style={{ width: '100%', padding: '6px', border: '1px solid var(--ln2)', background: '#000', color: 'var(--tx)' }}
                    >
                      <option value="diagram">Diagram</option>
                      <option value="spec">Technical Spec</option>
                      <option value="guide">Guide</option>
                      <option value="asset">Media Asset</option>
                      <option value="license">License</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Attach to Project</span>
                    <select
                      value={newDoc.project_id || ''}
                      onChange={(e) => setNewDoc({ ...newDoc, project_id: e.target.value || null })}
                      style={{ width: '100%', padding: '6px', border: '1px solid var(--ln2)', background: '#000', color: 'var(--tx)' }}
                    >
                      <option value="">(None / General)</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!newDoc.is_public}
                      onChange={(e) => setNewDoc({ ...newDoc, is_public: e.target.checked })}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--tx)' }}>
                      Make file public in Showcase Deliverables
                    </span>
                  </label>
                </div>

                <div className="migration-actions" style={{ marginTop: '16px' }}>
                  <button type="button" className="migration-btn" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="migration-btn primary">
                    Add Document
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
