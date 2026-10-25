import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../services/supabase';

export async function getShowcaseSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('showcase_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
}

export async function updateShowcaseSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('showcase_settings')
    .upsert({
      ...req.body,
      user_id: req.user!.id,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
}
