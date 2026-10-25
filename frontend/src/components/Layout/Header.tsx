import { useState, useEffect } from 'react';

interface HeaderProps {
  activeTab: 'board' | 'projects' | 'analyzer';
  onTabChange: (tab: 'board' | 'projects' | 'analyzer') => void;
  onIntro: () => void;
  onTimer: () => void;
  timerRunning: boolean;
  timerDisplay: string;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  onSignOut: () => void;
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
      <div className="brand">
        Workspace<i> / yours</i>
      </div>

      <nav id="nav">
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
      </nav>

      <div className="meta">
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
