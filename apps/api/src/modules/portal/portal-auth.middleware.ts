import type { NextFunction, Request, Response } from 'express';
import { fail } from '../../lib/http.js';
import { verifyPortalToken, type PortalTokenPayload } from '../../lib/auth.js';

declare global {
  namespace Express {
    interface Request {
      portalAuth?: PortalTokenPayload;
    }
  }
}

export function requirePortalAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return fail(res, 401, 'Autenticação do portal obrigatória.');
  }

  try {
    req.portalAuth = verifyPortalToken(header.slice(7));
    if (req.portalAuth.scope !== 'portal') {
      return fail(res, 401, 'Token inválido para o portal.');
    }
    next();
  } catch {
    return fail(res, 401, 'Token do portal inválido ou expirado.');
  }
}
