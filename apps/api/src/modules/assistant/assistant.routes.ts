import { Router } from 'express';
import { z } from 'zod';
import { fail, ok } from '../../lib/http.js';
import { runAssistant } from './assistant.service.js';

const assistantSchema = z.object({
  threadId: z.string().optional(),
  message: z.string().min(2),
});

export const assistantRouter = Router();

assistantRouter.post('/chat', async (req, res) => {
  const parsed = assistantSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Mensagem inválida para o assistente.');

  const result = await runAssistant({
    tenantId: req.auth!.tenantId,
    userId: req.auth!.sub,
    threadId: parsed.data.threadId,
    message: parsed.data.message,
  });

  return ok(res, result);
});
