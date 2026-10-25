import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../services/supabase';

export async function listDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { project_id } = req.query;
  let q = supabase
    .from('project_documents')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false });

  if (project_id) {
    q = q.eq('project_id', project_id as string);
  }

  const { data, error } = await q;
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
}

export async function createDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('project_documents')
    .insert({ ...req.body, user_id: req.user!.id })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
}

export async function updateDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('project_documents')
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .select()
    .single();

  if (error || !data) { res.status(404).json({ error: error?.message || 'Document not found' }); return; }
  res.json(data);
}

export async function deleteDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { error } = await supabase
    .from('project_documents')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(204).send();
}
