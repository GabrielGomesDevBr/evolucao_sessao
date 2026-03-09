import { useEffect, useMemo, useState } from 'react';
import { quickFillLibrary } from '@lumnipsi/shared';
import { Card } from '../../components/card';
import { useAppState } from '../../app/state/app-state';
import { useFeedback } from '../../app/state/feedback-state';
import { formatDate } from '../../lib/utils';

export function EvolutionPage() {
  const { addEvolution, deleteEvolution, evolutions, patients, selectedPatient, setSelectedPatientId, updateEvolution } = useAppState();
  const { notify } = useFeedback();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().slice(0, 16));
  const [sessionNumber, setSessionNumber] = useState('1');
  const [durationMinutes, setDurationMinutes] = useState('50');
  const [summary, setSummary] = useState(quickFillLibrary.evolutionSummary[0]);
  const [procedures, setProcedures] = useState(quickFillLibrary.procedures[0]);
  const [observations, setObservations] = useState(quickFillLibrary.observations[0]);

  const selectedPatientEvolutions = useMemo(
    () => evolutions.filter((item) => item.patientId === selectedPatient?.id).slice(0, 6),
    [evolutions, selectedPatient],
  );

  useEffect(() => {
    if (selectedPatient?.id) {
      setSelectedPatientId(selectedPatient.id);
    }
  }, [selectedPatient, setSelectedPatientId]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
      <Card title="Histórico recente">
        <div className="space-y-3">
          {selectedPatientEvolutions.length === 0 ? <p className="text-sm text-slate-500">Nenhuma evolução para o paciente selecionado.</p> : selectedPatientEvolutions.map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">Sessão {item.sessionNumber || '-'}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">{formatDate(item.serviceDate)}</p>
                  <p className="mt-2 leading-6">{item.summary}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold"
                    onClick={() => {
                      setEditingId(item.id);
                      setServiceDate(item.serviceDate.slice(0, 16));
                      setSessionNumber(String(item.sessionNumber || 1));
                      setDurationMinutes(String(item.durationMinutes || 50));
                      setSummary(item.summary);
                      setProcedures(item.procedures);
                      setObservations(item.observations);
                      setSelectedPatientId(item.patientId);
                    }}
                  >
                    Editar
                  </button>
                  <button className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600" onClick={async () => {
                    try {
                      await deleteEvolution(item.id);
                      notify('success', 'Evolucao excluida.');
                    } catch (error) {
                      notify('error', error instanceof Error ? error.message : 'Falha ao excluir evolucao.');
                    }
                  }}>Excluir</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card title={editingId ? 'Editar evolução' : 'Nova evolução'}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Paciente</span>
            <select
              value={selectedPatient?.id}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              onChange={(event) => setSelectedPatientId(event.target.value)}
            >
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>{patient.fullName}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Data e hora</span>
            <input type="datetime-local" value={serviceDate} onChange={(event) => setServiceDate(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Número da sessão</span>
            <input value={sessionNumber} onChange={(event) => setSessionNumber(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Duração (min)</span>
            <input value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600 md:col-span-2">
            <span>Síntese da evolução</span>
            <textarea value={summary} onChange={(event) => setSummary(event.target.value)} className="min-h-40 rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600 md:col-span-2">
            <span>Procedimentos</span>
            <textarea value={procedures} onChange={(event) => setProcedures(event.target.value)} className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600 md:col-span-2">
            <span>Observações</span>
            <textarea value={observations} onChange={(event) => setObservations(event.target.value)} className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold" onClick={() => setSummary(quickFillLibrary.evolutionSummary[1])}>Usar outro modelo</button>
            {editingId ? (
              <>
                <button
                  className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold"
                  onClick={() => {
                    setEditingId(null);
                    setSummary(quickFillLibrary.evolutionSummary[0]);
                    setProcedures(quickFillLibrary.procedures[0]);
                    setObservations(quickFillLibrary.observations[0]);
                  }}
                >
                  Cancelar edição
                </button>
                <button
                  className="rounded-full bg-lagoon px-5 py-3 text-sm font-semibold text-white"
                  onClick={async () => {
                    if (!selectedPatient) return;
                    try {
                      await updateEvolution(editingId, {
                        patientId: selectedPatient.id,
                        serviceDate,
                        sessionNumber: Number(sessionNumber || 1),
                        durationMinutes: Number(durationMinutes || 50),
                        summary,
                        procedures,
                        observations,
                      });
                      notify('success', 'Evolucao atualizada.');
                      setEditingId(null);
                    } catch (error) {
                      notify('error', error instanceof Error ? error.message : 'Falha ao atualizar evolucao.');
                    }
                  }}
                >
                  Salvar edição
                </button>
              </>
            ) : (
              <button
                className="rounded-full bg-lagoon px-5 py-3 text-sm font-semibold text-white"
                onClick={async () => {
                  if (!selectedPatient) return;
                  try {
                    await addEvolution({
                      patientId: selectedPatient.id,
                      serviceDate,
                      sessionNumber: Number(sessionNumber || 1),
                      durationMinutes: Number(durationMinutes || 50),
                      summary,
                      procedures,
                      observations,
                    });
                    notify('success', 'Evolucao criada.');
                  } catch (error) {
                    notify('error', error instanceof Error ? error.message : 'Falha ao criar evolucao.');
                  }
                }}
              >
                Salvar evolução real
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
