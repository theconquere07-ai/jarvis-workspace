import { Router } from 'express';
import {
  listMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from '../controllers/milestonesController';

export const milestonesRouter = Router();

milestonesRouter.get('/', listMilestones);
milestonesRouter.post('/', createMilestone);
milestonesRouter.patch('/:id', updateMilestone);
milestonesRouter.delete('/:id', deleteMilestone);
