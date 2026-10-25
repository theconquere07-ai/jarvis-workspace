import { AnalyzerTopic } from '../../types';

interface AnalyzerListProps {
  topics: AnalyzerTopic[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  loading: boolean;
}

export function AnalyzerList({
  topics,
  selectedId,
  onSelect,
  onNew,
  loading,
}: AnalyzerListProps) {
  return (
    <div className="side" id="slist">
      {loading && topics.length === 0 && (
        <div style={{ padding: '14px 18px', color: 'var(--mut)' }}>Loading…</div>
      )}
      {topics.map(t => (
        <button
          key={t.id}
          className={`li ${t.id === selectedId ? 'on' : ''}`}
          onClick={() => onSelect(t.id)}
        >
          <b>{t.title || 'Untitled topic'}</b>
        </button>
      ))}
      <button className="li add" onClick={onNew}>
        + New topic
      </button>
    </div>
  );
}
