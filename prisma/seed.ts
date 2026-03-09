import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, AppointmentMode, AppointmentStatus, AuditAction, DocumentType, MembershipRole, NotificationType, RecordSensitivity, SessionFormat } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const password = 'LumniPsi@123';
  const receptionistPassword = 'Recepcao@123';
  const portalPassword = 'Portal@123';
  const pin = '4321';

  const passwordHash = await bcrypt.hash(password, 10);
  const receptionistHash = await bcrypt.hash(receptionistPassword, 10);
  const portalHash = await bcrypt.hash(portalPassword, 10);
  const pinHash = await bcrypt.hash(pin, 10);

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Clínica LumniPsi Demo',
      slug: 'clinica-lumnipsi-demo',
      brandingName: 'LumniPsi',
    },
  });

  const owner = await prisma.user.create({
    data: {
      email: 'demo@lumnipsi.app',
      passwordHash,
      pinHash,
      firstName: 'Lia',
      lastName: 'Ramos',
    },
  });

  const receptionist = await prisma.user.create({
    data: {
      email: 'recepcao@lumnipsi.app',
      passwordHash: receptionistHash,
      firstName: 'Caio',
      lastName: 'Moura',
    },
  });

  await prisma.membership.createMany({
    data: [
      { tenantId: tenant.id, userId: owner.id, role: MembershipRole.OWNER },
      { tenantId: tenant.id, userId: receptionist.id, role: MembershipRole.RECEPTION },
    ],
  });

  await prisma.professionalProfile.create({
    data: {
      tenantId: tenant.id,
      userId: owner.id,
      licenseCode: 'CRP-06/123456',
      specialty: 'Psicologia Clínica',
      city: 'São Paulo',
      state: 'SP',
      phone: '(11) 98888-0000',
    },
  });

  const patientHelena = await prisma.patient.create({
    data: {
      tenantId: tenant.id,
      createdByUserId: owner.id,
      fullName: 'Helena Duarte',
      socialName: 'Helena',
      birthDate: new Date('1992-08-21'),
      cpf: '12345678900',
      gender: 'Feminino',
      phone: '(11) 99999-1201',
      email: 'helena@example.com',
      emergencyContact: 'Clara Duarte (11) 97777-8888',
      demandSummary: 'Busca acompanhamento psicológico por sintomas ansiosos com impacto funcional, incluindo alterações de sono e preocupação recorrente.',
      careModality: 'Psicoterapia individual',
      careFrequency: 'Semanal',
      preferredFormat: SessionFormat.IN_PERSON,
      treatmentGoals: 'Favorecer regulação emocional, manejo de ansiedade e ampliação de recursos de enfrentamento.',
      allowPortalAccess: true,
    },
  });

  const patientLucas = await prisma.patient.create({
    data: {
      tenantId: tenant.id,
      createdByUserId: owner.id,
      fullName: 'Lucas Menezes',
      birthDate: new Date('1988-04-02'),
      cpf: '98765432100',
      gender: 'Masculino',
      phone: '(11) 98888-1102',
      email: 'lucas@example.com',
      demandSummary: 'Busca acolhimento por sintomas depressivos, desmotivação e perda de interesse em atividades habituais.',
      careModality: 'Avaliação psicológica',
      careFrequency: 'Quinzenal',
      preferredFormat: SessionFormat.ONLINE,
      treatmentGoals: 'Investigar funcionamento emocional e elaborar devolutiva técnica compatível com a finalidade declarada.',
    },
  });

  const patientMarina = await prisma.patient.create({
    data: {
      tenantId: tenant.id,
      createdByUserId: owner.id,
      fullName: 'Marina Vasconcelos',
      birthDate: new Date('2016-11-15'),
      cpf: '53241122200',
      gender: 'Feminino',
      guardianName: 'Patrícia Vasconcelos',
      phone: '(11) 97777-2233',
      email: 'responsavel.marina@example.com',
      demandSummary: 'Atendimento solicitado para orientação de responsáveis sobre desenvolvimento infantil, rotina e manejo emocional.',
      careModality: 'Atendimento infantil',
      careFrequency: 'Semanal',
      preferredFormat: SessionFormat.IN_PERSON,
      treatmentGoals: 'Oferecer acolhimento lúdico e orientação a responsáveis sobre manejo e rotina.',
      allowPortalAccess: true,
    },
  });

  await prisma.portalAccount.create({
    data: {
      tenantId: tenant.id,
      patientId: patientHelena.id,
      email: 'portal.helena@example.com',
      passwordHash: portalHash,
      displayName: 'Helena Duarte',
      role: MembershipRole.PATIENT,
      invitedAt: new Date(),
    },
  });

  await prisma.portalAccount.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMarina.id,
      email: 'portal.responsavel.marina@example.com',
      passwordHash: portalHash,
      displayName: 'Patrícia Vasconcelos',
      role: MembershipRole.GUARDIAN,
      invitedAt: new Date(),
    },
  });

  const appointmentHelena = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      patientId: patientHelena.id,
      createdByUserId: owner.id,
      title: 'Sessão individual',
      description: 'Acompanhamento semanal',
      startsAt: new Date('2026-03-10T09:00:00-03:00'),
      endsAt: new Date('2026-03-10T09:50:00-03:00'),
      status: AppointmentStatus.CONFIRMED,
      mode: AppointmentMode.IN_PERSON,
      colorToken: 'lagoon',
    },
  });

  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      patientId: patientLucas.id,
      createdByUserId: owner.id,
      title: 'Devolutiva de avaliação',
      startsAt: new Date('2026-03-11T11:00:00-03:00'),
      endsAt: new Date('2026-03-11T11:45:00-03:00'),
      status: AppointmentStatus.SCHEDULED,
      mode: AppointmentMode.ONLINE,
      videoUrl: 'https://meet.example.com/lucas',
      colorToken: 'coral',
    },
  });

  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      createdByUserId: receptionist.id,
      title: 'Bloqueio administrativo',
      startsAt: new Date('2026-03-12T14:00:00-03:00'),
      endsAt: new Date('2026-03-12T15:00:00-03:00'),
      status: AppointmentStatus.BLOCKED,
      mode: AppointmentMode.IN_PERSON,
      isBlocked: true,
      internalNotes: 'Tempo reservado para elaboração de documentos clínicos.',
      colorToken: 'plum',
    },
  });

  await prisma.evolution.createMany({
    data: [
      {
        tenantId: tenant.id,
        patientId: patientHelena.id,
        authorUserId: owner.id,
        appointmentId: appointmentHelena.id,
        serviceDate: new Date('2026-03-03T09:00:00-03:00'),
        sessionNumber: 12,
        durationMinutes: 50,
        format: SessionFormat.IN_PERSON,
        summary: 'Pessoa atendida compareceu no horário agendado, apresentou-se colaborativa e com discurso coerente. Foram trabalhados conteúdos relacionados à ansiedade antecipatória e ao manejo de sobrecarga na rotina.',
        procedures: 'Escuta clínica qualificada, identificação de pensamentos automáticos e reestruturação cognitiva inicial.',
        observations: 'Mantido acompanhamento psicológico, com monitoramento contínuo da demanda apresentada.',
      },
      {
        tenantId: tenant.id,
        patientId: patientLucas.id,
        authorUserId: owner.id,
        serviceDate: new Date('2026-03-04T11:00:00-03:00'),
        sessionNumber: 4,
        durationMinutes: 45,
        format: SessionFormat.ONLINE,
        summary: 'Sessão voltada ao acolhimento de sofrimento psíquico atual, com exploração de fatores precipitantes e manutenção do quadro. Observou-se maior capacidade de nomeação emocional.',
        procedures: 'Entrevista clínica semiestruturada, avaliação de fatores de risco e psicoeducação sobre sinais de agravamento.',
        observations: 'A entrevista devolutiva deverá ser registrada em momento oportuno, quando houver emissão de relatório ou laudo.',
      },
    ],
  });

  await prisma.restrictedRecord.create({
    data: {
      tenantId: tenant.id,
      patientId: patientHelena.id,
      authorUserId: owner.id,
      recordDate: new Date('2026-03-03T10:10:00-03:00'),
      category: 'Hipótese diagnóstica',
      content: 'Registro reservado voltado à formulação clínica e hipóteses em acompanhamento, sem compartilhamento em prontuário acessível.',
      rationale: 'Discussão clínica baseada em raciocínio técnico e observação longitudinal.',
      sensitivity: RecordSensitivity.HIGH,
    },
  });

  await prisma.document.createMany({
    data: [
      {
        tenantId: tenant.id,
        patientId: patientHelena.id,
        authorUserId: owner.id,
        type: DocumentType.DECLARATION,
        purpose: 'Comprovar comparecimento da pessoa atendida ao serviço psicológico em data específica.',
        content: 'Declaração de comparecimento referente ao atendimento psicológico realizado em 03/03/2026.',
        shareWithPortal: true,
        sharedAt: new Date(),
      },
      {
        tenantId: tenant.id,
        patientId: patientLucas.id,
        authorUserId: owner.id,
        type: DocumentType.PSYCHOLOGICAL_EVALUATION,
        purpose: 'Oferecer devolutiva documentada sobre processo de avaliação psicológica realizado em período delimitado.',
        content: 'Laudo psicológico em elaboração com comunicação técnica, objetiva e proporcional à finalidade declarada.',
        requiresReturnInterview: true,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        tenantId: tenant.id,
        userId: owner.id,
        type: NotificationType.INTERNAL,
        title: 'PIN secundário configurado',
        body: 'Área restrita pronta para uso no ambiente de demonstração.',
      },
      {
        tenantId: tenant.id,
        userId: receptionist.id,
        type: NotificationType.SYSTEM,
        title: 'Agenda inicial carregada',
        body: 'Existem 3 compromissos de demonstração cadastrados.',
      },
    ],
  });

  const thread = await prisma.assistantThread.create({
    data: {
      tenantId: tenant.id,
      title: 'Primeira conversa',
    },
  });

  await prisma.assistantMessage.createMany({
    data: [
      {
        threadId: thread.id,
        authorUserId: owner.id,
        role: 'user',
        content: 'Quais cuidados devo ter ao emitir um relatório psicológico?',
      },
      {
        threadId: thread.id,
        role: 'assistant',
        content: 'Priorize finalidade específica, linguagem técnica objetiva, proteção do sigilo e evite transcrição literal de sessão, salvo justificativa técnica.',
      },
    ],
  });

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      actorUserId: owner.id,
      resourceType: 'seed',
      resourceId: tenant.id,
      action: AuditAction.CREATED,
      metadata: {
        seededUsers: ['demo@lumnipsi.app', 'recepcao@lumnipsi.app'],
        portalAccounts: ['portal.helena@example.com', 'portal.responsavel.marina@example.com'],
      },
    },
  });

  console.log('Seed concluído.');
  console.log('Owner:', 'demo@lumnipsi.app', password);
  console.log('Recepção:', 'recepcao@lumnipsi.app', receptionistPassword);
  console.log('Portal:', 'portal.helena@example.com', portalPassword);
  console.log('PIN owner:', pin);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
