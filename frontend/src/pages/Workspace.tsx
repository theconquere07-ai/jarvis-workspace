import { useState, useEffect } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useAnalyzer } from '../hooks/useAnalyzer';
import { useTimer } from '../hooks/useTimer';
import { Header, WorkspaceTab } from '../components/Layout/Header';
import { HUD } from '../components/Layout/HUD';
import { Notesboard } from '../components/Notesboard/Notesboard';
import { ProjectList } from '../components/Projects/ProjectList';
import { ProjectDetail } from '../components/Projects/ProjectDetail';
import { AnalyzerList } from '../components/Analyzer/AnalyzerList';
import { AnalyzerDetail } from '../components/Analyzer/AnalyzerDetail';
import { GrowthDashboard } from '../components/Profile/GrowthDashboard';
import { ShowcaseCMS } from '../components/Showcase/ShowcaseCMS';
import { StorageManager } from '../components/Storage/StorageManager';
import { AvisAssistant } from '../components/Avis/AvisAssistant';
import { Timer } from '../components/Timer/Timer';
import { MigrationWizard } from '../components/Migration/MigrationWizard';

interface WorkspaceProps {
  onSignOut: () => void;
  onIntro: () => void;
  onOpenPublicShowcase: () => void;
}

const LS_MIGRATION = 'migrationDone';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function hms(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export function Workspace({ onSignOut, onIntro, onOpenPublicShowcase }: WorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>(() => {
    const hash = window.location.hash.slice(1);
    const validTabs: WorkspaceTab[] = ['board', 'projects', 'analyzer', 'growth', 'showcase', 'storage', 'avis'];
    return validTabs.includes(hash as WorkspaceTab) ? (hash as WorkspaceTab) : 'board';
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
      if (tab !== 'board' || window.location.hash !== '') {
        window.history.replaceState(null, '', `#${tab}`);
      }
    } catch {
      // ignore
    }
  }, [tab]);

  // Keyboard navigation 1-7
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toUpperCase();
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.metaKey || e.ctrlKey) return;
      const map: Record<string, WorkspaceTab> = {
        '1': 'board',
        '2': 'projects',
        '3': 'analyzer',
        '4': 'growth',
        '5': 'showcase',
        '6': 'storage',
        '7': 'avis',
      };
      if (map[e.key]) {
        setTab(map[e.key]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Default selection for projects
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Default selection for analyzer
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

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;
  const selectedTopic = topics.find((t) => t.id === selectedTopicId) || null;

  return (
    <div id="app">
      <HUD />

      <Header
        activeTab={tab}
        onTabChange={setTab}
        onIntro={onIntro}
        onTimer={() => setShowTimer((prev) => !prev)}
        timerRunning={timer.run}
        timerDisplay={hms(timer.acc + (timer.run ? Date.now() - timer.at : 0))}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onSignOut={onSignOut}
        onOpenPublicShowcase={onOpenPublicShowcase}
      />

      <main>
        {/* Tab 1: Notesboard */}
        <div className={`view ${tab === 'board' ? 'on' : ''}`}>
          <Notesboard />
        </div>

        {/* Tab 2: Projects */}
        <div className={`view ${tab === 'projects' ? 'on' : ''}`}>
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
                key={selectedProject.id}
                project={selectedProject}
                onUpdate={updateProject}
                onDelete={async (id) => {
                  await deleteProject(id);
                  const remaining = projects.filter((p) => p.id !== id);
                  setSelectedProjectId(remaining.length > 0 ? remaining[0].id : null);
                }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--mut)',
                  fontSize: 12,
                }}
              >
                No project selected. Select one from the sidebar or create a new project.
              </div>
            )}
          </div>
        </div>

        {/* Tab 3: Analyzer */}
        <div className={`view ${tab === 'analyzer' ? 'on' : ''}`}>
          <div className="split">
            <AnalyzerList
              topics={topics}
              selectedId={selectedTopicId}
              onSelect={setSelectedTopicId}
              onNew={async () => {
                const t = await createTopic('Untitled research');
                setSelectedTopicId(t.id);
              }}
              loading={topicsLoading}
            />
            {selectedTopic ? (
              <AnalyzerDetail
                key={selectedTopic.id}
                topic={selectedTopic}
                onUpdateTitle={async (id: string, title: string) => {
                  await updateTopic(id, title);
                }}
                onUpsertSection={async (topicId: string, key: string, content: string, sortOrder: number) => {
                  await upsertSection(topicId, key, content, sortOrder);
                }}
                onDelete={async (id: string) => {
                  await deleteTopic(id);
                  const remaining = topics.filter((t) => t.id !== id);
                  setSelectedTopicId(remaining.length > 0 ? remaining[0].id : null);
                }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--mut)',
                  fontSize: 12,
                }}
              >
                Select or create a research topic.
              </div>
            )}
          </div>
        </div>

        {/* Tab 4: Growth Dashboard */}
        <div className={`view ${tab === 'growth' ? 'on' : ''}`}>
          <GrowthDashboard projects={projects} />
        </div>

        {/* Tab 5: Showcase CMS */}
        <div className={`view ${tab === 'showcase' ? 'on' : ''}`}>
          <ShowcaseCMS projects={projects} onUpdateProject={updateProject} />
        </div>

        {/* Tab 6: Documents & Media Storage */}
        <div className={`view ${tab === 'storage' ? 'on' : ''}`}>
          <StorageManager projects={projects} />
        </div>

        {/* Tab 7: A.V.I.S. AI Assistant */}
        <div className={`view ${tab === 'avis' ? 'on' : ''}`}>
          <AvisAssistant projects={projects} onNavigateTab={(t) => setTab(t as WorkspaceTab)} />
        </div>
      </main>

      {/* Floating Timer */}
      {showTimer && <Timer onClose={() => setShowTimer(false)} />}

      {/* Migration Wizard (First Run) */}
      {showMigration && (
        <MigrationWizard
          onDone={() => {
            setShowMigration(false);
            localStorage.setItem(LS_MIGRATION, 'true');
          }}
        />
      )}
    </div>
  );
}
