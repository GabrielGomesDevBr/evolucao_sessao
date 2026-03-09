type LogLevel = 'info' | 'warn' | 'error';

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}

function writeLog(level: LogLevel, event: string, metadata?: Record<string, unknown>) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    service: 'lumnipsi-api',
    event,
    ...(metadata ?? {}),
  };

  const line = `${JSON.stringify(payload)}\n`;
  const stream = level === 'error' ? process.stderr : process.stdout;
  stream.write(line);
}

export const logger = {
  info(event: string, metadata?: Record<string, unknown>) {
    writeLog('info', event, metadata);
  },
  warn(event: string, metadata?: Record<string, unknown>) {
    writeLog('warn', event, metadata);
  },
  error(event: string, error?: unknown, metadata?: Record<string, unknown>) {
    writeLog('error', event, {
      ...(metadata ?? {}),
      ...(error ? { error: serializeError(error) } : {}),
    });
  },
};
