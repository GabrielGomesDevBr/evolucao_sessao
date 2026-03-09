import { Router } from 'express';
import { ok } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';

export const notificationsRouter = Router();

notificationsRouter.get('/', async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: {
      tenantId: req.auth!.tenantId,
      OR: [{ userId: req.auth!.sub }, { userId: null }],
    },
    orderBy: { createdAt: 'desc' },
  });

  return ok(res, notifications);
});
