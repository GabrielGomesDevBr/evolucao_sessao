import { env } from './config/env.js';
import { buildApp } from './app.js';
import { logger } from './lib/logger.js';
import { connectDatabase, disconnectDatabase } from './lib/prisma.js';
import { ensureStorageRoot, storageRoot } from './lib/storage.js';
let isShuttingDown = false;
const app = buildApp({ isShuttingDown: () => isShuttingDown });

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.warn('api_shutdown_started', { signal });
  try {
    await disconnectDatabase();
    logger.info('api_shutdown_completed', { signal });
    process.exit(0);
  } catch (error) {
    logger.error('api_shutdown_failed', error, { signal });
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('unhandledRejection', (reason) => {
  logger.error('process_unhandled_rejection', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('process_uncaught_exception', error);
});

async function bootstrap() {
  try {
    await ensureStorageRoot();
    logger.info('storage_ready', { storageRoot });
    await connectDatabase();

    app.listen(env.PORT, () => {
      logger.info('api_started', { port: env.PORT, url: `http://localhost:${env.PORT}` });
    });
  } catch (error) {
    logger.error('api_startup_failed', error);
    process.exit(1);
  }
}

void bootstrap();
