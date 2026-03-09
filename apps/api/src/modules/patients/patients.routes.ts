import { Router } from 'express';
import { SessionFormat } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { fail, ok } from '../../lib/http.js';

const patientSchema = z.object({
  fullName: z.string().min(3),
  socialName: z.string().optional(),
  birthDate: z.string(),
  cpf: z.string().min(11),
  gender: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  emergencyContact: z.string().optional(),
  guardianName: z.string().optional(),
  profession: z.string().optional(),
  educationLevel: z.string().optional(),
  intakeSource: z.string().optional(),
  arrivalState: z.string().optional(),
  arrivalNotes: z.string().optional(),
  companionName: z.string().optional(),
  previousPsychologicalCare: z.string().optional(),
  demandSummary: z.string().min(10),
  careModality: z.string().optional(),
  careFrequency: z.string().optional(),
  preferredFormat: z.nativeEnum(SessionFormat).optional(),
  treatmentGoals: z.string().optional(),
  allowPortalAccess: z.boolean().optional(),
});

export const patientsRouter = Router();

patientsRouter.get('/', async (req, res) => {
  const tenantId = req.auth!.tenantId;
  const patients = await prisma.patient.findMany({
    where: { tenantId },
    orderBy: { fullName: 'asc' },
    include: { appointments: true, evolutions: true },
  });
  return ok(res, patients);
});

patientsRouter.post('/', async (req, res) => {
  const parsed = patientSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Dados inválidos para paciente.');

  const patient = await prisma.patient.create({
    data: {
      ...parsed.data,
      birthDate: new Date(parsed.data.birthDate),
      tenantId: req.auth!.tenantId,
      createdByUserId: req.auth!.sub,
    },
  });

  return ok(res, patient);
});

patientsRouter.put('/:id', async (req, res) => {
  const parsed = patientSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Dados inválidos para paciente.');

  const existing = await prisma.patient.findFirst({
    where: { id: req.params.id, tenantId: req.auth!.tenantId },
  });
  if (!existing) return fail(res, 404, 'Paciente não encontrado.');

  const patient = await prisma.patient.update({
    where: { id: req.params.id },
    data: {
      ...parsed.data,
      birthDate: new Date(parsed.data.birthDate),
    },
  });

  return ok(res, patient);
});

patientsRouter.delete('/:id', async (req, res) => {
  const existing = await prisma.patient.findFirst({
    where: { id: req.params.id, tenantId: req.auth!.tenantId },
  });
  if (!existing) return fail(res, 404, 'Paciente não encontrado.');

  await prisma.patient.delete({ where: { id: req.params.id } });
  return ok(res, { deleted: true });
});
