import { EventStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { CreateEventInput, UpdateEventInput, ListQuery } from './events.schema';

export const listEvents = async (schoolId: string, query: ListQuery) => {
  const { page, limit, status, search } = query;
  const skip = (page - 1) * limit;
  const where: any = { schoolId };
  if (status) where.status = status as EventStatus;
  if (search) where.title = { contains: search, mode: 'insensitive' };

  const [events, total] = await prisma.$transaction([
    prisma.event.findMany({ where, skip, take: limit, orderBy: { startDate: 'asc' } }),
    prisma.event.count({ where }),
  ]);

  return { events, total };
};

export const getEvent = async (schoolId: string, id: string) => {
  const event = await prisma.event.findFirst({ where: { id, schoolId } });
  if (!event) throw new AppError('Event not found', 404);
  return event;
};

export const createEvent = async (schoolId: string, input: CreateEventInput) => {
  return prisma.event.create({
    data: {
      ...input,
      schoolId,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    },
  });
};

export const updateEvent = async (schoolId: string, id: string, input: UpdateEventInput) => {
  await getEvent(schoolId, id);
  return prisma.event.update({
    where: { id },
    data: {
      ...input,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      status: input.status as EventStatus | undefined,
    },
  });
};

export const deleteEvent = async (schoolId: string, id: string) => {
  await getEvent(schoolId, id);
  await prisma.event.delete({ where: { id } });
};
