import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './modules/auth/auth.routes';
import schoolsRoutes from './modules/schools/schools.routes';
import staffRoutes from './modules/staff/staff.routes';
import classroomsRoutes from './modules/classrooms/classrooms.routes';
import studentsRoutes from './modules/students/students.routes';
import eventsRoutes from './modules/events/events.routes';
import messagesRoutes from './modules/messages/messages.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import parentsRoutes from './modules/parents/parents.routes';
import postsRoutes from './modules/posts/posts.routes';
import usersRoutes from './modules/users/users.routes';
import schoolRequestsRoutes from './modules/school-requests/school-requests.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.isDev ? 'dev' : 'combined'));

app.use(
  '/api/v1',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false })
);

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/schools', schoolsRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/classrooms', classroomsRoutes);
app.use('/api/v1/students', studentsRoutes);
app.use('/api/v1/events', eventsRoutes);
app.use('/api/v1/messages', messagesRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/parents', parentsRoutes);
app.use('/api/v1/posts', postsRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/school-requests', schoolRequestsRoutes);

app.use(errorHandler);

export default app;
