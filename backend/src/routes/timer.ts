import { Router } from 'express';
import {
  listSessions,
  createSession,
  endSession,
} from '../controllers/timerController';

export const timerRouter = Router();

timerRouter.get('/sessions', listSessions);
timerRouter.post('/sessions', createSession);
timerRouter.patch('/sessions/:id/end', endSession);
