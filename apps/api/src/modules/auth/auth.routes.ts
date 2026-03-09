import { Router } from 'express';
import { AuditAction, MembershipRole } from '@prisma/client';
import { z } from 'zod';
import { compareValue, hashValue, signAccessToken, signPinToken, signRefreshToken, verifyRefreshToken } from '../../lib/auth.js';
import { ok, fail } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import { writeAuditLog } from '../../lib/audit.js';
import { requireAuth } from './auth.middleware.js';

const registerSchema = z.object({
  tenantName: z.string().min(3),
  tenantSlug: z.string().min(3),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  licenseCode: z.string().min(3),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const pinSchema = z.object({
  pin: z.string().min(4).max(12),
});

export const authRouter = Router();

function issueAuthTokens(input: {
  sub: string;
  tenantId: string;
  role: MembershipRole;
  email: string;
}) {
  return {
    token: signAccessToken({
      sub: input.sub,
      tenantId: input.tenantId,
      role: input.role,
      email: input.email,
    }),
    refreshToken: signRefreshToken({
      sub: input.sub,
      tenantId: input.tenantId,
      role: input.role,
      email: input.email,
      scope: 'refresh',
    }),
    expiresInMinutes: 60,
  };
}

function toSafeUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  memberships?: Array<{ id: string; tenantId: string; userId: string; role: MembershipRole; createdAt: Date }>;
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    memberships: user.memberships,
  };
}

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Dados inválidos para cadastro.');

  const { tenantName, tenantSlug, firstName, lastName, email, password, licenseCode } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return fail(res, 409, 'E-mail já cadastrado.');

  const passwordHash = await hashValue(password);
  const tenant = await prisma.tenant.create({
    data: {
      name: tenantName,
      slug: tenantSlug,
      brandingName: 'LumniPsi',
    },
  });

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
    },
  });

  await prisma.membership.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      role: MembershipRole.OWNER,
    },
  });

  await prisma.professionalProfile.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      licenseCode,
    },
  });

  const auth = issueAuthTokens({
    sub: user.id,
    tenantId: tenant.id,
    role: MembershipRole.OWNER,
    email: user.email,
  });

  await writeAuditLog({
    tenantId: tenant.id,
    actorUserId: user.id,
    resourceType: 'user',
    resourceId: user.id,
    action: AuditAction.CREATED,
    metadata: { email },
  });

  return ok(res, { ...auth, tenantId: tenant.id, role: MembershipRole.OWNER, user: toSafeUser(user) });
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Dados inválidos para login.');

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { memberships: true },
  });
  if (!user) return fail(res, 401, 'Credenciais inválidas.');

  const valid = await compareValue(parsed.data.password, user.passwordHash);
  if (!valid) return fail(res, 401, 'Credenciais inválidas.');

  const membership = user.memberships[0];
  if (!membership) return fail(res, 403, 'Usuário sem tenant vinculado.');

  const auth = issueAuthTokens({
    sub: user.id,
    tenantId: membership.tenantId,
    role: membership.role,
    email: user.email,
  });

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  await writeAuditLog({
    tenantId: membership.tenantId,
    actorUserId: user.id,
    resourceType: 'auth',
    resourceId: user.id,
    action: AuditAction.AUTHENTICATED,
    metadata: { email: user.email, role: membership.role },
  });

  return ok(res, { ...auth, tenantId: membership.tenantId, role: membership.role, user: toSafeUser(user) });
});

authRouter.post('/refresh', async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Refresh token inválido.');

  let payload;
  try {
    payload = verifyRefreshToken(parsed.data.refreshToken);
  } catch {
    return fail(res, 401, 'Refresh token inválido ou expirado.');
  }

  if (payload.scope !== 'refresh') return fail(res, 401, 'Escopo inválido para refresh token.');

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { memberships: true },
  });
  if (!user?.isActive) return fail(res, 401, 'Usuário inativo ou inexistente.');

  const membership = user.memberships.find((item) => item.tenantId === payload.tenantId);
  if (!membership) return fail(res, 403, 'Tenant não encontrado para este usuário.');

  const auth = issueAuthTokens({
    sub: user.id,
    tenantId: membership.tenantId,
    role: membership.role,
    email: user.email,
  });

  await writeAuditLog({
    tenantId: membership.tenantId,
    actorUserId: user.id,
    resourceType: 'auth',
    resourceId: user.id,
    action: AuditAction.AUTHENTICATED,
    metadata: { via: 'refresh', role: membership.role },
  });

  return ok(res, { ...auth, tenantId: membership.tenantId, role: membership.role, user: toSafeUser(user) });
});

authRouter.post('/pin', requireAuth, async (req, res) => {
  const parsed = pinSchema.safeParse(req.body);
  if (!parsed.success || !req.auth) return fail(res, 400, 'PIN inválido.');

  const user = await prisma.user.findUnique({ where: { id: req.auth.sub } });
  if (!user?.pinHash) return fail(res, 404, 'PIN secundário não configurado.');

  const valid = await compareValue(parsed.data.pin, user.pinHash);
  if (!valid) return fail(res, 401, 'PIN incorreto.');

  const pinToken = signPinToken({
    sub: req.auth.sub,
    tenantId: req.auth.tenantId,
    scope: 'pin',
  });

  await writeAuditLog({
    tenantId: req.auth.tenantId,
    actorUserId: req.auth.sub,
    resourceType: 'auth',
    resourceId: req.auth.sub,
    action: AuditAction.PIN_VERIFIED,
    metadata: { expiresInMinutes: 15 },
  });

  return ok(res, { verified: true, pinToken, expiresInMinutes: 15 });
});

authRouter.post('/pin/setup', requireAuth, async (req, res) => {
  const parsed = pinSchema.safeParse(req.body);
  if (!parsed.success || !req.auth) return fail(res, 400, 'PIN inválido.');

  const pinHash = await hashValue(parsed.data.pin);
  await prisma.user.update({ where: { id: req.auth.sub }, data: { pinHash } });
  await writeAuditLog({
    tenantId: req.auth.tenantId,
    actorUserId: req.auth.sub,
    resourceType: 'auth',
    resourceId: req.auth.sub,
    action: AuditAction.UPDATED,
    metadata: { target: 'pin' },
  });
  return ok(res, { configured: true });
});
