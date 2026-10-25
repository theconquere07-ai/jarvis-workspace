import { Router } from 'express';
import {
  listTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  upsertSection,
  deleteSection,
} from '../controllers/analyzerController';

export const analyzerRouter = Router();

analyzerRouter.get('/topics', listTopics);
analyzerRouter.post('/topics', createTopic);
analyzerRouter.patch('/topics/:id', updateTopic);
analyzerRouter.delete('/topics/:id', deleteTopic);
analyzerRouter.put('/topics/:topicId/sections/:sectionKey', upsertSection);
analyzerRouter.delete('/topics/:topicId/sections/:sectionKey', deleteSection);
