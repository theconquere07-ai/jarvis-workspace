import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../services/supabase';

export async function listProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
}

export async function createProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...req.body, user_id: req.user!.id })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
}

export async function getProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .single();

  if (error || !data) { res.status(404).json({ error: 'Project not found' }); return; }
  res.json(data);
}

export async function updateProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .select()
    .single();

  if (error || !data) { res.status(404).json({ error: error?.message || 'Project not found' }); return; }
  res.json(data);
}

export async function deleteProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(204).send();
}
