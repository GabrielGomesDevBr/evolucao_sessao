import { env } from '../config/env.js';
import { Prisma, PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
});

prisma.$on('query', (event) => {
  if (event.duration < env.PRISMA_SLOW_QUERY_MS) return;

  logger.warn('prisma_slow_query', {
    durationMs: event.duration,
    target: event.target,
    query: event.query.replace(/\s+/g, ' ').trim().slice(0, 240),
    timestamp: event.timestamp.toISOString(),
  });
});

prisma.$on('warn', (event) => {
  logger.warn('prisma_warn', { message: event.message, target: event.target, timestamp: event.timestamp.toISOString() });
});

prisma.$on('error', (event) => {
  logger.error('prisma_error', undefined, { message: event.message, target: event.target, timestamp: event.timestamp.toISOString() });
});

export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('database_connected');
  } catch (error) {
    logger.error('database_connection_failed', error);
    throw error;
  }
}

export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    logger.info('database_disconnected');
  } catch (error) {
    logger.error('database_disconnect_failed', error);
    throw error;
  }
}

export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw(Prisma.sql`SELECT 1`);
    return { ok: true as const };
  } catch (error) {
    logger.error('database_healthcheck_failed', error);
    return { ok: false as const, error };
  }
}
