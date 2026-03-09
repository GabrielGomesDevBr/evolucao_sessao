import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildLiveHealthPayload, buildReadyHealthPayload, resolveReadyStatusCode } from './health.js';

describe('health helpers', () => {
  it('builds liveness payload without database dependency', () => {
    const payload = buildLiveHealthPayload({ shuttingDown: false });

    assert.equal(payload.status, 'ok');
    assert.equal(payload.name, 'LumniPsi API');
    assert.equal(payload.services.api, 'ok');
    assert.equal(payload.shuttingDown, false);
  });

  it('builds readiness payload for healthy database', () => {
    const payload = buildReadyHealthPayload({ databaseOk: true, shuttingDown: false });

    assert.equal(payload.status, 'ok');
    assert.equal(payload.services.api, 'ok');
    assert.equal(payload.services.database, 'ok');
    assert.equal(resolveReadyStatusCode({ databaseOk: true, shuttingDown: false }), 200);
  });

  it('builds readiness payload for degraded database', () => {
    const payload = buildReadyHealthPayload({ databaseOk: false, shuttingDown: false });

    assert.equal(payload.status, 'degraded');
    assert.equal(payload.services.database, 'error');
    assert.equal(resolveReadyStatusCode({ databaseOk: false, shuttingDown: false }), 503);
  });

  it('builds readiness payload for shutdown state', () => {
    const payload = buildReadyHealthPayload({ databaseOk: true, shuttingDown: true });

    assert.equal(payload.status, 'degraded');
    assert.equal(payload.services.api, 'shutting_down');
    assert.equal(payload.shuttingDown, true);
    assert.equal(resolveReadyStatusCode({ databaseOk: true, shuttingDown: true }), 503);
  });
});
