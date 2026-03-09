import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { storageRoot } from './lib/storage.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { requireAuth, requireRole } from './modules/auth/auth.middleware.js';
import { requirePin } from './modules/auth/pin.middleware.js';
import { patientsRouter } from './modules/patients/patients.routes.js';
import { calendarRouter } from './modules/calendar/calendar.routes.js';
import { sessionsRouter } from './modules/sessions/sessions.routes.js';
import { recordsRouter } from './modules/records/records.routes.js';
import { documentsRouter } from './modules/documents/documents.routes.js';
import { uploadsRouter } from './modules/uploads/uploads.routes.js';
import { portalInternalRouter, portalPublicRouter } from './modules/portal/portal.routes.js';
import { professionalRouter } from './modules/professional/professional.routes.js';
import { assistantRouter } from './modules/assistant/assistant.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { settingsRouter } from './modules/settings/settings.routes.js';

const app = express();
const clinicalRoles = ['OWNER', 'ADMIN', 'PROFESSIONAL', 'INTERN'];
const operationsRoles = ['OWNER', 'ADMIN', 'PROFESSIONAL', 'RECEPTION', 'INTERN'];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      const allowed = [
        env.APP_URL,
        'http://localhost:4173',
        'http://localhost:4174',
        'http://127.0.0.1:4173',
        'http://127.0.0.1:4174',
      ];

      if (
        allowed.includes(origin) ||
        /^http:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin) ||
        /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use('/storage', express.static(storageRoot));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', name: 'LumniPsi API' });
});

app.use('/auth', authRouter);
app.use('/portal', portalPublicRouter);
app.use('/patients', requireAuth, requireRole(operationsRoles), patientsRouter);
app.use('/calendar', requireAuth, requireRole(operationsRoles), calendarRouter);
app.use('/sessions', requireAuth, requireRole(clinicalRoles), sessionsRouter);
app.use('/documents', requireAuth, requireRole(clinicalRoles), documentsRouter);
app.use('/uploads', requireAuth, uploadsRouter);
app.use('/portal', requireAuth, requireRole(operationsRoles), portalInternalRouter);
app.use('/professional', requireAuth, requireRole(operationsRoles), professionalRouter);
app.use('/assistant', requireAuth, requireRole(clinicalRoles), assistantRouter);
app.use('/notifications', requireAuth, notificationsRouter);
app.use('/settings', requireAuth, requireRole(['OWNER', 'ADMIN']), settingsRouter);
app.use('/records', requireAuth, requireRole(clinicalRoles), requirePin, recordsRouter);
app.use('/admin/users', requireAuth, requireRole(['OWNER', 'ADMIN']), (_req, res) => {
  res.json({ data: [] });
});

app.listen(env.PORT, () => {
  console.log(`LumniPsi API on http://localhost:${env.PORT}`);
});
