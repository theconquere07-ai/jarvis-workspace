import { Router } from 'express';
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
} from '../controllers/avisController';

export const avisRouter = Router();

avisRouter.get('/conversations', getConversations);
avisRouter.post('/conversations', createConversation);
avisRouter.get('/conversations/:conversationId/messages', getMessages);
avisRouter.post('/conversations/:conversationId/messages', sendMessage);
