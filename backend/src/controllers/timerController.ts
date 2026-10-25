import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../services/supabase';

export async function listSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { range } = req.query;
  let query = supabase
    .from('work_sessions')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('started_at', { ascending: false });

  if (range === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    query = query.gte('started_at', today.toISOString());
  } else if (range === '7d') {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    query = query.gte('started_at', d.toISOString());
  }

  const { data, error } = await query.limit(500);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
}

export async function createSession(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { task_name, project_id, started_at, ended_at, duration_ms } = req.body;

  const { data, error } = await supabase
    .from('work_sessions')
    .insert({
      user_id: req.user!.id,
      task_name: task_name || 'Untitled work',
      project_id: project_id || null,
      started_at: started_at || new Date().toISOString(),
      ended_at: ended_at || null,
      duration_ms: duration_ms || null,
    })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
}

export async function endSession(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { ended_at, duration_ms } = req.body;

  const { data, error } = await supabase
    .from('work_sessions')
    .update({ ended_at, duration_ms })
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .select()
    .single();

  if (error || !data) { res.status(404).json({ error: error?.message || 'Session not found' }); return; }
  res.json(data);
}
