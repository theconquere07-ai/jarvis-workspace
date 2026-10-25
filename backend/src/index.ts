import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { projectsRouter } from './routes/projects';
import { notesRouter } from './routes/notes';
import { analyzerRouter } from './routes/analyzer';
import { timerRouter } from './routes/timer';
import { milestonesRouter } from './routes/milestones';
import { tasksRouter } from './routes/tasks';
import { documentsRouter } from './routes/documents';
import { publicationsRouter } from './routes/publications';
import { showcaseRouter } from './routes/showcase';
import { activityRouter } from './routes/activity';
import { avisRouter } from './routes/avis';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

// Public routes
app.use('/api/health', healthRouter);
// Public showcase endpoint for published items without auth requirement
app.use('/api/publications/public', publicationsRouter);

// Protected routes (require user JWT)
app.use('/api', authMiddleware);
app.use('/api/projects', projectsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/analyzer', analyzerRouter);
app.use('/api/timer', timerRouter);
app.use('/api/milestones', milestonesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/publications', publicationsRouter);
app.use('/api/showcase', showcaseRouter);
app.use('/api/activity', activityRouter);
app.use('/api/avis', avisRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`JARVIS backend running on port ${PORT}`);
});

export default app;
