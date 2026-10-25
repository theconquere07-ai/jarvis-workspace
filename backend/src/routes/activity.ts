import { Router } from 'express';
import { listActivity, logActivity } from '../controllers/activityController';

export const activityRouter = Router();

activityRouter.get('/', listActivity);
activityRouter.post('/', logActivity);
