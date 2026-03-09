import { useEffect, useState } from 'react';
import { quickFillLibrary } from '@lumnipsi/shared';
import { Card } from '../../components/card';
import { useAppState } from '../../app/state/app-state';
import { useFeedback } from '../../app/state/feedback-state';
import { formatDate } from '../../lib/utils';

export function RecordsPage() {
  const { addRestrictedRecord, deleteRestrictedRecord, patients, restrictedRecords, selectedPatient, pinVerified, verifyPin, clearPin, updateRestrictedRecord } = useAppState();
  const { notify } = useFeedback();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    patientId: string;
    category: string;
    content: string;
    sensitivity: 'NORMAL' | 'HIGH' | 'CRITICAL';
  }>({
    patientId: selectedPatient?.id ?? patients[0]?.id ?? '',
    category: 'Planejamento',
    content: quickFillLibrary.observations[9],
    sensitivity: 'HIGH' as const,
  });
  const [pin, setPin] = useState('4321');
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if ((selectedPatient?.id || patients[0]?.id) && !form.patientId) {
      setForm((current) => ({ ...current, patientId: selectedPatient?.id ?? patients[0]?.id ?? '' }));
    }
  }, [form.patientId, patients, selectedPatient]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card
        title="Área com PIN secundário"
        action={
          pinVerified ? (
            <button className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white" onClick={() => { clearPin(); notify('info', 'Area restrita bloqueada novamente.'); }}>Bloquear</button>
          ) : (
            <div className="flex items-center gap-2">
              <input value={pin} onChange={(event) => setPin(event.target.value)} className="w-24 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
              <button
                className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
                onClick={async () => {
                  setPinError(null);
                  try {
                    await verifyPin(pin);
                    notify('success', 'PIN validado. Area restrita liberada.');
                  } catch (error) {
                    const message = error instanceof Error ? error.message : 'Falha ao validar PIN.';
                    setPinError(message);
                    notify('error', message);
                  }
                }}
              >
                Verificar PIN
              </button>
            </div>
          )
        }
      >
        <div className="space-y-3">
          {pinError ? <p className="text-sm text-red-600">{pinError}</p> : null}
          {!pinVerified ? <p className="text-sm text-slate-500">Os registros restritos serão carregados da API após a verificação do PIN.</p> : null}
          {restrictedRecords.map((record) => {
            const patient = patients.find((item) => item.id === record.patientId);
            return (
              <div key={record.id} className="rounded-3xl border border-amber-100 bg-amber-50 p-4 text-sm text-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{record.category} • {patient?.fullName ?? 'Paciente'}</p>
                    <p className="mt-2">{record.content}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-400">{record.sensitivity} • {formatDate(record.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold"
                      onClick={() => {
                        setEditingId(record.id);
                        setForm({
                          patientId: record.patientId,
                          category: record.category,
                          content: record.content,
                          sensitivity: record.sensitivity,
                        });
                      }}
                    >
                      Editar
                    </button>
                    <button className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600" onClick={async () => {
                      try {
                        await deleteRestrictedRecord(record.id);
                        notify('success', 'Registro restrito excluido.');
                      } catch (error) {
                        notify('error', error instanceof Error ? error.message : 'Falha ao excluir registro restrito.');
                      }
                    }}>Excluir</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <Card title={editingId ? 'Editar registro documental' : 'Novo registro documental'}>
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Paciente</span>
            <select value={form.patientId} onChange={(event) => setForm((current) => ({ ...current, patientId: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none">
              {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.fullName}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Categoria</span>
            <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Conteúdo reservado</span>
            <textarea value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} className="min-h-36 rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <div className="flex flex-wrap gap-3">
            {editingId ? (
              <>
                <button className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold" onClick={() => { setEditingId(null); setForm((current) => ({ ...current, category: 'Planejamento', content: quickFillLibrary.observations[9], sensitivity: 'HIGH' })); }}>Cancelar edição</button>
                <button className="rounded-full bg-plum px-5 py-3 text-sm font-semibold text-white" disabled={!pinVerified} onClick={async () => {
                  try {
                    await updateRestrictedRecord(editingId, form);
                    notify('success', 'Registro restrito atualizado.');
                    setEditingId(null);
                  } catch (error) {
                    notify('error', error instanceof Error ? error.message : 'Falha ao atualizar registro restrito.');
                  }
                }}>Salvar edição</button>
              </>
            ) : (
              <button className="rounded-full bg-plum px-5 py-3 text-sm font-semibold text-white" disabled={!pinVerified} onClick={async () => {
                try {
                  await addRestrictedRecord(form);
                  notify('success', 'Registro restrito criado.');
                } catch (error) {
                  notify('error', error instanceof Error ? error.message : 'Falha ao criar registro restrito.');
                }
              }}>
                {pinVerified ? 'Salvar registro real' : 'Verifique o PIN para salvar'}
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
