import { EventStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { CreateEventInput, UpdateEventInput, ListQuery } from './events.schema';
import { notifySchool } from '../notifications/notifications.service';

export const listEvents = async (schoolId: string | null | undefined, query: ListQuery) => {
  const { page, limit, status, search } = query;
  const skip = (page - 1) * limit;
  const where: any = {};
  if (schoolId) where.schoolId = schoolId;
  if (status) where.status = status as EventStatus;
  if (search) where.title = { contains: search, mode: 'insensitive' };

  const [events, total] = await prisma.$transaction([
    prisma.event.findMany({ where, skip, take: limit, orderBy: { startDate: 'asc' } }),
    prisma.event.count({ where }),
  ]);

  return { events, total };
};

export const getEvent = async (schoolId: string | null | undefined, id: string) => {
  const where = schoolId ? { id, schoolId } : { id };
  const event = await prisma.event.findFirst({ where });
  if (!event) throw new AppError('Event not found', 404);
  return event;
};

export const createEvent = async (schoolId: string, creatorId: string, input: CreateEventInput) => {
  const event = await prisma.event.create({
    data: {
      ...input,
      schoolId,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    },
  });

  notifySchool(
    schoolId,
    creatorId,
    `New event: ${event.title}`,
    event.description ? event.description.slice(0, 120) : `A new event has been scheduled.`,
    'event_new',
  ).catch(() => {});

  return event;
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
