import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { buildLiveHealthPayload, buildReadyHealthPayload, resolveReadyStatusCode } from './lib/health.js';
import { handleUnexpectedError } from './lib/http.js';
import { logger } from './lib/logger.js';
import { checkDatabaseHealth } from './lib/prisma.js';
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

type HealthCheckResult = Awaited<ReturnType<typeof checkDatabaseHealth>>;

type AppDependencies = {
  checkHealth?: () => Promise<HealthCheckResult>;
  isShuttingDown?: () => boolean;
};

export function buildApp(dependencies: AppDependencies = {}) {
  const app = express();
  const clinicalRoles = ['OWNER', 'ADMIN', 'PROFESSIONAL', 'INTERN'];
  const operationsRoles = ['OWNER', 'ADMIN', 'PROFESSIONAL', 'RECEPTION', 'INTERN'];
  const resolveHealth = dependencies.checkHealth ?? checkDatabaseHealth;
  const resolveShuttingDown = dependencies.isShuttingDown ?? (() => false);

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

  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.setHeader('x-request-id', req.requestId);
    const startedAt = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const metadata = {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
      };

      if (res.statusCode >= 500) {
        logger.error('http_request_failed', undefined, metadata);
        return;
      }

      if (res.statusCode >= 400) {
        logger.warn('http_request_warning', metadata);
        return;
      }

      logger.info('http_request_completed', metadata);
    });

    next();
  });

  app.use(express.json({ limit: '2mb' }));
  app.use('/storage', express.static(storageRoot));

  app.get('/live', (_req, res) => {
    res.json(buildLiveHealthPayload({
      shuttingDown: resolveShuttingDown(),
    }));
  });

  app.get('/ready', async (_req, res) => {
    const database = await resolveHealth();
    const payload = buildReadyHealthPayload({
      databaseOk: database.ok,
      shuttingDown: resolveShuttingDown(),
    });

    res.status(resolveReadyStatusCode({ databaseOk: database.ok, shuttingDown: resolveShuttingDown() })).json(payload);
  });

  app.get('/health', async (_req, res) => {
    const database = await resolveHealth();
    const payload = buildReadyHealthPayload({
      databaseOk: database.ok,
      shuttingDown: resolveShuttingDown(),
    });

    res.status(resolveReadyStatusCode({ databaseOk: database.ok, shuttingDown: resolveShuttingDown() })).json(payload);
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
  app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
    logger.error('http_unhandled_error', error, {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
    });

    if (res.headersSent) return;
    handleUnexpectedError(error, req, res);
  });

  return app;
}
