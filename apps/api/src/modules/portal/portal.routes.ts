import { Router } from 'express';
import { AuditAction, MembershipRole } from '@prisma/client';
import { z } from 'zod';
import { compareValue, hashValue, signPortalToken } from '../../lib/auth.js';
import { writeAuditLog } from '../../lib/audit.js';
import { prisma } from '../../lib/prisma.js';
import { fail, ok } from '../../lib/http.js';
import { requirePortalAuth } from './portal-auth.middleware.js';

const portalInviteSchema = z.object({
  patientId: z.string(),
  email: z.string().email(),
  displayName: z.string().min(3),
  password: z.string().min(8),
  role: z.union([z.literal(MembershipRole.PATIENT), z.literal(MembershipRole.GUARDIAN)]),
});

const portalLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const portalAccountUpdateSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(3),
  role: z.union([z.literal(MembershipRole.PATIENT), z.literal(MembershipRole.GUARDIAN)]),
});

const portalPasswordResetSchema = z.object({
  password: z.string().min(8),
});

function toSafePortalAccount(account: {
  id: string;
  tenantId: string;
  patientId: string;
  email: string;
  displayName: string;
  role: MembershipRole;
  isActive: boolean;
  invitedAt: Date | null;
  lastLoginAt: Date | null;
  revokedAt: Date | null;
  revokedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  patient?: { id: string; fullName: string; socialName: string | null } | null;
}) {
  return {
    id: account.id,
    tenantId: account.tenantId,
    patientId: account.patientId,
    email: account.email,
    displayName: account.displayName,
    role: account.role,
    isActive: account.isActive,
    invitedAt: account.invitedAt,
    lastLoginAt: account.lastLoginAt,
    revokedAt: account.revokedAt,
    revokedReason: account.revokedReason,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    patient: account.patient,
  };
}

export const portalPublicRouter = Router();
export const portalInternalRouter = Router();

portalPublicRouter.post('/auth/login', async (req, res) => {
  const parsed = portalLoginSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Dados inválidos para login do portal.');

  const account = await prisma.portalAccount.findFirst({
    where: { email: parsed.data.email, isActive: true },
    include: { patient: { select: { id: true, fullName: true, socialName: true } } },
  });
  if (!account) return fail(res, 401, 'Credenciais inválidas.');

  const valid = await compareValue(parsed.data.password, account.passwordHash);
  if (!valid) return fail(res, 401, 'Credenciais inválidas.');

  const token = signPortalToken({
    sub: account.id,
    tenantId: account.tenantId,
    patientId: account.patientId,
    role: account.role,
    email: account.email,
    scope: 'portal',
  });

  await prisma.portalAccount.update({ where: { id: account.id }, data: { lastLoginAt: new Date() } });
  await writeAuditLog({
    tenantId: account.tenantId,
    resourceType: 'portal_auth',
    resourceId: account.id,
    action: AuditAction.AUTHENTICATED,
    metadata: { patientId: account.patientId, email: account.email, role: account.role },
  });

  return ok(res, { token, account: toSafePortalAccount(account) });
});

portalPublicRouter.get('/me', requirePortalAuth, async (req, res) => {
  const account = await prisma.portalAccount.findUnique({
    where: { id: req.portalAuth!.sub },
    include: { patient: { select: { id: true, fullName: true, socialName: true } } },
  });
  if (!account) return fail(res, 404, 'Conta do portal não encontrada.');
  return ok(res, toSafePortalAccount(account));
});

portalPublicRouter.get('/me/documents', requirePortalAuth, async (req, res) => {
  const documents = await prisma.document.findMany({
    where: {
      tenantId: req.portalAuth!.tenantId,
      patientId: req.portalAuth!.patientId,
      shareWithPortal: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, documents);
});

portalPublicRouter.get('/me/appointments', requirePortalAuth, async (req, res) => {
  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId: req.portalAuth!.tenantId,
      patientId: req.portalAuth!.patientId,
    },
    orderBy: { startsAt: 'asc' },
  });
  return ok(res, appointments);
});

