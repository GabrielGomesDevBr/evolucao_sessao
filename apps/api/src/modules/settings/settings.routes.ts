import { Router } from 'express';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { fail, ok } from '../../lib/http.js';
import { writeAuditLog } from '../../lib/audit.js';

const tenantPolicySchema = z.object({
  recordRetentionYears: z.number().int().min(1).max(50),
  healthDataRetentionYears: z.number().int().min(1).max(50),
  disposalMode: z.enum(['ANONYMIZE', 'DELETE']),
  disposalWindowDays: z.number().int().min(1).max(3650),
  requireDocumentShareConsent: z.boolean(),
});

export const settingsRouter = Router();

settingsRouter.get('/tenant', async (req, res) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.auth!.tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      brandingName: true,
      recordRetentionYears: true,
      healthDataRetentionYears: true,
      disposalMode: true,
      disposalWindowDays: true,
      requireDocumentShareConsent: true,
    },
  });

  if (!tenant) return fail(res, 404, 'Tenant não encontrado.');
  return ok(res, tenant);
});

settingsRouter.put('/tenant', async (req, res) => {
  const parsed = tenantPolicySchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Política institucional inválida.');

  const tenant = await prisma.tenant.update({
    where: { id: req.auth!.tenantId },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      slug: true,
      brandingName: true,
      recordRetentionYears: true,
      healthDataRetentionYears: true,
      disposalMode: true,
      disposalWindowDays: true,
      requireDocumentShareConsent: true,
    },
  });

  await writeAuditLog({
    tenantId: req.auth!.tenantId,
    actorUserId: req.auth!.sub,
    resourceType: 'tenant_policy',
    resourceId: tenant.id,
    action: AuditAction.UPDATED,
    metadata: parsed.data,
  });

  return ok(res, tenant);
});
