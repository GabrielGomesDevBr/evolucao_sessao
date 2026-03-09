import { Router } from 'express';
import { AuditAction, RecordSensitivity } from '@prisma/client';
import { z } from 'zod';
import { writeAuditLog } from '../../lib/audit.js';
import { prisma } from '../../lib/prisma.js';
import { fail, ok } from '../../lib/http.js';

const recordSchema = z.object({
  patientId: z.string(),
  recordDate: z.string(),
  category: z.string().optional(),
  content: z.string().min(10),
  cidCode: z.string().optional(),
  instruments: z.string().optional(),
  rationale: z.string().optional(),
  reservedNotes: z.string().optional(),
  attachmentLabel: z.string().optional(),
  sensitivity: z.nativeEnum(RecordSensitivity).default(RecordSensitivity.NORMAL),
});

export const recordsRouter = Router();

recordsRouter.get('/', async (req, res) => {
  const records = await prisma.restrictedRecord.findMany({
    where: { tenantId: req.auth!.tenantId },
    include: { patient: true },
    orderBy: { recordDate: 'desc' },
  });
  return ok(res, records);
});

recordsRouter.post('/', async (req, res) => {
  const parsed = recordSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Dados inválidos para registro restrito.');

  const record = await prisma.restrictedRecord.create({
    data: {
      ...parsed.data,
      tenantId: req.auth!.tenantId,
      authorUserId: req.auth!.sub,
      recordDate: new Date(parsed.data.recordDate),
    },
  });

  await writeAuditLog({
    tenantId: req.auth!.tenantId,
    actorUserId: req.auth!.sub,
    resourceType: 'restricted_record',
    resourceId: record.id,
    action: AuditAction.CREATED,
    metadata: { patientId: record.patientId, sensitivity: record.sensitivity },
  });

  return ok(res, record);
});

recordsRouter.put('/:id', async (req, res) => {
  const parsed = recordSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Dados inválidos para registro restrito.');

  const existing = await prisma.restrictedRecord.findFirst({
    where: { id: req.params.id, tenantId: req.auth!.tenantId },
  });
  if (!existing) return fail(res, 404, 'Registro restrito não encontrado.');

  const record = await prisma.restrictedRecord.update({
    where: { id: req.params.id },
    data: {
      ...parsed.data,
      recordDate: new Date(parsed.data.recordDate),
    },
  });

  await writeAuditLog({
    tenantId: req.auth!.tenantId,
    actorUserId: req.auth!.sub,
    resourceType: 'restricted_record',
    resourceId: record.id,
    action: AuditAction.UPDATED,
    metadata: { patientId: record.patientId, sensitivity: record.sensitivity },
  });

  return ok(res, record);
});

recordsRouter.delete('/:id', async (req, res) => {
  const existing = await prisma.restrictedRecord.findFirst({
    where: { id: req.params.id, tenantId: req.auth!.tenantId },
  });
  if (!existing) return fail(res, 404, 'Registro restrito não encontrado.');

  await prisma.restrictedRecord.delete({ where: { id: req.params.id } });
  await writeAuditLog({
    tenantId: req.auth!.tenantId,
    actorUserId: req.auth!.sub,
    resourceType: 'restricted_record',
    resourceId: existing.id,
    action: AuditAction.DELETED,
    metadata: { patientId: existing.patientId, sensitivity: existing.sensitivity },
  });
  return ok(res, { deleted: true });
});