portalInternalRouter.get('/accounts', async (req, res) => {
  const accounts = await prisma.portalAccount.findMany({
    where: { tenantId: req.auth!.tenantId },
    include: { patient: { select: { id: true, fullName: true, socialName: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, accounts.map(toSafePortalAccount));
});

portalInternalRouter.post('/accounts', async (req, res) => {
  const parsed = portalInviteSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Dados inválidos para conta do portal.');

  const passwordHash = await hashValue(parsed.data.password);
  const account = await prisma.portalAccount.create({
    data: {
      tenantId: req.auth!.tenantId,
      patientId: parsed.data.patientId,
      email: parsed.data.email,
      displayName: parsed.data.displayName,
      passwordHash,
      role: parsed.data.role,
      invitedAt: new Date(),
      revokedAt: null,
      revokedReason: null,
    },
    include: { patient: { select: { id: true, fullName: true, socialName: true } } },
  });

  await writeAuditLog({
    tenantId: req.auth!.tenantId,
    actorUserId: req.auth!.sub,
    resourceType: 'portal_account',
    resourceId: account.id,
    action: AuditAction.CREATED,
    metadata: { patientId: account.patientId, role: account.role, email: account.email },
  });

  return ok(res, toSafePortalAccount(account));
});

portalInternalRouter.patch('/accounts/:id/revoke', async (req, res) => {
  const parsed = z.object({ reason: z.string().min(3) }).safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Motivo de revogação inválido.');

  const existing = await prisma.portalAccount.findFirst({
    where: { id: req.params.id, tenantId: req.auth!.tenantId },
    include: { patient: { select: { id: true, fullName: true, socialName: true } } },
  });
  if (!existing) return fail(res, 404, 'Conta do portal não encontrada.');

  const account = await prisma.portalAccount.update({
    where: { id: existing.id },
    data: {
      isActive: false,
      revokedAt: new Date(),
      revokedReason: parsed.data.reason,
    },
    include: { patient: { select: { id: true, fullName: true, socialName: true } } },
  });

  await writeAuditLog({
    tenantId: req.auth!.tenantId,
    actorUserId: req.auth!.sub,
    resourceType: 'portal_account',
    resourceId: account.id,
    action: AuditAction.UPDATED,
    metadata: { status: 'revoked', reason: parsed.data.reason, patientId: account.patientId },
  });

  return ok(res, toSafePortalAccount(account));
});

portalInternalRouter.patch('/accounts/:id', async (req, res) => {
  const parsed = portalAccountUpdateSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Dados inválidos para atualização da conta do portal.');

  const existing = await prisma.portalAccount.findFirst({
    where: { id: req.params.id, tenantId: req.auth!.tenantId },
    include: { patient: { select: { id: true, fullName: true, socialName: true } } },
  });
  if (!existing) return fail(res, 404, 'Conta do portal não encontrada.');

  const account = await prisma.portalAccount.update({
    where: { id: existing.id },
    data: parsed.data,
    include: { patient: { select: { id: true, fullName: true, socialName: true } } },
  });

  await writeAuditLog({
    tenantId: req.auth!.tenantId,
    actorUserId: req.auth!.sub,
    resourceType: 'portal_account',
    resourceId: account.id,
    action: AuditAction.UPDATED,
    metadata: { status: 'edited', email: account.email, role: account.role, patientId: account.patientId },
  });

  return ok(res, toSafePortalAccount(account));
});

portalInternalRouter.patch('/accounts/:id/reactivate', async (req, res) => {
  const existing = await prisma.portalAccount.findFirst({
    where: { id: req.params.id, tenantId: req.auth!.tenantId },
    include: { patient: { select: { id: true, fullName: true, socialName: true } } },
  });
  if (!existing) return fail(res, 404, 'Conta do portal não encontrada.');

  const account = await prisma.portalAccount.update({
    where: { id: existing.id },
    data: {
      isActive: true,
      revokedAt: null,
      revokedReason: null,
    },
    include: { patient: { select: { id: true, fullName: true, socialName: true } } },
  });

  await writeAuditLog({
    tenantId: req.auth!.tenantId,
    actorUserId: req.auth!.sub,
    resourceType: 'portal_account',
    resourceId: account.id,
    action: AuditAction.UPDATED,
    metadata: { status: 'reactivated', patientId: account.patientId },
  });

  return ok(res, toSafePortalAccount(account));
});

portalInternalRouter.post('/accounts/:id/reset-password', async (req, res) => {
  const parsed = portalPasswordResetSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Senha inválida para redefinição.');

  const existing = await prisma.portalAccount.findFirst({
    where: { id: req.params.id, tenantId: req.auth!.tenantId },
    include: { patient: { select: { id: true, fullName: true, socialName: true } } },
  });
  if (!existing) return fail(res, 404, 'Conta do portal não encontrada.');

  const passwordHash = await hashValue(parsed.data.password);
  const account = await prisma.portalAccount.update({
    where: { id: existing.id },
    data: { passwordHash },
    include: { patient: { select: { id: true, fullName: true, socialName: true } } },
  });

  await writeAuditLog({
    tenantId: req.auth!.tenantId,
    actorUserId: req.auth!.sub,
    resourceType: 'portal_account',
    resourceId: account.id,
    action: AuditAction.UPDATED,
    metadata: { status: 'password_reset', patientId: account.patientId },
  });

  return ok(res, toSafePortalAccount(account));
});

portalInternalRouter.get('/documents/:patientId', async (req, res) => {
  const documents = await prisma.document.findMany({
    where: {
      tenantId: req.auth!.tenantId,
      patientId: req.params.patientId,
      shareWithPortal: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return ok(res, documents);
});
