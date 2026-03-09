import type { AccessTokenPayload } from '../lib/auth.js';

declare global {
  namespace Express {
    interface Request {
      auth?: AccessTokenPayload;
      pinVerified?: boolean;
      requestId?: string;
    }
  }
}

export {};
