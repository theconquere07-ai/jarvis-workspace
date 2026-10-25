import { useState, useEffect, useCallback } from 'react';
import { AnalyzerTopic } from '../types';
import { api } from '../lib/api';

export function useAnalyzer() {
  const [topics, setTopics] = useState<AnalyzerTopic[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTopics = useCallback(async () => {
    try {
      const data = await api.analyzer.listTopics() as AnalyzerTopic[];
      setTopics(data);
    } catch (e) {
      console.error('Failed to load analyzer topics:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  const createTopic = async (title = 'New Topic') => {
    const data = await api.analyzer.createTopic({ title }) as AnalyzerTopic;
    setTopics(prev => [data, ...prev]);
    return data;
  };

  const updateTopic = async (id: string, title: string) => {
    setTopics(prev => prev.map(t => t.id === id ? { ...t, title } : t));
    await api.analyzer.updateTopic(id, { title });
  };

  const deleteTopic = async (id: string) => {
    setTopics(prev => prev.filter(t => t.id !== id));
    await api.analyzer.deleteTopic(id);
  };

  const upsertSection = async (topicId: string, sectionKey: string, content: string, sortOrder: number) => {
    const data = await api.analyzer.upsertSection(topicId, sectionKey, { content, sort_order: sortOrder }) as { id: string; section_key: string; content: string; sort_order: number; topic_id: string; user_id: string; created_at: string; updated_at: string };
    setTopics(prev => prev.map(t => {
      if (t.id !== topicId) return t;
      const existing = t.analyzer_sections.find(s => s.section_key === sectionKey);
      if (existing) {
        return { ...t, analyzer_sections: t.analyzer_sections.map(s => s.section_key === sectionKey ? { ...s, content } : s) };
      }
      return { ...t, analyzer_sections: [...t.analyzer_sections, data] };
    }));
  };

  return { topics, loading, createTopic, updateTopic, deleteTopic, upsertSection };
}
