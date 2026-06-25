import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { emitToUser } from '../../gateway';
import { SocketEvents } from '../../gateway/events';
import { CreateMessageInput, ListQuery } from './messages.schema';

const userSelect = { select: { id: true, firstName: true, lastName: true, avatar: true } };

export const listMessages = async (userId: string, query: ListQuery) => {
  const { page, limit, type } = query;
  const skip = (page - 1) * limit;
  const where =
    type === 'sent'
      ? { senderId: userId }
      : type === 'all'
      ? { OR: [{ senderId: userId }, { receiverId: userId }] }
      : { receiverId: userId };

  const [messages, total] = await prisma.$transaction([
    prisma.message.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { sender: userSelect, receiver: userSelect },
    }),
    prisma.message.count({ where }),
  ]);

  return { messages, total };
};

export const getMessage = async (userId: string, id: string) => {
  const message = await prisma.message.findFirst({
    where: { id, OR: [{ senderId: userId }, { receiverId: userId }] },
    include: { sender: userSelect, receiver: userSelect },
  });
  if (!message) throw new AppError('Message not found', 404);

  if (message.receiverId === userId && message.status !== 'READ') {
    await prisma.message.update({ where: { id }, data: { status: 'READ' } });
    // Notify sender that their message was read
    emitToUser(message.senderId, SocketEvents.MESSAGE_READ, { messageId: id, readBy: userId });
  }

  return message;
};

export const sendMessage = async (senderId: string, input: CreateMessageInput) => {
  const receiver = await prisma.user.findUnique({ where: { id: input.receiverId } });
  if (!receiver) throw new AppError('Receiver not found', 404);

  const message = await prisma.message.create({
    data: { ...input, senderId },
    include: { sender: userSelect, receiver: userSelect },
  });

  // Push new message to receiver in real time
  emitToUser(input.receiverId, SocketEvents.MESSAGE_NEW, message);

  return message;
};

export const deleteMessage = async (userId: string, id: string) => {
  const message = await prisma.message.findFirst({ where: { id, senderId: userId } });
  if (!message) throw new AppError('Message not found', 404);
  await prisma.message.delete({ where: { id } });
};
