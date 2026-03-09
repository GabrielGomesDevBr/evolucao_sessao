import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  compareValue,
  hashValue,
  signAccessToken,
  signPinToken,
  signPortalToken,
  signRefreshToken,
  verifyAccessToken,
  verifyPinToken,
  verifyPortalToken,
  verifyRefreshToken,
} from './auth.js';

describe('auth helpers', () => {
  it('hashes and compares values correctly', async () => {
    const hashed = await hashValue('Senha@123');

    assert.notEqual(hashed, 'Senha@123');
    assert.equal(await compareValue('Senha@123', hashed), true);
    assert.equal(await compareValue('OutraSenha', hashed), false);
  });

  it('signs and verifies access tokens', () => {
    const token = signAccessToken({
      sub: 'user_1',
      tenantId: 'tenant_1',
      role: 'ADMIN',
      email: 'admin@example.com',
    });

    const payload = verifyAccessToken(token);
    assert.equal(payload.sub, 'user_1');
    assert.equal(payload.tenantId, 'tenant_1');
    assert.equal(payload.role, 'ADMIN');
    assert.equal(payload.email, 'admin@example.com');
  });

  it('signs and verifies portal tokens', () => {
    const token = signPortalToken({
      sub: 'portal_1',
      tenantId: 'tenant_1',
      patientId: 'patient_1',
      role: 'PATIENT',
      email: 'portal@example.com',
      scope: 'portal',
    });

    const payload = verifyPortalToken(token);
    assert.equal(payload.patientId, 'patient_1');
    assert.equal(payload.scope, 'portal');
  });

  it('signs and verifies pin and refresh tokens with the correct scopes', () => {
    const pinToken = signPinToken({
      sub: 'user_1',
      tenantId: 'tenant_1',
      scope: 'pin',
    });
    const refreshToken = signRefreshToken({
      sub: 'user_1',
      tenantId: 'tenant_1',
      role: 'ADMIN',
      email: 'admin@example.com',
      scope: 'refresh',
    });

    const pinPayload = verifyPinToken(pinToken);
    const refreshPayload = verifyRefreshToken(refreshToken);

    assert.equal(pinPayload.scope, 'pin');
    assert.equal(refreshPayload.scope, 'refresh');
    assert.equal(refreshPayload.email, 'admin@example.com');
  });
});
