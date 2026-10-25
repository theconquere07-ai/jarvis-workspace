import { useState, useEffect, useCallback } from 'react';
import { NoteCard } from '../types';
import { api } from '../lib/api';

export function useNotes() {
  const [notes, setNotes] = useState<NoteCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    try {
      const data = await api.notes.list() as NoteCard[];
      setNotes(data);
    } catch (e) {
      console.error('Failed to load notes:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const createNote = async (note: Partial<NoteCard>) => {
    const tempId = `temp-${Date.now()}`;
    const tempNote: NoteCard = {
      id: tempId,
      user_id: '',
      type: note.type || 'note',
      content: note.content || null,
      x: note.x || 0,
      y: note.y || 0,
      w: note.w || 260,
      h: note.h || null,
      z_index: note.z_index || notes.length + 1,
      file_url: note.file_url || null,
      file_name: note.file_name || null,
      file_size: note.file_size || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setNotes(prev => [...prev, tempNote]);
    try {
      const data = await api.notes.create(note) as NoteCard;
      setNotes(prev => prev.map(n => n.id === tempId ? data : n));
      return data;
    } catch (e) {
      console.error('Failed to create note:', e);
      return tempNote;
    }
  };

  const updateNote = async (id: string, updates: Partial<NoteCard>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    try {
      await api.notes.update(id, updates);
    } catch (e) {
      console.error('Failed to update note:', e);
    }
  };

  const deleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    try {
      await api.notes.delete(id);
    } catch (e) {
      console.error('Failed to delete note:', e);
    }
  };

  return { notes, loading, createNote, updateNote, deleteNote, setNotes };
}
