import { useEffect, useState } from 'react';
import { Card } from '../../components/card';
import { useAppState } from '../../app/state/app-state';
import { useFeedback } from '../../app/state/feedback-state';
import { useAuth } from '../../app/state/auth-state';
import { apiRequest } from '../../lib/api';
import { formatDate } from '../../lib/utils';

type PortalAccount = {
  id: string;
  email: string;
  displayName: string;
  role: 'PATIENT' | 'GUARDIAN';
  isActive: boolean;
  invitedAt: string | null;
  lastLoginAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  patient?: { id: string; fullName: string; socialName?: string | null } | null;
};

export function PortalPage() {
  const { documents, patients, selectedPatient } = useAppState();
  const { notify } = useFeedback();
  const { token } = useAuth();
  const [accounts, setAccounts] = useState<PortalAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountActionId, setAccountActionId] = useState<string | null>(null);
  const [revokeReasonById, setRevokeReasonById] = useState<Record<string, string>>({});
  const [resetPasswordById, setResetPasswordById] = useState<Record<string, string>>({});
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState({
    displayName: '',
    email: '',
    role: 'PATIENT' as 'PATIENT' | 'GUARDIAN',
  });
  const [form, setForm] = useState({
    patientId: selectedPatient?.id ?? patients[0]?.id ?? '',
    displayName: selectedPatient?.fullName ?? '',
    email: 'novo.portal@example.com',
    password: 'Portal@123',
    role: 'PATIENT' as 'PATIENT' | 'GUARDIAN',
  });

  const sharedDocuments = documents.filter((document) => document.shared && (!selectedPatient || document.patientId === selectedPatient.id));

  useEffect(() => {
    if (token) {
      setLoading(true);
      setError(null);
      void apiRequest<PortalAccount[]>('/portal/accounts', {}, token)
        .then(setAccounts)
        .catch((err) => {
          const message = err instanceof Error ? err.message : 'Falha ao carregar contas do portal.';
          setError(message);
          notify('error', message);
        })
        .finally(() => setLoading(false));
    }
  }, [notify, token]);

  useEffect(() => {
    if ((selectedPatient?.id || patients[0]?.id) && !form.patientId) {
      setForm((current) => ({
        ...current,
        patientId: selectedPatient?.id ?? patients[0]?.id ?? '',
        displayName: selectedPatient?.fullName ?? current.displayName,
      }));
    }
  }, [form.patientId, patients, selectedPatient]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
      <div className="space-y-6">
        <Card title="Contas reais do portal">
          <div className="space-y-3">
            {loading ? <p className="text-sm text-slate-500">Carregando contas do portal...</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {!loading && accounts.length === 0 ? <p className="text-sm text-slate-500">Nenhuma conta do portal cadastrada.</p> : accounts.map((account) => (
              <div key={account.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{account.displayName}</p>
                    <p className="mt-1 text-sm text-slate-500">{account.email} • {account.role}</p>
                    <p className="mt-1 text-sm text-slate-500">Paciente: {account.patient?.socialName || account.patient?.fullName}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">Convite: {account.invitedAt ? formatDate(account.invitedAt) : 'sem data'}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">Último acesso: {account.lastLoginAt ? formatDate(account.lastLoginAt) : 'nunca acessou'}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${account.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {account.isActive ? 'Ativa' : 'Revogada'}
                  </span>
                </div>
                {editingAccountId === account.id ? (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="grid gap-2 text-sm text-slate-600">
                      <span>Nome de exibição</span>
                      <input
                        value={editingForm.displayName}
                        onChange={(event) => setEditingForm((current) => ({ ...current, displayName: event.target.value }))}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                      />
                    </label>
                    <label className="grid gap-2 text-sm text-slate-600">
                      <span>E-mail</span>
                      <input
                        value={editingForm.email}
                        onChange={(event) => setEditingForm((current) => ({ ...current, email: event.target.value }))}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                      />
                    </label>
                    <label className="grid gap-2 text-sm text-slate-600 md:col-span-2">
                      <span>Papel</span>
                      <select
                        value={editingForm.role}
                        onChange={(event) => setEditingForm((current) => ({ ...current, role: event.target.value as 'PATIENT' | 'GUARDIAN' }))}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                      >
                        <option value="PATIENT">Paciente</option>
                        <option value="GUARDIAN">Responsável</option>
                      </select>
                    </label>
                    <div className="md:col-span-2 flex flex-wrap gap-2">
                      <button
                        className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
                        disabled={accountActionId === account.id}
                        onClick={async () => {
                          if (!token) return;
                          setAccountActionId(account.id);
                          setError(null);
                          try {
                            const updated = await apiRequest<PortalAccount>(`/portal/accounts/${account.id}`, {
                              method: 'PATCH',
                              body: JSON.stringify(editingForm),
                            }, token);
                            setAccounts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                            setEditingAccountId(null);
                            notify('success', 'Conta do portal atualizada.');
                          } catch (err) {
                            const message = err instanceof Error ? err.message : 'Falha ao atualizar conta do portal.';
                            setError(message);
                            notify('error', message);
                          } finally {
                            setAccountActionId(null);
                          }
                        }}
                      >
                        {accountActionId === account.id ? 'Salvando...' : 'Salvar alterações'}
                      </button>
                      <button
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"
                        onClick={() => setEditingAccountId(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : null}
                {account.revokedAt ? (
                  <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Revogada em {formatDate(account.revokedAt)}{account.revokedReason ? ` • ${account.revokedReason}` : ''}
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"
                    disabled={accountActionId === account.id}
                    onClick={() => {
                      setEditingAccountId(account.id);
                      setEditingForm({
                        displayName: account.displayName,
                        email: account.email,
                        role: account.role,
                      });
                    }}
                  >
                    Editar conta
                  </button>
                  {account.isActive ? (
                    <>
                      <input
                        value={revokeReasonById[account.id] ?? ''}
                        onChange={(event) => setRevokeReasonById((current) => ({ ...current, [account.id]: event.target.value }))}
                        placeholder="Motivo da revogação"
                        className="min-w-56 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none"
                      />
                      <button
                        className="rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700"
                        disabled={accountActionId === account.id}
                        onClick={async () => {
                          if (!token) return;
                          const reason = (revokeReasonById[account.id] || 'Acesso revogado pela equipe responsável.').trim();
                          setAccountActionId(account.id);
                          setError(null);
                          try {
                            const updated = await apiRequest<PortalAccount>(`/portal/accounts/${account.id}/revoke`, {
                              method: 'PATCH',
                              body: JSON.stringify({ reason }),
                            }, token);
                            setAccounts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                            notify('success', 'Conta do portal revogada.');
                          } catch (err) {
                            const message = err instanceof Error ? err.message : 'Falha ao revogar conta do portal.';
                            setError(message);
                            notify('error', message);
                          } finally {
                            setAccountActionId(null);
                          }
                        }}
                      >
                        {accountActionId === account.id ? 'Revogando...' : 'Revogar acesso'}
                      </button>
                    </>
                  ) : (
                    <button
                      className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700"
                      disabled={accountActionId === account.id}
                      onClick={async () => {
                        if (!token) return;
                        setAccountActionId(account.id);
                        setError(null);
                        try {
                          const updated = await apiRequest<PortalAccount>(`/portal/accounts/${account.id}/reactivate`, {
                            method: 'PATCH',
                          }, token);
                          setAccounts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                          notify('success', 'Conta do portal reativada.');
                        } catch (err) {
                          const message = err instanceof Error ? err.message : 'Falha ao reativar conta do portal.';
                          setError(message);
                          notify('error', message);
                        } finally {
                          setAccountActionId(null);
                        }
                      }}
                    >
                      {accountActionId === account.id ? 'Reativando...' : 'Reativar acesso'}
                    </button>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    type="password"
                    value={resetPasswordById[account.id] ?? ''}
                    onChange={(event) => setResetPasswordById((current) => ({ ...current, [account.id]: event.target.value }))}
                    placeholder="Nova senha do portal"
                    className="min-w-56 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none"
                  />
                  <button
                    className="rounded-full border border-coral/30 px-4 py-2 text-sm font-semibold text-coral"
                    disabled={accountActionId === account.id}
                    onClick={async () => {
                      if (!token) return;
                      const password = (resetPasswordById[account.id] || 'Portal@123').trim();
                      setAccountActionId(account.id);
                      setError(null);
                      try {
                        await apiRequest(`/portal/accounts/${account.id}/reset-password`, {
                          method: 'POST',
                          body: JSON.stringify({ password }),
                        }, token);
                        setResetPasswordById((current) => ({ ...current, [account.id]: '' }));
                        notify('success', 'Senha do portal redefinida.');
                      } catch (err) {
                        const message = err instanceof Error ? err.message : 'Falha ao redefinir senha do portal.';
                        setError(message);
                        notify('error', message);
                      } finally {
                        setAccountActionId(null);
                      }
                    }}
                  >
                    {accountActionId === account.id ? 'Aplicando...' : 'Redefinir senha'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Criar conta no portal">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-600">
              <span>Paciente</span>
              <select value={form.patientId} onChange={(event) => setForm((current) => ({ ...current, patientId: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none">
                {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.fullName}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-slate-600">
              <span>Papel</span>
              <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as 'PATIENT' | 'GUARDIAN' }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none">
                <option value="PATIENT">Paciente</option>
                <option value="GUARDIAN">Responsável</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-slate-600">
              <span>Nome de exibição</span>
              <input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
            </label>
            <label className="grid gap-2 text-sm text-slate-600">
              <span>E-mail</span>
              <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
            </label>
            <label className="grid gap-2 text-sm text-slate-600 md:col-span-2">
              <span>Senha inicial</span>
              <input value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
            </label>
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <a href="/portal/acesso" target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold">Abrir portal externo</a>
              <button
                className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white"
                onClick={async () => {
                  if (!token) return;
                  setError(null);
                  try {
                    const account = await apiRequest<PortalAccount>('/portal/accounts', {
                      method: 'POST',
                      body: JSON.stringify(form),
                    }, token);
                    setAccounts((current) => [account, ...current]);
                    notify('success', 'Conta do portal criada.');
                  } catch (err) {
                    const message = err instanceof Error ? err.message : 'Falha ao criar conta do portal.';
                    setError(message);
                    notify('error', message);
                  }
                }}
              >
                Criar conta real
              </button>
            </div>
          </div>
        </Card>
      </div>
      <Card title="Prévia do que o cliente veria">
        <div className="space-y-3">
          {sharedDocuments.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum documento marcado para compartilhamento no portal.</p>
          ) : (
            sharedDocuments.map((document) => {
              const patient = patients.find((item) => item.id === document.patientId);
              return (
                <div key={document.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <p className="font-semibold text-ink">{document.type}</p>
                  <p className="mt-1 text-sm text-slate-500">{patient?.fullName ?? 'Paciente'} • {formatDate(document.createdAt)}</p>
                  <p className="mt-2 text-sm text-slate-600">{document.purpose}</p>
                  <details className="mt-3 text-sm text-slate-600">
                    <summary className="cursor-pointer font-medium text-lagoon">Visualizar conteúdo compartilhado</summary>
                    <p className="mt-2 whitespace-pre-wrap leading-6">{document.content}</p>
                  </details>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
