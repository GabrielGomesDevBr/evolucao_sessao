import { Router } from 'express';
import { SessionFormat } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { fail, ok } from '../../lib/http.js';

const evolutionSchema = z.object({
  patientId: z.string(),
  appointmentId: z.string().optional(),
  serviceDate: z.string(),
  sessionNumber: z.number().int().optional(),
  durationMinutes: z.number().int().optional(),
  format: z.nativeEnum(SessionFormat).optional(),
  summary: z.string().min(10),
  procedures: z.string().optional(),
  observations: z.string().optional(),
});

export const sessionsRouter = Router();

sessionsRouter.get('/', async (req, res) => {
  const evolutions = await prisma.evolution.findMany({
    where: { tenantId: req.auth!.tenantId },
    include: { patient: true },
    orderBy: { serviceDate: 'desc' },
  });
  return ok(res, evolutions);
});

sessionsRouter.post('/', async (req, res) => {
  const parsed = evolutionSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Dados inválidos para evolução.');

  const evolution = await prisma.evolution.create({
    data: {
      ...parsed.data,
      tenantId: req.auth!.tenantId,
      authorUserId: req.auth!.sub,
      serviceDate: new Date(parsed.data.serviceDate),
    },
  });

  return ok(res, evolution);
});

sessionsRouter.put('/:id', async (req, res) => {
  const parsed = evolutionSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Dados inválidos para evolução.');

  const existing = await prisma.evolution.findFirst({
    where: { id: req.params.id, tenantId: req.auth!.tenantId },
  });
  if (!existing) return fail(res, 404, 'Evolução não encontrada.');

  const evolution = await prisma.evolution.update({
    where: { id: req.params.id },
    data: {
      ...parsed.data,
      serviceDate: new Date(parsed.data.serviceDate),
    },
  });

  return ok(res, evolution);
});

sessionsRouter.delete('/:id', async (req, res) => {
  const existing = await prisma.evolution.findFirst({
    where: { id: req.params.id, tenantId: req.auth!.tenantId },
  });
  if (!existing) return fail(res, 404, 'Evolução não encontrada.');

  await prisma.evolution.delete({ where: { id: req.params.id } });
  return ok(res, { deleted: true });
});
