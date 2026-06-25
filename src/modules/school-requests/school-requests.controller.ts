import { Request, Response, NextFunction } from 'express';
import * as service from './school-requests.service';

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await service.createRequest(req.body);
    res.status(201).json({ success: true, message: 'Request submitted successfully', data: request });
  } catch (err) {
    next(err);
  }
};

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.listRequests(req.query as any);
    res.json({ success: true, message: 'Requests retrieved', data });
  } catch (err) {
    next(err);
  }
};

export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await service.getRequest(req.params.id);
    res.json({ success: true, message: 'Request retrieved', data: request });
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
