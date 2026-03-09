import { useState } from 'react';
import { Card } from '../../components/card';
import { useAppState } from '../../app/state/app-state';

const prompts = [
  'Gerar rascunho de relatório psicológico com base nas últimas sessões.',
  'Sugerir texto técnico e impessoal para evolução com piora sintomática.',
  'Explicar diferença entre relatório e laudo segundo as diretrizes CFP.',
  'Montar checklist para entrevista devolutiva de documento psicológico.',
];

export function AssistantPage() {
  const { sendAssistantMessage } = useAppState();
  const [threadId, setThreadId] = useState<string | undefined>();
  const [input, setInput] = useState('Gere um rascunho de relatório psicológico sobre acompanhamento com foco em ansiedade, sem expor conteúdo desnecessário.');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Posso ajudar com dúvidas de uso, normas do CFP, rascunhos de evolução, documentos e organização clínica. Sempre peça revisão humana antes de usar texto gerado em documento final.',
    },
  ]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
      <Card title="Assistente clínico">
        <div className="space-y-3 text-sm text-slate-600">
          <p>Modelo configurado: <strong>gpt-5-mini</strong>.</p>
          <p>Guardrails: sem gravação automática, sem acesso a registro restrito sem PIN, sempre com confirmação humana antes de persistir.</p>
          <div className="space-y-2">
            {prompts.map((prompt) => (
              <button key={prompt} className="w-full rounded-3xl border border-slate-100 bg-slate-50 p-4 text-left hover:bg-slate-100" onClick={() => setInput(prompt)}>{prompt}</button>
            ))}
          </div>
        </div>
      </Card>
      <Card title="Conversa">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={message.role === 'assistant' ? 'rounded-[28px] bg-slate-50 p-4 text-sm text-slate-700' : 'rounded-[28px] bg-lagoon p-4 text-sm text-white'}>
              <p className={message.role === 'assistant' ? 'font-semibold text-ink' : 'font-semibold'}>{message.role === 'assistant' ? 'Lia' : 'Você'}</p>
              <p className="mt-2 whitespace-pre-wrap leading-6">{message.content}</p>
            </div>
          ))}
          <div className="flex gap-3">
            <textarea className="min-h-28 flex-1 rounded-[28px] border border-slate-200 px-5 py-4 outline-none" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Digite sua solicitação ao assistente..." />
            <button
              className="self-end rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setMessages((current) => [...current, { role: 'user', content: input }]);
                try {
                  const result = await sendAssistantMessage(input, threadId);
                  setThreadId(result.threadId);
                  setMessages((current) => [...current, { role: 'assistant', content: result.response }]);
                  setInput('');
                } catch (error) {
                  setMessages((current) => [...current, { role: 'assistant', content: error instanceof Error ? error.message : 'Falha ao consultar o assistente.' }]);
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
