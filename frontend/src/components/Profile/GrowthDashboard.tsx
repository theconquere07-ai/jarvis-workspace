import { useState, useEffect } from 'react';
import { Project, WorkSession, ActivityLog, ShowcaseSettings } from '../../types';
import { api } from '../../lib/api';

interface GrowthDashboardProps {
  projects: Project[];
}

export function GrowthDashboard({ projects }: GrowthDashboardProps) {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<ShowcaseSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'kpis' | 'settings'>('kpis');
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    Promise.all([
      api.timer.listSessions('all').catch(() => []),
      api.activityLogs.list(30).catch(() => []),
      api.showcaseSettings.get().catch(() => null),
    ])
      .then(([sess, lg, setts]) => {
        setSessions(sess as WorkSession[]);
        setLogs(lg as ActivityLog[]);
        setSettings(setts);
      })
      .finally(() => setLoading(false));
  }, []);

  // Compute metrics
  const total = projects.length;
  const active = projects.filter((p) => p.status === 'active').length;
  const inDev = projects.filter((p) => p.status === 'in_development').length;
  const completed = projects.filter((p) => p.status === 'completed').length;
  const published = projects.filter((p) => p.publication_status === 'published').length;

  const totalTimeMs = sessions.reduce((acc, s) => acc + (s.duration_ms || 0), 0);
  const totalHours = (totalTimeMs / 3600000).toFixed(1);

  const totalRevenue = projects.reduce((acc, p) => acc + (p.verified_revenue || 0), 0);
  const totalExpenses = projects.reduce((acc, p) => acc + (p.verified_expenses || 0), 0);

  // Status distribution
  const statusCounts: Record<string, number> = {};
  projects.forEach((p) => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });

  // Category distribution
  const categoryCounts: Record<string, number> = {};
  projects.forEach((p) => {
    const cat = p.category || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const updated = await api.showcaseSettings.update(settings);
      setSettings(updated);
      setSaveMsg('Settings saved successfully');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err: any) {
      setSaveMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div className="page" style={{ height: '100%', overflowY: 'auto', padding: '34px 44px 90px' }}>
      <div className="wrap" style={{ maxWidth: '900px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
          <div>
            <h1 style={{ font: '400 42px/1 var(--ser)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              Growth & Telemetry
            </h1>
            <p style={{ color: 'var(--dim)', margin: 0, fontSize: '11px' }}>
              Personal technological progress, verified output, and activity metrics.
            </p>
          </div>

          <div style={{ display: 'flex', border: '1px solid var(--ln2)' }}>
            <button
              onClick={() => setActiveTab('kpis')}
              style={{
                padding: '6px 14px',
                background: activeTab === 'kpis' ? 'var(--tx)' : 'transparent',
                color: activeTab === 'kpis' ? '#000' : 'var(--dim)',
                fontSize: '10.5px',
                fontWeight: activeTab === 'kpis' ? 500 : 300,
              }}
            >
              KPIs & Charts
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              style={{
                padding: '6px 14px',
                background: activeTab === 'settings' ? 'var(--tx)' : 'transparent',
                color: activeTab === 'settings' ? '#000' : 'var(--dim)',
                fontSize: '10.5px',
                fontWeight: activeTab === 'settings' ? 500 : 300,
              }}
            >
              Profile Settings
            </button>
          </div>
        </div>

        {activeTab === 'kpis' && (
          <>
            {/* KPI Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
                marginBottom: '32px',
              }}
            >
              <div style={{ border: '1px solid var(--ln2)', padding: '14px', background: 'rgba(255,255,255,0.015)' }}>
                <span style={{ fontSize: '9.5px', color: 'var(--mut)', textTransform: 'uppercase' }}>Total Projects</span>
                <div style={{ font: '400 32px/1 var(--ser)', marginTop: '6px' }}>{total}</div>
                <span style={{ fontSize: '9px', color: 'var(--dim)' }}>Ecosystem Registry</span>
              </div>

              <div style={{ border: '1px solid var(--ln2)', padding: '14px', background: 'rgba(255,255,255,0.015)' }}>
                <span style={{ fontSize: '9.5px', color: 'var(--mut)', textTransform: 'uppercase' }}>Active / In Dev</span>
                <div style={{ font: '400 32px/1 var(--ser)', marginTop: '6px' }}>{active + inDev}</div>
                <span style={{ fontSize: '9px', color: 'var(--dim)' }}>{active} active · {inDev} in dev</span>
              </div>

              <div style={{ border: '1px solid var(--ln2)', padding: '14px', background: 'rgba(255,255,255,0.015)' }}>
                <span style={{ fontSize: '9.5px', color: 'var(--mut)', textTransform: 'uppercase' }}>Completed</span>
                <div style={{ font: '400 32px/1 var(--ser)', marginTop: '6px', color: 'var(--gold)' }}>{completed}</div>
                <span style={{ fontSize: '9px', color: 'var(--dim)' }}>Shipped milestones</span>
              </div>

              <div style={{ border: '1px solid var(--ln2)', padding: '14px', background: 'rgba(255,255,255,0.015)' }}>
                <span style={{ fontSize: '9.5px', color: 'var(--mut)', textTransform: 'uppercase' }}>Tracked Time</span>
                <div style={{ font: '400 32px/1 var(--ser)', marginTop: '6px' }}>{totalHours}h</div>
                <span style={{ fontSize: '9px', color: 'var(--dim)' }}>{sessions.length} sessions logged</span>
              </div>

              <div style={{ border: '1px solid var(--ln2)', padding: '14px', background: 'rgba(255,255,255,0.015)' }}>
                <span style={{ fontSize: '9.5px', color: 'var(--mut)', textTransform: 'uppercase' }}>Showcase</span>
                <div style={{ font: '400 32px/1 var(--ser)', marginTop: '6px' }}>{published}</div>
                <span style={{ fontSize: '9px', color: 'var(--dim)' }}>Publicly live</span>
              </div>

              <div style={{ border: '1px solid var(--ln2)', padding: '14px', background: 'rgba(255,255,255,0.015)' }}>
                <span style={{ fontSize: '9.5px', color: 'var(--mut)', textTransform: 'uppercase' }}>Net Revenue</span>
                <div style={{ font: '400 32px/1 var(--ser)', marginTop: '6px' }}>
                  ₹{(totalRevenue - totalExpenses).toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '9px', color: 'var(--dim)' }}>₹{totalRevenue} in / ₹{totalExpenses} out</span>
              </div>
            </div>

            {/* Visual SVG Breakdown Charts */}
            <h4 style={{ margin: '24px 0 12px' }}>Distribution & Engineering Focus</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Status Breakdown Bar */}
              <div style={{ border: '1px solid var(--ln)', padding: '18px' }}>
                <div style={{ fontSize: '11px', color: 'var(--dim)', marginBottom: '14px' }}>
                  Project Status Distribution
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(statusCounts).map(([st, cnt]) => {
                    const pct = Math.round((cnt / (total || 1)) * 100);
                    return (
                      <div key={st}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                          <span style={{ textTransform: 'capitalize' }}>{st.replace('_', ' ')}</span>
                          <span style={{ color: 'var(--dim)' }}>
                            {cnt} ({pct}%)
                          </span>
                        </div>
                        <div style={{ height: '4px', background: 'var(--ln)', width: '100%' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              background: st === 'completed' ? 'var(--gold)' : 'var(--tx)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category Breakdown */}
              <div style={{ border: '1px solid var(--ln)', padding: '18px' }}>
                <div style={{ fontSize: '11px', color: 'var(--dim)', marginBottom: '14px' }}>
                  Category & Domain Focus
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(categoryCounts).map(([cat, cnt]) => {
                    const pct = Math.round((cnt / (total || 1)) * 100);
                    return (
                      <div key={cat}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                          <span>{cat}</span>
                          <span style={{ color: 'var(--dim)' }}>
                            {cnt} ({pct}%)
                          </span>
                        </div>
                        <div style={{ height: '4px', background: 'var(--ln)', width: '100%' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--tx)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Activity Stream */}
            <h4 style={{ margin: '36px 0 12px' }}>Real Activity Telemetry</h4>
            <div style={{ border: '1px solid var(--ln)', padding: '10px' }}>
              {logs.length === 0 ? (
                <div style={{ color: 'var(--mut)', padding: '14px', fontSize: '11px' }}>
                  No activity events recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {logs.map((lg) => (
                    <div
                      key={lg.id}
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '12px',
                        padding: '6px 8px',
                        borderBottom: '1px solid var(--ln)',
                        fontSize: '10.5px',
                      }}
                    >
                      <span style={{ color: 'var(--dim)', fontSize: '9.5px', flex: 'none', width: '70px' }}>
                        {new Date(lg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                      <span
                        style={{
                          fontSize: '8.5px',
                          padding: '1px 5px',
                          border: '1px solid var(--ln2)',
                          color: 'var(--mut)',
                          textTransform: 'uppercase',
                          flex: 'none',
                        }}
                      >
                        {lg.action_type}
                      </span>
                      <span style={{ color: 'var(--tx)', flex: 1 }}>{lg.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Profile Settings Editor */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} style={{ marginTop: '20px' }}>
            {saveMsg && (
              <div
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--gold)',
                  color: 'var(--gold)',
                  marginBottom: '16px',
                  fontSize: '11px',
                }}
              >
                {saveMsg}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Full Name / Display Title</span>
                <input
                  type="text"
                  value={settings?.title || ''}
                  onChange={(e) => setSettings((prev) => (prev ? { ...prev, title: e.target.value } : null))}
                  placeholder="Abhishek Gangadhar"
                  style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0', marginTop: '4px' }}
                />
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Tagline</span>
                <input
                  type="text"
                  value={settings?.tagline || ''}
                  onChange={(e) => setSettings((prev) => (prev ? { ...prev, tagline: e.target.value } : null))}
                  placeholder="Senior Full Stack Engineer & Systems Architect"
                  style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0', marginTop: '4px' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Biography</span>
              <textarea
                className="big"
                value={settings?.bio || ''}
                onChange={(e) => setSettings((prev) => (prev ? { ...prev, bio: e.target.value } : null))}
                placeholder="High-agency engineer building AI systems, scalable web apps, and autonomous workflows."
              />
            </div>

            <h4 style={{ margin: '24px 0 12px' }}>Public Contact & Networks</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Contact Email</span>
                <input
                  type="email"
                  value={settings?.contact_email || ''}
                  onChange={(e) => setSettings((prev) => (prev ? { ...prev, contact_email: e.target.value } : null))}
                  placeholder="theconquere07@gmail.com"
                  style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0' }}
                />
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>GitHub</span>
                <input
                  type="text"
                  value={settings?.github_url || ''}
                  onChange={(e) => setSettings((prev) => (prev ? { ...prev, github_url: e.target.value } : null))}
                  placeholder="https://github.com/theconquere07-ai"
                  style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0' }}
                />
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>YouTube</span>
                <input
                  type="text"
                  value={settings?.youtube_url || ''}
                  onChange={(e) => setSettings((prev) => (prev ? { ...prev, youtube_url: e.target.value } : null))}
                  placeholder="https://youtube.com/@AbhishekOnProffesion"
                  style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0' }}
                />
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase' }}>Instagram</span>
                <input
                  type="text"
                  value={settings?.instagram_url || ''}
                  onChange={(e) => setSettings((prev) => (prev ? { ...prev, instagram_url: e.target.value } : null))}
                  placeholder="https://instagram.com/abhishek_onproffesion"
                  style={{ width: '100%', borderBottom: '1px solid var(--ln2)', padding: '6px 0' }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                marginTop: '28px',
                padding: '10px 20px',
                border: '1px solid var(--tx)',
                background: 'var(--tx)',
                color: '#000',
                fontWeight: 500,
              }}
            >
              Save Profile Settings
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
