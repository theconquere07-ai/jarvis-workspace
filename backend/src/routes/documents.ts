import { Router } from 'express';
import {
  listDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../controllers/documentsController';

export const documentsRouter = Router();

documentsRouter.get('/', listDocuments);
documentsRouter.post('/', createDocument);
documentsRouter.patch('/:id', updateDocument);
documentsRouter.delete('/:id', deleteDocument);
