import { Router } from 'express';
import {
  listNotes,
  createNote,
  updateNote,
  deleteNote,
} from '../controllers/notesController';

export const notesRouter = Router();

notesRouter.get('/', listNotes);
notesRouter.post('/', createNote);
notesRouter.patch('/:id', updateNote);
notesRouter.delete('/:id', deleteNote);
