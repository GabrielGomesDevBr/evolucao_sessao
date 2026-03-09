import { Router } from 'express';
import { AuditAction, DocumentType } from '@prisma/client';
import { z } from 'zod';
import { writeAuditLog } from '../../lib/audit.js';
import { prisma } from '../../lib/prisma.js';
import { buildDocumentPdf } from '../../lib/pdf.js';
import { fail, ok } from '../../lib/http.js';

const documentTypeLabels: Record<DocumentType, string> = {
  DECLARATION: 'Declaração',
  CERTIFICATE: 'Atestado psicológico',
  REPORT: 'Relatório psicológico',
  MULTIDISCIPLINARY_REPORT: 'Relatório multiprofissional',
  PSYCHOLOGICAL_EVALUATION: 'Laudo psicológico',
  OPINION: 'Parecer psicológico',
};

const documentSchema = z.object({
  patientId: z.string(),
  type: z.nativeEnum(DocumentType),
  requester: z.string().optional(),
  purpose: z.string().min(5),
  content: z.string().min(10),
  validityText: z.string().optional(),
  shareWithPortal: z.boolean().default(false),
  requiresReturnInterview: z.boolean().default(true),
});

export const documentsRouter = Router();

documentsRouter.get('/', async (req, res) => {
  const documents = await prisma.document.findMany({
    where: { tenantId: req.auth!.tenantId },
    include: { patient: true },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, documents);
});

documentsRouter.get('/:id/pdf', async (req, res) => {
  const document = await prisma.document.findFirst({
    where: { id: req.params.id, tenantId: req.auth!.tenantId },
    include: {
      patient: true,
      tenant: true,
    },
  });
  if (!document) return fail(res, 404, 'Documento não encontrado.');

  const professional = document.authorUserId
    ? await prisma.professionalProfile.findFirst({
      where: {
        tenantId: req.auth!.tenantId,
        userId: document.authorUserId,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })
    : null;

  const pdf = buildDocumentPdf({
    title: documentTypeLabels[document.type] ?? document.type,
    tenantName: document.tenant.brandingName || document.tenant.name,
    patientName: document.patient.socialName || document.patient.fullName,
    purpose: document.purpose,
    content: document.content,
    requester: document.requester,
    validityText: document.validityText,
    createdAt: document.createdAt,
    sharedWithPortal: document.shareWithPortal,
    professionalName: professional?.user ? `${professional.user.firstName} ${professional.user.lastName}` : null,
    professionalLicense: professional?.licenseCode,
    specialty: professional?.specialty,
  });

  await writeAuditLog({
    tenantId: req.auth!.tenantId,
    actorUserId: req.auth!.sub,
    resourceType: 'document',
    resourceId: document.id,
    action: AuditAction.EXPORTED,
    metadata: { patientId: document.patientId, type: document.type, format: 'pdf' },
  });

  const slug = `${documentTypeLabels[document.type] ?? document.type}-${document.patient.fullName}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${slug || document.id}.pdf"`);
  return res.send(pdf);
});

documentsRouter.post('/', async (req, res) => {
  const parsed = documentSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Dados inválidos para documento.');

  const document = await prisma.document.create({
    data: {
      ...parsed.data,
      tenantId: req.auth!.tenantId,
      authorUserId: req.auth!.sub,
      sharedAt: parsed.data.shareWithPortal ? new Date() : undefined,
    },
  });

  await writeAuditLog({
    tenantId: req.auth!.tenantId,
    actorUserId: req.auth!.sub,
    resourceType: 'document',
    resourceId: document.id,
    action: AuditAction.CREATED,
    metadata: { patientId: document.patientId, type: document.type },
  });

  if (document.shareWithPortal) {
    await writeAuditLog({
      tenantId: req.auth!.tenantId,
      actorUserId: req.auth!.sub,
      resourceType: 'document',
      resourceId: document.id,
      action: AuditAction.SHARED,
      metadata: { patientId: document.patientId, type: document.type },
    });
  }

  return ok(res, document);
});

documentsRouter.put('/:id', async (req, res) => {
  const parsed = documentSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Dados inválidos para documento.');

  const existing = await prisma.document.findFirst({
    where: { id: req.params.id, tenantId: req.auth!.tenantId },
  });
  if (!existing) return fail(res, 404, 'Documento não encontrado.');

  const document = await prisma.document.update({
    where: { id: req.params.id },
    data: {
      ...parsed.data,
      sharedAt: parsed.data.shareWithPortal ? existing.sharedAt ?? new Date() : null,
    },
  });

  await writeAuditLog({
    tenantId: req.auth!.tenantId,
    actorUserId: req.auth!.sub,
    resourceType: 'document',
    resourceId: document.id,
    action: AuditAction.UPDATED,
    metadata: { patientId: document.patientId, type: document.type },
  });

  if (!existing.shareWithPortal && document.shareWithPortal) {
    await writeAuditLog({
      tenantId: req.auth!.tenantId,
      actorUserId: req.auth!.sub,
      resourceType: 'document',
      resourceId: document.id,
      action: AuditAction.SHARED,
      metadata: { patientId: document.patientId, type: document.type },
    });
  }

  return ok(res, document);
});

documentsRouter.delete('/:id', async (req, res) => {
  const existing = await prisma.document.findFirst({
    where: { id: req.params.id, tenantId: req.auth!.tenantId },
  });
  if (!existing) return fail(res, 404, 'Documento não encontrado.');

  await prisma.document.delete({ where: { id: req.params.id } });
  await writeAuditLog({
    tenantId: req.auth!.tenantId,
    actorUserId: req.auth!.sub,
    resourceType: 'document',
    resourceId: existing.id,
    action: AuditAction.DELETED,
    metadata: { patientId: existing.patientId, type: existing.type },
  });
  return ok(res, { deleted: true });
});
