import { useMemo, useState } from 'react';
import { quickFillLibrary } from '@lumnipsi/shared';
import { Card } from '../../components/card';
import { useAppState } from '../../app/state/app-state';
import { useFeedback } from '../../app/state/feedback-state';
import { formatDate } from '../../lib/utils';

function getDefaultForm() {
  return {
    fullName: '',
    socialName: '',
    cpf: '',
    birthDate: '1990-01-01',
    gender: '',
    phone: '',
    email: '',
    emergencyContact: '',
    guardianName: '',
    profession: '',
    educationLevel: '',
    intakeSource: '',
    arrivalState: '',
    arrivalNotes: '',
    companionName: '',
    previousPsychologicalCare: '',
    demandSummary: quickFillLibrary.patientDemand[0],
    careModality: 'Psicoterapia individual',
    careFrequency: 'Semanal',
    treatmentGoals: 'Favorecer acolhimento, organização da demanda e desenvolvimento de estratégias de manejo.',
    allowPortalAccess: true,
  };
}

export function PatientsPage() {
  const { addPatient, deletePatient, evolutions, patients, selectedPatient, setSelectedPatientId, updatePatient } = useAppState();
  const { notify } = useFeedback();
  const [form, setForm] = useState(getDefaultForm());

  const selectedEvolutions = useMemo(
    () => evolutions.filter((item) => item.patientId === selectedPatient?.id).slice(0, 5),
    [evolutions, selectedPatient],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
      <div className="space-y-6">
        <Card title="Lista de pacientes">
          <div className="space-y-3">
            {patients.map((patient) => (
              <div key={patient.id} className={`w-full rounded-[26px] border p-4 text-left ${selectedPatient?.id === patient.id ? 'border-lagoon bg-lagoon/5' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-3">
                  <button className="text-left" onClick={() => setSelectedPatientId(patient.id)}>
                    <p className="font-semibold text-ink">{patient.fullName}</p>
                    <p className="text-sm text-slate-500">CPF {patient.cpf} • {patient.careModality}</p>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">{patient.careFrequency}</span>
                    <button
                      className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600"
                      onClick={async () => {
                        try {
                          await deletePatient(patient.id);
                          notify('success', 'Paciente excluido.');
                        } catch (error) {
                          notify('error', error instanceof Error ? error.message : 'Falha ao excluir paciente.');
                        }
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Resumo do prontuário">
          {selectedPatient ? (
            <div className="space-y-3 text-sm text-slate-600">
              <p><strong className="text-ink">Nascimento:</strong> {formatDate(selectedPatient.birthDate)}</p>
              <p><strong className="text-ink">Contato:</strong> {selectedPatient.phone || 'Não informado'} • {selectedPatient.email || 'Não informado'}</p>
              <p><strong className="text-ink">Contato de emergência:</strong> {selectedPatient.emergencyContact || 'Não informado'}</p>
              <p><strong className="text-ink">Responsável:</strong> {selectedPatient.guardianName || 'Não informado'}</p>
              <p><strong className="text-ink">Demanda:</strong> {selectedPatient.demandSummary}</p>
              <p><strong className="text-ink">Objetivos:</strong> {selectedPatient.treatmentGoals}</p>
              <button
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"
                onClick={() =>
                  setForm({
                    fullName: selectedPatient.fullName,
                    socialName: selectedPatient.socialName ?? '',
                    cpf: selectedPatient.cpf,
                    birthDate: selectedPatient.birthDate,
                    gender: selectedPatient.gender ?? '',
                    phone: selectedPatient.phone,
                    email: selectedPatient.email,
                    emergencyContact: selectedPatient.emergencyContact ?? '',
                    guardianName: selectedPatient.guardianName ?? '',
                    profession: selectedPatient.profession ?? '',
                    educationLevel: selectedPatient.educationLevel ?? '',
                    intakeSource: selectedPatient.intakeSource ?? '',
                    arrivalState: selectedPatient.arrivalState ?? '',
                    arrivalNotes: selectedPatient.arrivalNotes ?? '',
                    companionName: selectedPatient.companionName ?? '',
                    previousPsychologicalCare: selectedPatient.previousPsychologicalCare ?? '',
                    demandSummary: selectedPatient.demandSummary,
                    careModality: selectedPatient.careModality,
                    careFrequency: selectedPatient.careFrequency,
                    treatmentGoals: selectedPatient.treatmentGoals,
                    allowPortalAccess: selectedPatient.allowPortalAccess ?? false,
                  })
                }
              >
                Carregar no formulário
              </button>
              <div className="space-y-2 pt-2">
                {selectedEvolutions.map((evolution) => (
                  <div key={evolution.id} className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{formatDate(evolution.serviceDate)} • sessão {evolution.sessionNumber}</p>
                    <p className="mt-2 leading-6">{evolution.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhum paciente selecionado.</p>
          )}
        </Card>
      </div>
      <Card title="Paciente">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['fullName', 'Nome completo'],
            ['socialName', 'Nome social'],
            ['birthDate', 'Data de nascimento'],
            ['cpf', 'CPF'],
            ['gender', 'Gênero'],
            ['phone', 'Telefone'],
            ['email', 'E-mail'],
            ['emergencyContact', 'Contato de emergência'],
            ['guardianName', 'Responsável'],
            ['profession', 'Profissão'],
            ['educationLevel', 'Escolaridade'],
            ['intakeSource', 'Origem da demanda'],
            ['careModality', 'Modalidade'],
            ['careFrequency', 'Frequência'],
            ['arrivalState', 'Estado inicial'],
            ['companionName', 'Acompanhante'],
          ].map(([key, label]) => (
            <label key={key} className="grid gap-2 text-sm text-slate-600">
              <span>{label}</span>
              <input value={String(form[key as keyof typeof form] ?? '')} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
            </label>
          ))}
          <label className="grid gap-2 text-sm text-slate-600 md:col-span-2">
            <span>Motivo da busca</span>
            <textarea value={form.demandSummary} onChange={(event) => setForm((current) => ({ ...current, demandSummary: event.target.value }))} className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600 md:col-span-2">
            <span>Objetivos e enquadre</span>
            <textarea value={form.treatmentGoals} onChange={(event) => setForm((current) => ({ ...current, treatmentGoals: event.target.value }))} className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600 md:col-span-2">
            <span>Anotações de chegada</span>
            <textarea value={form.arrivalNotes} onChange={(event) => setForm((current) => ({ ...current, arrivalNotes: event.target.value }))} className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600 md:col-span-2">
            <span>Cuidado psicológico prévio</span>
            <textarea value={form.previousPsychologicalCare} onChange={(event) => setForm((current) => ({ ...current, previousPsychologicalCare: event.target.value }))} className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
            <input type="checkbox" checked={form.allowPortalAccess} onChange={(event) => setForm((current) => ({ ...current, allowPortalAccess: event.target.checked }))} />
            Permitir criação de conta no portal
          </label>
          <div className="md:col-span-2 flex gap-3">
            <button className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold" onClick={() => setForm((current) => ({ ...current, demandSummary: quickFillLibrary.patientDemand[6] }))}>Trocar modelo</button>
            <button
              className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold"
              onClick={async () => {
                if (!selectedPatient) return;
                try {
                  await updatePatient(selectedPatient.id, form);
                  notify('success', 'Paciente atualizado.');
                } catch (error) {
                  notify('error', error instanceof Error ? error.message : 'Falha ao atualizar paciente.');
                }
              }}
            >
              Salvar edição
            </button>
            <button
              className="rounded-full bg-lagoon px-5 py-3 text-sm font-semibold text-white"
              onClick={async () => {
                try {
                  await addPatient(form);
                  notify('success', 'Paciente criado.');
                  setForm(getDefaultForm());
                } catch (error) {
                  notify('error', error instanceof Error ? error.message : 'Falha ao criar paciente.');
                }
              }}
            >
              Novo paciente
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
