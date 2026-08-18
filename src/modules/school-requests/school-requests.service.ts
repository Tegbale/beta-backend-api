import path from 'path';
import { prisma } from '../../lib/prisma';
import { hashPassword } from '../../utils/password';
import { generatePassword } from '../../utils/generatePassword';
import { sendMail } from '../../lib/mailer';
import { requestReceivedEmail, newRequestNotificationEmail, accountCreatedEmail } from '../../lib/emailTemplates';
import { uploadBuffer } from '../../lib/storage';
import { AppError } from '../../middleware/errorHandler';
import { env } from '../../config/env';
import { CreateRequestInput, ListRequestsQuery, RejectRequestInput } from './school-requests.schema';
import { createNotification } from '../notifications/notifications.service';

export interface UploadedDocuments {
  cacDocument?: Express.Multer.File;
  govtDocument?: Express.Multer.File;
}

export const createRequest = async (input: CreateRequestInput, docs?: UploadedDocuments) => {
  let cacDocumentUrl: string | undefined;
  let govtDocumentUrl: string | undefined;

  if (docs?.cacDocument) {
    const ext = path.extname(docs.cacDocument.originalname).toLowerCase() || '.pdf';
    cacDocumentUrl = await uploadBuffer(
      docs.cacDocument.buffer,
      'tegbale/school-requests',
      `${Date.now()}-cac${ext}`,
      'raw',
    );
  }

  if (docs?.govtDocument) {
    const ext = path.extname(docs.govtDocument.originalname).toLowerCase() || '.pdf';
    govtDocumentUrl = await uploadBuffer(
      docs.govtDocument.buffer,
      'tegbale/school-requests',
      `${Date.now()}-govt${ext}`,
      'raw',
    );
  }

  const request = await prisma.schoolRequest.create({
    data: { ...input, cacDocumentUrl, govtDocumentUrl },
  });

  const contactName = `${input.contactFirstName} ${input.contactLastName}`;

  // Fire emails without blocking the response
  sendMail(
    input.contactEmail,
    'We\'ve received your request — Tègbalé',
    requestReceivedEmail(contactName, input.schoolName),
  ).catch(() => {});

  sendMail(
    env.mailgun.superadminEmail,
    `New school request: ${input.schoolName}`,
    newRequestNotificationEmail(
      input.schoolName,
      contactName,
      input.contactEmail,
      input.contactPhone,
      input.city,
      input.country,
      input.message,
      request.id,
      cacDocumentUrl,
      govtDocumentUrl,
    ),
  ).catch(() => {});

  return request;
};

export const listRequests = async (query: ListRequestsQuery) => {
  const { page, limit, status } = query;
  const skip = (page - 1) * limit;
  const where = status ? { status } : {};

  const [requests, total] = await prisma.$transaction([
    prisma.schoolRequest.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.schoolRequest.count({ where }),
  ]);

  return { requests, total, page, limit };
};

export const getRequest = async (id: string) => {
  const request = await prisma.schoolRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Request not found', 404);
  return request;
};

export const approveRequest = async (id: string) => {
  const request = await getRequest(id);
  if (request.status !== 'PENDING') throw new AppError('Request has already been processed', 400);

  const tempPassword = generatePassword(12);
  const schoolEmail = request.contactEmail;

  // Create school and admin user in a transaction
  const { school, admin } = await prisma.$transaction(async (tx) => {
    const school = await tx.school.create({
      data: {
        name: request.schoolName,
        email: schoolEmail,
        phone: request.contactPhone ?? undefined,
        address: request.city ?? undefined,
      },
    });

    const admin = await tx.user.create({
      data: {
        email: schoolEmail,
        password: await hashPassword(tempPassword),
        firstName: request.contactFirstName,
        lastName: request.contactLastName,
        phone: request.contactPhone ?? undefined,
        role: 'SCHOOL_ADMIN',
        schoolId: school.id,
      },
    });

    await tx.schoolRequest.update({ where: { id }, data: { status: 'APPROVED' } });

    return { school, admin };
  });

  // Send credential email to the new school admin
  const loginUrl = `${env.frontendUrl}/login`;
  sendMail(
    admin.email,
    'Your Tègbalé school account is ready',
    accountCreatedEmail(
      `${admin.firstName} ${admin.lastName}`,
      school.name,
      admin.email,
      tempPassword,
      loginUrl,
    ),
  ).catch(() => {});

  createNotification(
    admin.id,
    'School approved',
    `Your school "${school.name}" is now active on Tègbalé.`,
    'school_approved',
  ).catch(() => {});

  return { school, admin: { id: admin.id, email: admin.email, firstName: admin.firstName, lastName: admin.lastName } };
};

export const rejectRequest = async (id: string, input: RejectRequestInput) => {
  const request = await getRequest(id);
  if (request.status !== 'PENDING') throw new AppError('Request has already been processed', 400);

  return prisma.schoolRequest.update({
    where: { id },
    data: { status: 'REJECTED', notes: input.notes },
  });
};
