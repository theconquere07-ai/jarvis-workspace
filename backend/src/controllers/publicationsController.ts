import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../services/supabase';

export async function listPublications(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { public: isPublic } = req.query;
  let q = supabase
    .from('publications')
    .select('*')
    .order('created_at', { ascending: false });

  if (isPublic === 'true') {
    q = q.eq('publication_status', 'published');
  } else if (req.user) {
    q = q.eq('user_id', req.user.id);
  }

  const { data, error } = await q;
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
}

export async function getPublication(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { idOrSlug } = req.params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSlug);

  let q = supabase.from('publications').select('*');
  if (isUuid) {
    q = q.eq('id', idOrSlug);
  } else {
    q = q.eq('slug', idOrSlug);
  }

  const { data, error } = await q.single();
  if (error || !data) { res.status(404).json({ error: 'Publication not found' }); return; }
  res.json(data);
}

export async function createPublication(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('publications')
    .insert({ ...req.body, user_id: req.user!.id })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
}

export async function updatePublication(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('publications')
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .select()
    .single();

  if (error || !data) { res.status(404).json({ error: error?.message || 'Publication not found' }); return; }
  res.json(data);
}

export async function deletePublication(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { error } = await supabase
    .from('publications')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(204).send();
}
