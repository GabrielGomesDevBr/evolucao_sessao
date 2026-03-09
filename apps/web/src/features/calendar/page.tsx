import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/card';
import { useAppState } from '../../app/state/app-state';
import { useFeedback } from '../../app/state/feedback-state';
import { formatDate, formatTime } from '../../lib/utils';

const colorOptions = ['bg-lagoon', 'bg-coral', 'bg-plum', 'bg-apricot'] as const;
const statusOptions = ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELED', 'RESCHEDULED', 'BLOCKED'] as const;
type AppointmentStatus = typeof statusOptions[number];
type AppointmentColor = typeof colorOptions[number];
type AppointmentForm = {
  patientId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  colorToken: AppointmentColor;
  notes: string;
};

function getDefaultForm(patientId = ''): AppointmentForm {
  return {
    patientId,
    title: 'Sessão individual',
    startsAt: new Date().toISOString().slice(0, 16),
    endsAt: new Date(Date.now() + 50 * 60 * 1000).toISOString().slice(0, 16),
    status: 'SCHEDULED' as const,
    colorToken: 'bg-lagoon' as const,
    notes: '',
  };
}

export function CalendarPage() {
  const { addAppointment, appointments, deleteAppointment, patients, selectedPatient, updateAppointment } = useAppState();
  const { notify } = useFeedback();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AppointmentForm>(getDefaultForm(selectedPatient?.id ?? patients[0]?.id ?? ''));

  useEffect(() => {
    if (!form.patientId && (selectedPatient?.id || patients[0]?.id)) {
      setForm((current) => ({ ...current, patientId: selectedPatient?.id ?? patients[0]?.id ?? '' }));
    }
  }, [form.patientId, patients, selectedPatient]);

  const sortedAppointments = useMemo(
    () => [...appointments].sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()),
    [appointments],
  );

  const selectedPatientAppointments = useMemo(
    () =>
      sortedAppointments.filter((appointment) => {
        if (!selectedPatient) return true;
        return appointment.patientId === selectedPatient.id;
      }),
    [selectedPatient, sortedAppointments],
  );

  const nextAppointments = selectedPatientAppointments.slice(0, 6);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <Card title="Próximos agendamentos">
          <div className="space-y-3">
            {nextAppointments.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum agendamento para o filtro atual.</p>
            ) : (
              nextAppointments.map((appointment) => (
                <div key={appointment.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{appointment.status}</p>
                      <p className="mt-2 font-semibold text-ink">{appointment.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {appointment.patientName || 'Sem paciente'} • {formatDate(appointment.startsAt)} • {formatTime(appointment.startsAt)} - {formatTime(appointment.endsAt)}
                      </p>
                      {appointment.notes ? <p className="mt-2 text-sm text-slate-600">{appointment.notes}</p> : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold"
                        onClick={() => {
                          setEditingId(appointment.id);
                          setForm({
                            patientId: appointment.patientId ?? '',
                            title: appointment.title,
                            startsAt: appointment.startsAt.slice(0, 16),
                            endsAt: appointment.endsAt.slice(0, 16),
                            status: appointment.status,
                            colorToken: (colorOptions.find((option) => option === appointment.colorToken) ?? 'bg-lagoon'),
                            notes: appointment.notes ?? '',
                          });
                        }}
                      >
                        Editar
                      </button>
                      <button className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600" onClick={async () => {
                        try {
                          await deleteAppointment(appointment.id);
                          notify('success', 'Agendamento excluido.');
                        } catch (error) {
                          notify('error', error instanceof Error ? error.message : 'Falha ao excluir agendamento.');
                        }
                      }}>
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card title={selectedPatient ? `Agenda de ${selectedPatient.fullName}` : 'Visão geral'}>
          <div className="space-y-3">
            {selectedPatientAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between rounded-3xl bg-white px-4 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-3 rounded-full ${appointment.colorToken}`} />
                  <div>
                    <p className="font-semibold text-ink">{appointment.title}</p>
                    <p className="text-sm text-slate-500">
                      {formatDate(appointment.startsAt)} • {formatTime(appointment.startsAt)} - {formatTime(appointment.endsAt)}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{appointment.status}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title={editingId ? 'Editar agendamento' : 'Novo agendamento'}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Paciente</span>
            <select value={form.patientId} onChange={(event) => setForm((current) => ({ ...current, patientId: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none">
              <option value="">Sem paciente</option>
              {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.fullName}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Status</span>
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as AppointmentStatus }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none">
              {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-slate-600 md:col-span-2">
            <span>Título</span>
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Início</span>
            <input type="datetime-local" value={form.startsAt} onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Fim</span>
            <input type="datetime-local" value={form.endsAt} onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Cor</span>
            <select value={form.colorToken} onChange={(event) => setForm((current) => ({ ...current, colorToken: event.target.value as AppointmentColor }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none">
              {colorOptions.map((tone) => <option key={tone} value={tone}>{tone}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-slate-600 md:col-span-2">
            <span>Observações internas</span>
            <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <div className="md:col-span-2 flex flex-wrap gap-3">
            {editingId ? (
              <>
                <button
                  className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold"
                  onClick={() => {
                    setEditingId(null);
                    setForm(getDefaultForm(selectedPatient?.id ?? patients[0]?.id ?? ''));
                  }}
                >
                  Cancelar edição
                </button>
                <button className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white" onClick={async () => {
                  try {
                    await updateAppointment(editingId, form);
                    notify('success', 'Agendamento atualizado.');
                    setEditingId(null);
                  } catch (error) {
                    notify('error', error instanceof Error ? error.message : 'Falha ao atualizar agendamento.');
                  }
                }}>
                  Salvar edição
                </button>
              </>
            ) : (
              <button className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white" onClick={async () => {
                try {
                  await addAppointment(form);
                  notify('success', 'Agendamento criado.');
                  setForm(getDefaultForm(selectedPatient?.id ?? patients[0]?.id ?? ''));
                } catch (error) {
                  notify('error', error instanceof Error ? error.message : 'Falha ao criar agendamento.');
                }
              }}>
                Salvar agendamento
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
