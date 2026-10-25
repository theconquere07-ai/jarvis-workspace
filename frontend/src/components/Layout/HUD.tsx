import { useMemo } from 'react';

export function HUD() {
  const tkLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i < 90; i++) {
      const r = (i * 4 * Math.PI) / 180;
      const l = i % 5 ? 356 : 366;
      const c = Math.cos(r);
      const s = Math.sin(r);
      lines.push(
        <line
          key={`tk-${i}`}
          x1={400 + 350 * c}
          y1={400 + 350 * s}
          x2={400 + l * c}
          y2={400 + l * s}
        />
      );
    }
    return lines;
  }, []);

  const sgLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i < 10; i++) {
      const r = (i * 36 * Math.PI) / 180;
      const c = Math.cos(r);
      const s = Math.sin(r);
      lines.push(
        <line
          key={`sg-${i}`}
          x1={400 + 100 * c}
          y1={400 + 100 * s}
          x2={400 + 170 * c}
          y2={400 + 170 * s}
        />
      );
    }
    return lines;
  }, []);

  return (
    <div id="hud" aria-hidden="true">
      <svg viewBox="0 0 800 800" fill="none" strokeWidth="1.2">
        <g className="g g1" stroke="#f0b429">
          <circle cx="400" cy="400" r="380" strokeDasharray="2 10" />
          <circle cx="400" cy="400" r="350" />
          <g id="tk">{tkLines}</g>
        </g>
        <g className="g g2" stroke="#e23636">
          <circle cx="400" cy="400" r="300" strokeDasharray="90 24 12 24" />
          <circle cx="400" cy="400" r="262" strokeDasharray="3 7" />
        </g>
        <g className="g g3" stroke="#f0b429">
          <circle cx="400" cy="400" r="210" strokeDasharray="140 30" />
          <circle cx="400" cy="400" r="170" />
          <g id="sg">{sgLines}</g>
        </g>
        <g className="pu" stroke="#f0b429">
          <circle cx="400" cy="400" r="96" />
          <circle cx="400" cy="400" r="64" stroke="#e23636" />
          <circle cx="400" cy="400" r="30" fill="#f0b429" fillOpacity="0.25" />
        </g>
      </svg>
    </div>
  );
}
