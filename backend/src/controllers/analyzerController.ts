import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../services/supabase';

export async function listTopics(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { data: topics, error } = await supabase
    .from('analyzer_topics')
    .select('*, analyzer_sections(*)')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(topics);
}

export async function createTopic(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('analyzer_topics')
    .insert({ title: req.body.title || 'Untitled', user_id: req.user!.id })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json({ ...data, analyzer_sections: [] });
}

export async function updateTopic(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('analyzer_topics')
    .update({ title: req.body.title, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .select()
    .single();

  if (error || !data) { res.status(404).json({ error: error?.message || 'Topic not found' }); return; }
  res.json(data);
}

export async function deleteTopic(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { error } = await supabase
    .from('analyzer_topics')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(204).send();
}

export async function upsertSection(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { topicId, sectionKey } = req.params;
  const { content, sort_order } = req.body;

  const { data, error } = await supabase
    .from('analyzer_sections')
    .upsert({
      topic_id: topicId,
      user_id: req.user!.id,
      section_key: sectionKey,
      content: content ?? '',
      sort_order: sort_order ?? 0,
    }, { onConflict: 'topic_id,section_key' })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
}

export async function deleteSection(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { topicId, sectionKey } = req.params;

  const { error } = await supabase
    .from('analyzer_sections')
    .delete()
    .eq('topic_id', topicId)
    .eq('section_key', sectionKey)
    .eq('user_id', req.user!.id);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(204).send();
}
