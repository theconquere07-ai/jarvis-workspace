import { useState, useEffect } from 'react';

export type WorkspaceTab = 'board' | 'projects' | 'analyzer' | 'growth' | 'showcase' | 'storage' | 'avis';

interface HeaderProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  onIntro: () => void;
  onTimer: () => void;
  timerRunning: boolean;
  timerDisplay: string;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  onSignOut: () => void;
  onOpenPublicShowcase: () => void;
}

export function Header({
  activeTab,
  onTabChange,
  onIntro,
  onTimer,
  timerRunning,
  timerDisplay,
  theme,
  onThemeToggle,
  onSignOut,
  onOpenPublicShowcase,
}: HeaderProps) {
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => {
      setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <header>
      <div className="brand" style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span>Workspace<i> / yours</i></span>
      </div>

      <nav id="nav" style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <button
          className={activeTab === 'board' ? 'on' : ''}
          onClick={() => onTabChange('board')}
        >
          Notesboard
        </button>
        <button
          className={activeTab === 'projects' ? 'on' : ''}
          onClick={() => onTabChange('projects')}
        >
          Projects
        </button>
        <button
          className={activeTab === 'analyzer' ? 'on' : ''}
          onClick={() => onTabChange('analyzer')}
        >
          Analyzer
        </button>
        <button
          className={activeTab === 'growth' ? 'on' : ''}
          onClick={() => onTabChange('growth')}
        >
          Growth
        </button>
        <button
          className={activeTab === 'showcase' ? 'on' : ''}
          onClick={() => onTabChange('showcase')}
        >
          Showcase CMS
        </button>
        <button
          className={activeTab === 'storage' ? 'on' : ''}
          onClick={() => onTabChange('storage')}
        >
          Storage
        </button>
        <button
          className={activeTab === 'avis' ? 'on' : ''}
          onClick={() => onTabChange('avis')}
          style={{ color: activeTab === 'avis' ? '#000' : 'var(--gold)' }}
        >
          A.V.I.S.
        </button>
      </nav>

      <div className="meta">
        <button
          onClick={onOpenPublicShowcase}
          className="tg"
          style={{ color: 'var(--tx)', border: '1px solid var(--ln2)', marginRight: '6px' }}
          title="Open Public Showcase"
        >
          Public Showcase ↗
        </button>
        <span className="pulse" />
        <span id="clock">{clock}</span>
        <button
          className={`tg tm ${timerRunning ? 'run' : ''}`}
          id="tm"
          aria-label="Work timer"
          onClick={onTimer}
        >
          <span className="rec" />
          <span id="tt">{timerRunning ? timerDisplay : 'Timer'}</span>
        </button>
        <button className="tg" id="rp" onClick={onIntro}>
          Intro
        </button>
        <button className="tg" id="tg" onClick={onThemeToggle}>
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
        <button
          className="tg"
          onClick={onSignOut}
          title="Sign out"
          style={{ opacity: 0.6 }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
