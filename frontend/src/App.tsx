import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthPage } from './components/Auth/AuthPage';
import { Intro } from './components/Intro/Intro';
import { Workspace } from './pages/Workspace';
import { PublicShowcase } from './components/Showcase/PublicShowcase';

export default function App() {
  const { user, loading, signOut } = useAuth();
  const [showIntro, setShowIntro] = useState(false);
  const [publicView, setPublicView] = useState<boolean>(() => {
    const h = window.location.hash;
    return (
      h.startsWith('#showcase') ||
      h.startsWith('#p/') ||
      h.startsWith('#projects') ||
      h.startsWith('#publications') ||
      h.startsWith('#about') ||
      h.startsWith('#contact')
    );
  });

  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash;
      if (
        h.startsWith('#showcase') ||
        h.startsWith('#p/') ||
        h.startsWith('#projects') ||
        h.startsWith('#publications') ||
        h.startsWith('#about') ||
        h.startsWith('#contact')
      ) {
        setPublicView(true);
      } else if (h === '' || h === '#board' || h === '#analyzer' || h === '#growth' || h === '#storage' || h === '#avis') {
        setPublicView(false);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (showIntro) {
    return <Intro onDone={() => setShowIntro(false)} />;
  }

  // If visiting public showcase URL or explicitly toggled to public view
  if (publicView) {
    return (
      <PublicShowcase
        onGoToWorkspace={() => {
          setPublicView(false);
          window.location.hash = 'board';
        }}
      />
    );
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: 'var(--dim)',
          fontSize: 12,
          fontFamily: 'var(--mono)',
        }}
      >
        <span>Initialising JARVIS telemetry…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthPage
        onAuth={() => {}}
      />
    );
  }

  return (
    <Workspace
      onSignOut={async () => {
        await signOut();
      }}
      onIntro={() => setShowIntro(true)}
      onOpenPublicShowcase={() => {
        setPublicView(true);
        window.location.hash = 'showcase';
      }}
    />
  );
}
