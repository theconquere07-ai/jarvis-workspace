import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../services/supabase';

export async function listNotes(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('z_index', { ascending: true });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
}

export async function createNote(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('notes')
    .insert({ ...req.body, user_id: req.user!.id })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
}

export async function updateNote(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('notes')
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .select()
    .single();

  if (error || !data) { res.status(404).json({ error: error?.message || 'Note not found' }); return; }
  res.json(data);
}

export async function deleteNote(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(204).send();
}
