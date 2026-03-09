import { Router } from 'express';
import { AppointmentMode, AppointmentStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { fail, ok } from '../../lib/http.js';

const appointmentSchema = z.object({
  patientId: z.string().optional(),
  title: z.string().min(3),
  description: z.string().optional(),
  startsAt: z.string(),
  endsAt: z.string(),
  status: z.nativeEnum(AppointmentStatus).default(AppointmentStatus.SCHEDULED),
  mode: z.nativeEnum(AppointmentMode).default(AppointmentMode.IN_PERSON),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
  isBlocked: z.boolean().default(false),
  colorToken: z.string().optional(),
  location: z.string().optional(),
  videoUrl: z.string().optional(),
  internalNotes: z.string().optional(),
});

export const calendarRouter = Router();

calendarRouter.get('/', async (req, res) => {
  const tenantId = req.auth!.tenantId;
  const { from, to } = req.query;

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      startsAt: from || to ? {
        gte: from ? new Date(String(from)) : undefined,
        lte: to ? new Date(String(to)) : undefined,
      } : undefined,
    },
    include: { patient: true },
    orderBy: { startsAt: 'asc' },
  });

  return ok(res, appointments);
});

calendarRouter.post('/', async (req, res) => {
  const parsed = appointmentSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Dados inválidos para agendamento.');

  const appointment = await prisma.appointment.create({
    data: {
      ...parsed.data,
      tenantId: req.auth!.tenantId,
      createdByUserId: req.auth!.sub,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: new Date(parsed.data.endsAt),
    },
    include: { patient: true },
  });

  return ok(res, appointment);
});

calendarRouter.put('/:id', async (req, res) => {
  const parsed = appointmentSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Dados inválidos para agendamento.');

  const existing = await prisma.appointment.findFirst({
    where: { id: req.params.id, tenantId: req.auth!.tenantId },
  });
  if (!existing) return fail(res, 404, 'Agendamento não encontrado.');

  const appointment = await prisma.appointment.update({
    where: { id: req.params.id },
    data: {
      ...parsed.data,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: new Date(parsed.data.endsAt),
    },
    include: { patient: true },
  });

  return ok(res, appointment);
});

calendarRouter.delete('/:id', async (req, res) => {
  const existing = await prisma.appointment.findFirst({
    where: { id: req.params.id, tenantId: req.auth!.tenantId },
  });
  if (!existing) return fail(res, 404, 'Agendamento não encontrado.');

  await prisma.appointment.delete({ where: { id: req.params.id } });
  return ok(res, { deleted: true });
});
