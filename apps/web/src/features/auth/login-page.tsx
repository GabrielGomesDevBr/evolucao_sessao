import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../app/state/auth-state';
import { useFeedback } from '../../app/state/feedback-state';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { notify } = useFeedback();
  const [email, setEmail] = useState('demo@lumnipsi.app');
  const [password, setPassword] = useState('LumniPsi@123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="grid min-h-screen place-items-center bg-mesh px-6 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[36px] border border-white/60 bg-white/80 shadow-card backdrop-blur xl:grid-cols-[0.95fr_1.05fr]">
        <div className="bg-[#142031] p-10 text-white">
          <p className="text-xs uppercase tracking-[0.4em] text-white/45">LumniPsi</p>
          <h1 className="mt-4 font-display text-5xl leading-tight">Prontuário vivo, agenda familiar e operação clínica real.</h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-white/70">Login conectado ao Neon com os dados seed já cadastrados. Depois disso, pacientes, agenda, evoluções, documentos e registro restrito passam a vir da API.</p>
          <div className="mt-10 rounded-[28px] bg-white/10 p-5 text-sm text-white/80">
            <p className="font-semibold text-white">Credenciais demo</p>
            <p className="mt-3">Owner: `demo@lumnipsi.app` / `LumniPsi@123`</p>
            <p>PIN secundário: `4321`</p>
          </div>
        </div>
        <div className="p-8 md:p-10">
          <div className="mx-auto max-w-md">
            <h2 className="font-display text-3xl text-ink">Entrar</h2>
            <p className="mt-2 text-sm text-slate-500">Acesso à área profissional multi-tenant.</p>
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
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  try {
                    await login(email, password);
                    notify('success', 'Sessao iniciada com sucesso.');
                  } catch (err) {
                    const message = err instanceof Error ? err.message : 'Falha no login.';
                    setError(message);
                    notify('error', message);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar na plataforma'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
