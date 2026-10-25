import { useState, useEffect, useRef, useCallback } from 'react';
import { AnalyzerTopic } from '../../types';

const BT: Record<string, string> = {
  what: 'What it is',
  why: 'Why it exists',
  core: 'Core parts and first principles',
  build: 'How to build it from zero',
  ask: 'Open questions',
  free: 'Free space',
};

interface AnalyzerDetailProps {
  topic: AnalyzerTopic;
  onUpdateTitle: (id: string, title: string) => Promise<void>;
  onUpsertSection: (topicId: string, key: string, content: string, sortOrder: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function AnalyzerDetail({
  topic,
  onUpdateTitle,
  onUpsertSection,
  onDelete,
}: AnalyzerDetailProps) {
  const [title, setTitle] = useState(topic.title);
  const [armDelete, setArmDelete] = useState(false);
  const debounceMap = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Keep a local dictionary of section content by section_key
  const [sections, setSections] = useState<Record<string, string>>({});
  // List of active keys in order
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  useEffect(() => {
    setTitle(topic.title);
    setArmDelete(false);

    const sMap: Record<string, string> = {};
    const keys: string[] = [];

    // Sort sections by sort_order
    const sorted = [...(topic.analyzer_sections || [])].sort(
      (a, b) => a.sort_order - b.sort_order
    );

    if (sorted.length > 0) {
      sorted.forEach(s => {
        sMap[s.section_key] = s.content;
        keys.push(s.section_key);
      });
    } else {
      // Default initial keys from prototype: what, why, core, ask
      ['what', 'why', 'core', 'ask'].forEach(k => {
        sMap[k] = '';
        keys.push(k);
      });
    }

    setSections(sMap);
    setActiveKeys(keys);
  }, [topic.id, topic.title, topic.analyzer_sections]);

  const handleTitleChange = useCallback(
    (val: string) => {
      setTitle(val);
      const t = debounceMap.current.get('title');
      if (t) clearTimeout(t);
      debounceMap.current.set(
        'title',
        setTimeout(() => onUpdateTitle(topic.id, val), 400)
      );
    },
    [topic.id, onUpdateTitle]
  );

  const handleSectionChange = useCallback(
    (key: string, content: string, idx: number) => {
      setSections(prev => ({ ...prev, [key]: content }));
      const t = debounceMap.current.get(key);
      if (t) clearTimeout(t);
      debounceMap.current.set(
        key,
        setTimeout(() => onUpsertSection(topic.id, key, content, idx), 500)
      );
    },
    [topic.id, onUpsertSection]
  );

  const handleAddKey = (key: string) => {
    if (!activeKeys.includes(key)) {
      setActiveKeys(prev => [...prev, key]);
      setSections(prev => ({ ...prev, [key]: '' }));
      onUpsertSection(topic.id, key, '', activeKeys.length);
    }
  };

  const handleRemoveKey = (key: string) => {
    setActiveKeys(prev => prev.filter(k => k !== key));
    onUpsertSection(topic.id, key, '', -1); // empty out or remove
  };

  const handleDelete = async () => {
    if (!armDelete) {
      setArmDelete(true);
      setTimeout(() => setArmDelete(false), 2500);
    } else {
      await onDelete(topic.id);
    }
  };

  return (
    <div className="page" id="sdet">
      <div className="wrap">
        <input
          className="ttl"
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          placeholder="What are you learning?"
        />

        {activeKeys.map((k, idx) => (
          <div className="blk" key={k}>
            <div className="bh">
              <span>{BT[k] || k}</span>
              <button type="button" onClick={() => handleRemoveKey(k)}>
                Remove
              </button>
            </div>
            <textarea
              placeholder="…"
              value={sections[k] ?? ''}
              onChange={e => handleSectionChange(k, e.target.value, idx)}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = 'auto';
                t.style.height = t.scrollHeight + 'px';
              }}
            />
          </div>
        ))}

        <div className="adds">
          {Object.entries(BT).map(([k, label]) => (
            <button key={k} type="button" onClick={() => handleAddKey(k)}>
              + {label}
            </button>
          ))}
        </div>

        <button
          className={`danger ${armDelete ? 'arm' : ''}`}
          type="button"
          onClick={handleDelete}
        >
          {armDelete ? 'Click again to delete' : 'Delete topic'}
        </button>
      </div>
    </div>
  );
}
