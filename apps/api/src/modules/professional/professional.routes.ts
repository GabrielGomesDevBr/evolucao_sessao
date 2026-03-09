import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { fail, ok } from '../../lib/http.js';

const professionalSchema = z.object({
  licenseCode: z.string().min(3),
  specialty: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  phone: z.string().optional(),
  signatureAssetId: z.string().optional(),
});

export const professionalRouter = Router();

professionalRouter.get('/me', async (req, res) => {
  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: req.auth!.sub },
    include: {
      signatureAsset: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
  return ok(res, profile);
});

professionalRouter.put('/me', async (req, res) => {
  const parsed = professionalSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Dados inválidos para perfil profissional.');

  const profile = await prisma.professionalProfile.upsert({
    where: { userId: req.auth!.sub },
    create: {
      tenantId: req.auth!.tenantId,
      userId: req.auth!.sub,
      ...parsed.data,
    },
    update: parsed.data,
    include: {
      signatureAsset: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return ok(res, profile);
});

professionalRouter.put('/me/signature', async (req, res) => {
  const parsed = z.object({ signatureAssetId: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Assinatura inválida.');

  const profile = await prisma.professionalProfile.upsert({
    where: { userId: req.auth!.sub },
    create: {
      tenantId: req.auth!.tenantId,
      userId: req.auth!.sub,
      licenseCode: 'PENDENTE',
      signatureAssetId: parsed.data.signatureAssetId,
    },
    update: { signatureAssetId: parsed.data.signatureAssetId },
    include: {
      signatureAsset: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return ok(res, profile);
});
