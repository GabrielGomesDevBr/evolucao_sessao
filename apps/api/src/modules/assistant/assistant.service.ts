import { ChatOpenAI } from '@langchain/openai';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';

const assistantGuardrails = [
  'Você é assistente de uma aplicação clínica de psicologia.',
  'Não grave dados no banco automaticamente.',
  'Não exponha registro documental restrito sem confirmação e PIN secundário.',
  'Ao sugerir documentos, use linguagem técnica, objetiva, impessoal e alinhada às regras do CFP.',
  'Se não houver contexto suficiente, peça confirmação ou dados adicionais.',
].join(' ');

export async function runAssistant(input: {
  tenantId: string;
  userId: string;
  threadId?: string;
  message: string;
}) {
  const existingThread = input.threadId
    ? await prisma.assistantThread.findUnique({ where: { id: input.threadId }, include: { messages: true } })
    : null;

  const thread =
    existingThread ??
    (await prisma.assistantThread.create({
      data: { tenantId: input.tenantId, title: 'Nova conversa' },
      include: { messages: true },
    }));

  await prisma.assistantMessage.create({
    data: {
      threadId: thread.id,
      authorUserId: input.userId,
      role: 'user',
      content: input.message,
    },
  });

  if (!env.OPENAI_API_KEY || env.ASSISTANT_ENABLED !== 'true') {
    const fallback = 'Assistente preparado, mas sem API configurada. Defina OPENAI_API_KEY no ambiente para habilitar respostas.';
    await prisma.assistantMessage.create({ data: { threadId: thread.id, role: 'assistant', content: fallback } });
    return { threadId: thread.id, response: fallback };
  }

  const model = new ChatOpenAI({
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
    temperature: 0.2,
  });

  const patients = await prisma.patient.findMany({
    where: { tenantId: input.tenantId },
    take: 20,
    select: { id: true, fullName: true, demandSummary: true },
  });

  const answer = await model.invoke([
    ['system', assistantGuardrails],
    ['system', `Contexto resumido do tenant: ${JSON.stringify({ patients })}`],
    ['human', input.message],
  ]);

  const text = typeof answer.content === 'string' ? answer.content : JSON.stringify(answer.content);

  await prisma.assistantMessage.create({
    data: { threadId: thread.id, role: 'assistant', content: text },
  });

  return { threadId: thread.id, response: text };
}
