import { Router } from 'express';
import {
  getShowcaseSettings,
  updateShowcaseSettings,
} from '../controllers/showcaseController';

export const showcaseRouter = Router();

showcaseRouter.get('/settings', getShowcaseSettings);
showcaseRouter.patch('/settings', updateShowcaseSettings);
