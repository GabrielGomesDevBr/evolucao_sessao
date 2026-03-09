import { useState } from 'react';
import { useFeedback } from '../../app/state/feedback-state';
import { apiRequest } from '../../lib/api';
import { formatDate, formatTime } from '../../lib/utils';

type PortalAccount = {
  displayName: string;
  patient?: { fullName: string; socialName?: string | null } | null;
};

type PortalDocument = {
  id: string;
  type: string;
  purpose: string;
  content: string;
  createdAt: string;
};

type PortalAppointment = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  status: string;
};

export function PortalAccessPage() {
  const { notify } = useFeedback();
  const [email, setEmail] = useState('portal.helena@example.com');
  const [password, setPassword] = useState('Portal@123');
  const [token, setToken] = useState<string | null>(null);
  const [account, setAccount] = useState<PortalAccount | null>(null);
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [appointments, setAppointments] = useState<PortalAppointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="grid min-h-screen place-items-center bg-mesh px-6 py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/60 bg-white/80 shadow-card backdrop-blur xl:grid-cols-[0.85fr_1.15fr]">
        <div className="bg-[#142031] p-10 text-white">
          <p className="text-xs uppercase tracking-[0.35em] text-white/45">Portal LumniPsi</p>
          <h1 className="mt-4 font-display text-5xl leading-tight">Acesso do cliente e responsáveis.</h1>
          <p className="mt-5 text-sm leading-7 text-white/70">Portal separado da área clínica interna, com acesso apenas a documentos liberados e compromissos vinculados ao paciente.</p>
          <div className="mt-8 rounded-[28px] bg-white/10 p-5 text-sm text-white/80">
            <p className="font-semibold text-white">Credencial seed</p>
            <p className="mt-2">portal.helena@example.com / Portal@123</p>
          </div>
        </div>
        <div className="p-8 md:p-10">
          {!token ? (
            <div className="mx-auto max-w-md">
              <h2 className="font-display text-3xl text-ink">Entrar no portal</h2>
              <div className="mt-8 grid gap-4">
                <label className="grid gap-2 text-sm text-slate-600">
                  <span>E-mail</span>
                  <input value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
                </label>
                <label className="grid gap-2 text-sm text-slate-600">
                  <span>Senha</span>
                  <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
                </label>
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <button
                  className="rounded-full bg-lagoon px-5 py-3 text-sm font-semibold text-white"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    try {
                      const result = await apiRequest<{ token: string; account: PortalAccount }>('/portal/auth/login', {
                        method: 'POST',
                        body: JSON.stringify({ email, password }),
                      });
                      notify('success', 'Acesso ao portal realizado com sucesso.');
                      setToken(result.token);
                      setAccount(result.account);
                      const [docs, appts] = await Promise.all([
                        apiRequest<PortalDocument[]>('/portal/me/documents', {}, result.token),
                        apiRequest<PortalAppointment[]>('/portal/me/appointments', {}, result.token),
                      ]);
                      setDocuments(docs);
                      setAppointments(appts);
                    } catch (err) {
                      const message = err instanceof Error ? err.message : 'Falha no login do portal.';
                      setError(message);
                      notify('error', message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? 'Entrando...' : 'Acessar portal'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl text-ink">Olá, {account?.displayName}</h2>
                  <p className="text-sm text-slate-500">Paciente vinculado: {account?.patient?.socialName || account?.patient?.fullName}</p>
                </div>
                <button className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white" onClick={() => { setToken(null); setAccount(null); setDocuments([]); setAppointments([]); notify('info', 'Sessao do portal encerrada.'); }}>Sair</button>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <section className="rounded-[28px] border border-slate-100 bg-slate-50 p-5">
                  <h3 className="font-display text-2xl text-ink">Documentos liberados</h3>
                  <div className="mt-4 space-y-3">
                    {documents.length === 0 ? <p className="text-sm text-slate-500">Nenhum documento liberado.</p> : documents.map((portalDocument) => (
                      <div key={portalDocument.id} className="rounded-3xl bg-white p-4 shadow-sm">
                        <p className="font-semibold text-ink">{portalDocument.type}</p>
                        <p className="mt-1 text-sm text-slate-500">{formatDate(portalDocument.createdAt)}</p>
                        <p className="mt-2 text-sm text-slate-600">{portalDocument.purpose}</p>
                        <details className="mt-3 text-sm text-slate-600">
                          <summary className="cursor-pointer font-medium text-lagoon">Visualizar conteúdo</summary>
                          <p className="mt-2 whitespace-pre-wrap leading-6">{portalDocument.content}</p>
                        </details>
                        <button
                          className="mt-3 rounded-full bg-lagoon px-4 py-2 text-sm font-semibold text-white"
                          onClick={() => {
                            const blob = new Blob([`${portalDocument.type}\n\nFinalidade: ${portalDocument.purpose}\n\n${portalDocument.content}`], { type: 'text/plain;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `${portalDocument.type.toLowerCase().replace(/\s+/g, '-')}-${portalDocument.id}.txt`;
                            link.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          Baixar documento
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="rounded-[28px] border border-slate-100 bg-slate-50 p-5">
                  <h3 className="font-display text-2xl text-ink">Próximos compromissos</h3>
                  <div className="mt-4 space-y-3">
                    {appointments.length === 0 ? <p className="text-sm text-slate-500">Nenhum agendamento encontrado.</p> : appointments.map((appointment) => (
                      <div key={appointment.id} className="rounded-3xl bg-white p-4 shadow-sm">
                        <p className="font-semibold text-ink">{appointment.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{formatDate(appointment.startsAt)} • {formatTime(appointment.startsAt)} - {formatTime(appointment.endsAt)}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-400">{appointment.status}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
