import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../services/supabase';
import { geminiService } from '../services/gemini';

export async function getConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { data, error } = await supabase
    .from('avis_conversations')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('updated_at', { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
}

export async function createConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { title, context_project_id } = req.body;
  const { data, error } = await supabase
    .from('avis_conversations')
    .insert({
      title: title || 'A.V.I.S. Session',
      context_project_id: context_project_id || null,
      user_id: req.user!.id,
    })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
}

export async function getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { conversationId } = req.params;
  const { data, error } = await supabase
    .from('avis_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: true });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
}

export async function sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { conversationId } = req.params;
  const { content, contextData } = req.body;

  if (!content) { res.status(400).json({ error: 'Message content is required' }); return; }

  // 1. Insert user message
  const { data: userMsg, error: userErr } = await supabase
    .from('avis_messages')
    .insert({
      conversation_id: conversationId,
      user_id: req.user!.id,
      role: 'user',
      content,
    })
    .select()
    .single();

  if (userErr) { res.status(500).json({ error: userErr.message }); return; }

  // 2. Fetch recent conversation history
  const { data: history } = await supabase
    .from('avis_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(6);

  const formattedHistory = (history || [])
    .reverse()
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  // 3. Generate response using Gemini service with provider abstraction
  const avisResult = await geminiService.generateResponse({
    userMessage: content,
    conversationHistory: formattedHistory,
    contextData,
  });

  // 4. Save assistant reply
  const { data: assistantMsg, error: asstErr } = await supabase
    .from('avis_messages')
    .insert({
      conversation_id: conversationId,
      user_id: req.user!.id,
      role: 'assistant',
      content: avisResult.reply,
      suggested_actions: avisResult.suggestedActions,
      tokens_used: avisResult.tokensUsed,
    })
    .select()
    .single();

  if (asstErr) { res.status(500).json({ error: asstErr.message }); return; }

  // Update conversation updated_at
  await supabase
    .from('avis_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  res.json({ userMessage: userMsg, assistantMessage: assistantMsg });
}
