import { Router } from 'express';
import {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
} from '../controllers/projectsController';

export const projectsRouter = Router();

projectsRouter.get('/', listProjects);
projectsRouter.post('/', createProject);
projectsRouter.get('/:id', getProject);
projectsRouter.patch('/:id', updateProject);
projectsRouter.delete('/:id', deleteProject);
