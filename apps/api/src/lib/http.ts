import type { Request, Response } from 'express';

function extractRequestId(res: Response) {
  const requestId = res.getHeader('x-request-id');
  return typeof requestId === 'string' ? requestId : undefined;
}

export function ok<T>(res: Response, data: T) {
  return res.json({
    data,
    meta: {
      requestId: extractRequestId(res),
    },
  });
}

export function fail(res: Response, status: number, message: string) {
  return res.status(status).json({
    error: message,
    meta: {
      requestId: extractRequestId(res),
    },
  });
}

export function handleUnexpectedError(error: unknown, req: Request, res: Response) {
  const requestId = typeof req.requestId === 'string' ? req.requestId : extractRequestId(res);

  return res.status(500).json({
    error: 'Erro interno do servidor.',
    meta: {
      requestId,
    },
  });
}
