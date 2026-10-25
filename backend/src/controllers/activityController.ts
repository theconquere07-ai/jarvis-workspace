import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../services/supabase';

export async function listActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
  const limit = parseInt(req.query.limit as string, 10) || 50;
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
}

export async function logActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { action_type, entity_type, entity_id, title, details } = req.body;
  const { data, error } = await supabase
    .from('activity_logs')
    .insert({
      user_id: req.user!.id,
      action_type,
      entity_type,
      entity_id: entity_id || null,
      title,
      details: details || {},
    })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
}
