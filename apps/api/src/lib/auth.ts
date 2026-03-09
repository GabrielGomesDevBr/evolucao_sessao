import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export type AccessTokenPayload = {
  sub: string;
  tenantId: string;
  role: string;
  email: string;
};

export type PortalTokenPayload = {
  sub: string;
  tenantId: string;
  patientId: string;
  role: string;
  email: string;
  scope: 'portal';
};

export type PinTokenPayload = {
  sub: string;
  tenantId: string;
  scope: 'pin';
};

export type RefreshTokenPayload = {
  sub: string;
  tenantId: string;
  role: string;
  email: string;
  scope: 'refresh';
};

export async function hashValue(value: string) {
  return bcrypt.hash(value, 10);
}

export async function compareValue(value: string, hashed: string) {
  return bcrypt.compare(value, hashed);
}

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function signPortalToken(payload: PortalTokenPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '8h' });
}

export function verifyPortalToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as PortalTokenPayload;
}

export function signPinToken(payload: PinTokenPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '15m' });
}

export function verifyPinToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as PinTokenPayload;
}

export function signRefreshToken(payload: RefreshTokenPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '14d' });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}
