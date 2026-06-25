import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { prisma } from '../../lib/prisma';
import { AuthRequest } from '../../types';
import { success } from '../../utils/response';

const router = Router();
router.use(authenticate);

router.get('/search', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const q = String(req.query.q ?? '').trim().slice(0, 50);
    const schoolId = req.user!.schoolId;
    if (!q || !schoolId) return success(res, []);

    const users = await prisma.user.findMany({
      where: {
        schoolId,
        isActive: true,
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, role: true, avatar: true },
      take: 10,
    });
    success(res, users);
  } catch (err) { next(err); }
});

export default router;
