import { Router } from 'express';
import {
  listPublications,
  getPublication,
  createPublication,
  updatePublication,
  deletePublication,
} from '../controllers/publicationsController';

export const publicationsRouter = Router();

publicationsRouter.get('/', listPublications);
publicationsRouter.get('/:idOrSlug', getPublication);
publicationsRouter.post('/', createPublication);
publicationsRouter.patch('/:id', updatePublication);
publicationsRouter.delete('/:id', deletePublication);
