import type { NextFunction, Request, Response } from 'express';
import { verifyPinToken } from '../../lib/auth.js';
import { fail } from '../../lib/http.js';

export function requirePin(req: Request, res: Response, next: NextFunction) {
  const pinToken = req.headers['x-pin-token'];

  if (typeof pinToken !== 'string') {
    return fail(res, 423, 'PIN secundário obrigatório para esta área.');
  }

  try {
    const payload = verifyPinToken(pinToken);
    if (payload.scope !== 'pin' || payload.sub !== req.auth?.sub || payload.tenantId !== req.auth?.tenantId) {
      return fail(res, 423, 'Verificação de PIN inválida para esta sessão.');
    }
  } catch {
    return fail(res, 423, 'Verificação de PIN expirada ou inválida.');
  }

  req.pinVerified = true;
  next();
}
