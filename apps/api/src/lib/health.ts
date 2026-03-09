export function buildLiveHealthPayload(input: { shuttingDown: boolean }) {
  return {
    status: 'ok',
    name: 'LumniPsi API',
    timestamp: new Date().toISOString(),
    services: {
      api: 'ok',
    },
    shuttingDown: input.shuttingDown,
  };
}

export function buildReadyHealthPayload(input: {
  databaseOk: boolean;
  shuttingDown: boolean;
}) {
  return {
    status: input.databaseOk && !input.shuttingDown ? 'ok' : 'degraded',
    name: 'LumniPsi API',
    timestamp: new Date().toISOString(),
    services: {
      api: input.shuttingDown ? 'shutting_down' : 'ok',
      database: input.databaseOk ? 'ok' : 'error',
    },
    shuttingDown: input.shuttingDown,
  };
}

export function resolveReadyStatusCode(input: {
  databaseOk: boolean;
  shuttingDown: boolean;
}) {
  return input.databaseOk && !input.shuttingDown ? 200 : 503;
}
