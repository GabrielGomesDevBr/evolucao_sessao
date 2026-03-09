import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../../lib/auth.js';
import { fail } from '../../lib/http.js';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return fail(res, 401, 'Autenticação obrigatória.');
  }

  try {
    req.auth = verifyAccessToken(header.slice(7));
    next();
  } catch {
    return fail(res, 401, 'Token inválido ou expirado.');
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !allowedRoles.includes(req.auth.role)) {
      return fail(res, 403, 'Você não tem permissão para esta ação.');
    }
    next();
  };
}
