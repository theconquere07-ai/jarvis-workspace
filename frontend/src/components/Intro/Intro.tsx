import { useState, useEffect, useRef } from 'react';

interface IntroProps {
  onDone: () => void;
}

function renderSplit(text: string, offsetMs = 0) {
  let counter = 0;
  return text.split(' ').map((word, wIdx) => (
    <b key={`w-${wIdx}`} className="w" style={{ display: 'inline-block', whiteSpace: 'nowrap', fontWeight: 'inherit' }}>
      {word.split('').map((char, cIdx) => {
        const i = counter++;
        return (
          <span
            key={`c-${cIdx}`}
            style={{
              display: 'inline-block',
              ['--i' as string]: i,
              ['--o' as string]: `${offsetMs}ms`,
            }}
          >
            {char}
          </span>
        );
      })}
      {wIdx < text.split(' ').length - 1 ? '\u00A0' : ''}
    </b>
  ));
}

export function Intro({ onDone }: IntroProps) {
  const [s1State, setS1State] = useState<'hidden' | 'in' | 'out'>('hidden');
  const [s2State, setS2State] = useState<'hidden' | 'in'>('hidden');
  const [d2, setD2] = useState(false);
  const [go, setGo] = useState(false);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const endIntro = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setGo(true);
    const t = setTimeout(() => {
      onDone();
    }, 1300);
    timers.current.push(t);
  };

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onDone();
      return;
    }

    const t1 = setTimeout(() => setS1State('in'), 60);
    const t2 = setTimeout(() => setS1State('out'), 3400);
    const t3 = setTimeout(() => {
      setD2(true);
      setS2State('in');
    }, 4100);
    const t4 = setTimeout(endIntro, 8600);

    timers.current = [t1, t2, t3, t4];

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') endIntro();
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      timers.current.forEach(clearTimeout);
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  return (
    <div id="intro" className={`${d2 ? 'd2 ' : ''}${go ? 'go' : ''}`} aria-hidden="true">
      <div className="sh t" />
      <div className="sh b" />

      <svg className="rx" viewBox="0 0 400 400" fill="none" strokeWidth="1.4">
        <g className="rg">
          <circle pathLength="1" cx="200" cy="200" r="190" stroke="#f0b429" />
          <circle pathLength="1" cx="200" cy="200" r="168" stroke="#e23636" />
          <circle pathLength="1" cx="200" cy="200" r="120" stroke="#f0b429" />
          <circle pathLength="1" cx="200" cy="200" r="74" stroke="#f0b429" />
          <circle pathLength="1" cx="200" cy="200" r="40" stroke="#e23636" />
        </g>
        <circle className="core" cx="200" cy="200" r="22" fill="#f0b429" stroke="none" />
      </svg>

      <div className={`sc s1 ${s1State === 'in' ? 'in' : s1State === 'out' ? 'out' : ''}`}>
        <h1 id="t1">{renderSplit('WorkandOwn', 0)}</h1>
        <p id="t1b">{renderSplit('By & For Abhii', 900)}</p>
        <div className="ln" />
      </div>

      <div className={`sc s2 ${s2State === 'in' ? 'in' : ''}`}>
        <h2 id="t2">{renderSplit('If Tony Stark were alive.', 0)}</h2>
        <div className="si">
          <i />
          <span>Stark Industries</span>
          <i />
        </div>
      </div>

      <button id="skip" onClick={endIntro}>
        Skip
      </button>
    </div>
  );
}
