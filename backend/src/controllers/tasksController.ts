import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../services/supabase';

export async function listTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { project_id } = req.query;
  let q = supabase
    .from('project_tasks')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('sort_order', { ascending: true });

  if (project_id) {
    q = q.eq('project_id', project_id as string);
  }

  const { data, error } = await q;
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
}

export async function createTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('project_tasks')
    .insert({ ...req.body, user_id: req.user!.id })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
}

export async function updateTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('project_tasks')
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .select()
    .single();

  if (error || !data) { res.status(404).json({ error: error?.message || 'Task not found' }); return; }
  res.json(data);
}

export async function deleteTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { error } = await supabase
    .from('project_tasks')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(204).send();
}
