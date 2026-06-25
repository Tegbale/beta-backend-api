import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { emitToUser } from '../../gateway';
import { SocketEvents } from '../../gateway/events';

export const listNotifications = async (userId: string, page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const [notifications, total] = await prisma.$transaction([
    prisma.notification.findMany({ where: { userId }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.notification.count({ where: { userId } }),
  ]);
  return { notifications, total };
};

export const markAsRead = async (userId: string, id: string) => {
  const notif = await prisma.notification.findFirst({ where: { id, userId } });
  if (!notif) throw new AppError('Notification not found', 404);
  const updated = await prisma.notification.update({ where: { id }, data: { isRead: true } });

  const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });
  emitToUser(userId, SocketEvents.NOTIFICATION_COUNT, { count: unreadCount });

  return updated;
};

export const markAllAsRead = async (userId: string) => {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  emitToUser(userId, SocketEvents.NOTIFICATION_COUNT, { count: 0 });
};

export const createNotification = async (
  userId: string,
  title: string,
  body: string,
  type?: string
) => {
  const notification = await prisma.notification.create({ data: { userId, title, body, type } });

  // Push to user in real time
  emitToUser(userId, SocketEvents.NOTIFICATION_NEW, notification);

  const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });
  emitToUser(userId, SocketEvents.NOTIFICATION_COUNT, { count: unreadCount });

  return notification;
};
