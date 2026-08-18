import { Request, Response, NextFunction } from 'express';
import * as service from './school-requests.service';
import { generateCloudinaryDownloadUrl } from '../../lib/storage';
import { AppError } from '../../middleware/errorHandler';
import { env } from '../../config/env';

function proxyUrl(req: Request, requestId: string, type: 'cac' | 'govt'): string {
  const proto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0].trim() ?? req.protocol;
  const host = (req.headers['x-forwarded-host'] as string | undefined) ?? req.get('host') ?? 'localhost:5000';
  return `${proto}://${host}/api/v1/school-requests/${requestId}/documents/${type}`;
}

function withProxyDocUrls(req: Request, request: any) {
  // On Spaces (public-read ACL), documents are directly accessible — no proxy needed.
  // Only proxy through the backend when using Cloudinary (CDN access is restricted at account level).
  if (env.storage.provider !== 'cloudinary') {
    return request;
  }
  return {
    ...request,
    cacDocumentUrl: request.cacDocumentUrl ? proxyUrl(req, request.id, 'cac') : null,
    govtDocumentUrl: request.govtDocumentUrl ? proxyUrl(req, request.id, 'govt') : null,
  };
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const docs: service.UploadedDocuments = {
      cacDocument: files?.cacDocument?.[0],
      govtDocument: files?.govtDocument?.[0],
    };
    const request = await service.createRequest(req.body, docs);
    res.status(201).json({ success: true, message: 'Request submitted successfully', data: request });
  } catch (err) {
    next(err);
  }
};

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.listRequests(req.query as any);
    res.json({
      success: true,
      message: 'Requests retrieved',
      data: {
        ...data,
        requests: data.requests.map((r) => withProxyDocUrls(req, r)),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await service.getRequest(req.params.id);
    res.json({ success: true, message: 'Request retrieved', data: withProxyDocUrls(req, request) });
  } catch (err) {
    next(err);
  }
};

export const approve = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.approveRequest(req.params.id);
    res.json({ success: true, message: 'School account created and credentials sent', data });
  } catch (err) {
    next(err);
  }
};

export const reject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await service.rejectRequest(req.params.id, req.body);
    res.json({ success: true, message: 'Request rejected', data: request });
  } catch (err) {
    next(err);
  }
};

export const streamDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, type } = req.params;
    if (type !== 'cac' && type !== 'govt') {
      throw new AppError('Invalid document type', 400);
    }

    const storedUrl = await service.getDocumentUrl(id, type as 'cac' | 'govt');

    const downloadUrl = await generateCloudinaryDownloadUrl(storedUrl);
    if (!downloadUrl) {
      throw new AppError('Document not available', 404);
    }

    const upstream = await fetch(downloadUrl);
    if (!upstream.ok) {
      throw new AppError('Failed to retrieve document from storage', 502);
    }

    const ext = storedUrl.split('.').pop()?.toLowerCase() ?? 'pdf';
    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
    };

    res.setHeader('Content-Type', mimeMap[ext] ?? 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="document.${ext}"`);

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};
