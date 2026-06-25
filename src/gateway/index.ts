import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { SocketEvents } from './events';
import { AuthPayload } from '../types';

interface AuthenticatedSocket extends Socket {
  user: AuthPayload;
}

let io: Server;

export const initGateway = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: { origin: env.clientOrigins, credentials: true },
    transports: ['websocket', 'polling'],
  });

  // JWT auth middleware — runs before every connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Unauthorized'));

    try {
      (socket as AuthenticatedSocket).user = verifyAccessToken(token);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket as AuthenticatedSocket;

    // Each user joins a personal room for targeted events
    socket.join(`user:${user.sub}`);

    // School staff/admins also join a school-wide room
    if (user.schoolId) {
      socket.join(`school:${user.schoolId}`);
    }

    logger.info(`Socket connected: ${user.email} [${socket.id}]`);

    // Deliver unread notification count on connect
    prisma.notification
      .count({ where: { userId: user.sub, isRead: false } })
      .then((count) => socket.emit(SocketEvents.NOTIFICATION_COUNT, { count }))
      .catch(() => {});

    socket.on(SocketEvents.DISCONNECT, () => {
      logger.info(`Socket disconnected: ${user.email} [${socket.id}]`);
    });
  });

  return io;
};

// Emit to a single user's personal room
export const emitToUser = (userId: string, event: string, data: unknown): void => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

// Broadcast to all connected members of a school
export const emitToSchool = (schoolId: string, event: string, data: unknown): void => {
  if (!io) return;
  io.to(`school:${schoolId}`).emit(event, data);
};

export { io };
