import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthPage } from './components/Auth/AuthPage';
import { Intro } from './components/Intro/Intro';
import { Workspace } from './pages/Workspace';

export default function App() {
  const { user, loading, signOut } = useAuth();
  const [showIntro, setShowIntro] = useState(true);

  if (showIntro) {
    return <Intro onDone={() => setShowIntro(false)} />;
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
        <span>Loading…</span>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuth={() => {}} />;
  }

  return (
    <Workspace
      onSignOut={async () => {
        await signOut();
      }}
      onIntro={() => setShowIntro(true)}
    />
  );
}
