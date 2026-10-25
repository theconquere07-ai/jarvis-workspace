import { useState, useEffect } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useAnalyzer } from '../hooks/useAnalyzer';
import { useTimer } from '../hooks/useTimer';
import { Header } from '../components/Layout/Header';
import { HUD } from '../components/Layout/HUD';
import { Notesboard } from '../components/Notesboard/Notesboard';
import { ProjectList } from '../components/Projects/ProjectList';
import { ProjectDetail } from '../components/Projects/ProjectDetail';
import { AnalyzerList } from '../components/Analyzer/AnalyzerList';
import { AnalyzerDetail } from '../components/Analyzer/AnalyzerDetail';
import { Timer } from '../components/Timer/Timer';
import { MigrationWizard } from '../components/Migration/MigrationWizard';
import { Project } from '../types';

type Tab = 'board' | 'projects' | 'analyzer';

interface WorkspaceProps {
  onSignOut: () => void;
  onIntro: () => void;
}

const LS_MIGRATION = 'migrationDone';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function hms(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export function Workspace({ onSignOut, onIntro }: WorkspaceProps) {
  const [tab, setTab] = useState<Tab>(() => {
    const hash = window.location.hash.slice(1);
    return ['board', 'projects', 'analyzer'].includes(hash) ? (hash as Tab) : 'board';
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark';
  });

  const [showTimer, setShowTimer] = useState(false);
  const [showMigration, setShowMigration] = useState(
    () => localStorage.getItem(LS_MIGRATION) !== 'true'
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const { projects, loading: projLoading, createProject, updateProject, deleteProject } = useProjects();
  const { topics, loading: topicsLoading, createTopic, updateTopic, deleteTopic, upsertSection } = useAnalyzer();
  const { timer } = useTimer();

  // Keep hash synced with tab
  useEffect(() => {
    try {
      window.history.replaceState(null, '', `#${tab}`);
    } catch {
      // ignore
    }
  }, [tab]);

  // Keyboard navigation 1/2/3
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toUpperCase();
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.metaKey || e.ctrlKey) return;
      const map: Record<string, Tab> = { '1': 'board', '2': 'projects', '3': 'analyzer' };
      if (map[e.key]) {
        setTab(map[e.key]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Default selection
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (topics.length > 0 && !selectedTopicId) {
      setSelectedTopicId(topics[0].id);
    }
  }, [topics, selectedTopicId]);

  const handleThemeToggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const handleNewProject = async () => {
    const p = await createProject({ name: '', description: null, status: 'planned' });
    setSelectedProjectId(p.id);
    setTab('projects');
  };

  const handleNewTopic = async () => {
    const t = await createTopic('New Topic');
    setSelectedTopicId(t.id);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    setSelectedProjectId(null);
  };

  const handleDeleteTopic = async (id: string) => {
    await deleteTopic(id);
    setSelectedTopicId(null);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;
  const selectedTopic = topics.find(t => t.id === selectedTopicId) || null;

  const timerElapsed = timer.acc + (timer.run ? Date.now() - timer.at : 0);
  const timerDisplay = hms(timerElapsed);

  return (
    <div id="app">
      <Header
        activeTab={tab}
        onTabChange={setTab}
        onIntro={onIntro}
        onTimer={() => setShowTimer(v => !v)}
        timerRunning={timer.run}
        timerDisplay={timerDisplay}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onSignOut={onSignOut}
      />

      {showTimer && (
        <Timer
          onClose={() => setShowTimer(false)}
          projects={projects.map(p => ({ name: p.name }))}
        />
      )}

      {showMigration && <MigrationWizard onDone={() => setShowMigration(false)} />}

      <main>
        <HUD />

        {/* Board View */}
        <section className={`view ${tab === 'board' ? 'on' : ''}`} id="v-board">
          <Notesboard />
        </section>

        {/* Projects View */}
        <section className={`view ${tab === 'projects' ? 'on' : ''}`} id="v-projects">
          <div className="split">
            <ProjectList
              projects={projects}
              selectedId={selectedProjectId}
              onSelect={setSelectedProjectId}
              onNew={handleNewProject}
              loading={projLoading}
            />
            {selectedProject ? (
              <ProjectDetail
                project={selectedProject}
                onUpdate={(id, updates) => updateProject(id, updates) as Promise<Project>}
                onDelete={handleDeleteProject}
              />
            ) : (
              <div className="page" id="pdet">
                <div className="wrap">
                  <div className="ttl" style={{ color: 'var(--mut)' }}>Nothing here.</div>
                  <button className="ghost" onClick={handleNewProject}>
                    + New project
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Analyzer View */}
        <section className={`view ${tab === 'analyzer' ? 'on' : ''}`} id="v-analyzer">
          <div className="split">
            <AnalyzerList
              topics={topics}
              selectedId={selectedTopicId}
              onSelect={setSelectedTopicId}
              onNew={handleNewTopic}
              loading={topicsLoading}
            />
            {selectedTopic ? (
              <AnalyzerDetail
                topic={selectedTopic}
                onUpdateTitle={updateTopic}
                onUpsertSection={upsertSection}
                onDelete={handleDeleteTopic}
              />
            ) : (
              <div className="page" id="sdet">
                <div className="wrap">
                  <div className="ttl" style={{ color: 'var(--mut)' }}>Nothing here.</div>
                  <button className="ghost" onClick={handleNewTopic}>
                    + New topic
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
