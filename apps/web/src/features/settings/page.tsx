import { useEffect, useState } from 'react';
import { Card } from '../../components/card';
import { useAppState } from '../../app/state/app-state';
import { useFeedback } from '../../app/state/feedback-state';
import { useAuth } from '../../app/state/auth-state';
import { API_URL, apiRequest } from '../../lib/api';

type TenantPolicy = {
  recordRetentionYears: number;
  healthDataRetentionYears: number;
  disposalMode: 'ANONYMIZE' | 'DELETE';
  disposalWindowDays: number;
  requireDocumentShareConsent: boolean;
};

export function SettingsPage() {
  const { attachSignatureAsset, professional, updateProfessional } = useAppState();
  const { token } = useAuth();
  const { notify } = useFeedback();
  const [form, setForm] = useState({
    licenseCode: '',
    specialty: '',
    city: '',
    state: '',
    phone: '',
  });
  const [policy, setPolicy] = useState<TenantPolicy>({
    recordRetentionYears: 5,
    healthDataRetentionYears: 20,
    disposalMode: 'ANONYMIZE',
    disposalWindowDays: 30,
    requireDocumentShareConsent: true,
  });

  useEffect(() => {
    if (professional) {
      setForm({
        licenseCode: professional.licenseCode || '',
        specialty: professional.specialty || '',
        city: professional.city || '',
        state: professional.state || '',
        phone: professional.phone || '',
      });
    }
  }, [professional]);

  useEffect(() => {
    if (!token) return;
    void apiRequest<TenantPolicy>('/settings/tenant', {}, token)
      .then(setPolicy)
      .catch((error) => notify('error', error instanceof Error ? error.message : 'Falha ao carregar politica institucional.'));
  }, [notify, token]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card title="Perfil profissional">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Nome completo</span>
            <input value={professional?.user ? `${professional.user.firstName} ${professional.user.lastName}` : ''} readOnly className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>CRP</span>
            <input value={form.licenseCode} onChange={(event) => setForm((current) => ({ ...current, licenseCode: event.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Especialidade</span>
            <input value={form.specialty} onChange={(event) => setForm((current) => ({ ...current, specialty: event.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Cidade</span>
            <input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Estado</span>
            <input value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Telefone</span>
            <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>E-mail</span>
            <input value={professional?.user?.email ?? ''} readOnly className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600 md:col-span-2">
            <span>Assinatura / imagem profissional</span>
            <input
              type="file"
              className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void attachSignatureAsset(file)
                    .then(() => notify('success', 'Assinatura atualizada.'))
                    .catch((error) => notify('error', error instanceof Error ? error.message : 'Falha ao atualizar assinatura.'));
                }
              }}
            />
          </label>
          {professional?.signatureAsset ? (
            <div className="md:col-span-2 rounded-[28px] border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-ink">Assinatura atual</p>
              <img
                src={`${API_URL}${professional.signatureAsset.storageKey}`}
                alt="Assinatura profissional"
                className="mt-3 max-h-40 rounded-2xl border border-slate-200 bg-white p-3"
              />
            </div>
          ) : null}
          <div className="md:col-span-2 flex gap-3">
            <button className="rounded-full bg-lagoon px-5 py-3 text-sm font-semibold text-white" onClick={async () => {
              try {
                await updateProfessional(form);
                notify('success', 'Perfil profissional atualizado.');
              } catch (error) {
                notify('error', error instanceof Error ? error.message : 'Falha ao atualizar perfil profissional.');
              }
            }}>Salvar perfil real</button>
          </div>
        </div>
      </Card>
      <Card title="Configurações institucionais e segurança">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Retenção mínima de registros psicológicos (anos)</span>
            <input type="number" min={1} max={50} value={policy.recordRetentionYears} onChange={(event) => setPolicy((current) => ({ ...current, recordRetentionYears: Number(event.target.value || 5) }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Retenção para contexto de saúde (anos)</span>
            <input type="number" min={1} max={50} value={policy.healthDataRetentionYears} onChange={(event) => setPolicy((current) => ({ ...current, healthDataRetentionYears: Number(event.target.value || 20) }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Modo de descarte</span>
            <select value={policy.disposalMode} onChange={(event) => setPolicy((current) => ({ ...current, disposalMode: event.target.value as TenantPolicy['disposalMode'] }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none">
              <option value="ANONYMIZE">Anonimizar antes do descarte</option>
              <option value="DELETE">Excluir definitivamente</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Janela de descarte após revogação (dias)</span>
            <input type="number" min={1} max={3650} value={policy.disposalWindowDays} onChange={(event) => setPolicy((current) => ({ ...current, disposalWindowDays: Number(event.target.value || 30) }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
            <input type="checkbox" checked={policy.requireDocumentShareConsent} onChange={(event) => setPolicy((current) => ({ ...current, requireDocumentShareConsent: event.target.checked }))} />
            Exigir consentimento explícito para liberação de documentos no portal
          </label>
          <div className="md:col-span-2 rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            A revogação do portal agora pode ser executada por conta. As políticas acima definem guarda mínima e janela institucional para descarte seguro.
          </div>
          <div className="md:col-span-2 flex gap-3">
            <button
              className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
              onClick={async () => {
                if (!token) return;
                try {
                  await apiRequest('/settings/tenant', {
                    method: 'PUT',
                    body: JSON.stringify(policy),
                  }, token);
                  notify('success', 'Politica institucional atualizada.');
                } catch (error) {
                  notify('error', error instanceof Error ? error.message : 'Falha ao atualizar politica institucional.');
                }
              }}
            >
              Salvar política institucional
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
