import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

export async function writeAuditLog(input: {
  tenantId: string;
  actorUserId?: string;
  resourceType: string;
  resourceId: string;
  action: AuditAction;
  metadata?: unknown;
}) {
  return prisma.auditLog.create({
    data: {
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      action: input.action,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
