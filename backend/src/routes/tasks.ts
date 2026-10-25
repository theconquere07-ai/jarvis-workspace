import { Router } from 'express';
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/tasksController';

export const tasksRouter = Router();

tasksRouter.get('/', listTasks);
tasksRouter.post('/', createTask);
tasksRouter.patch('/:id', updateTask);
tasksRouter.delete('/:id', deleteTask);
