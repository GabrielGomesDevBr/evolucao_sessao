import { Card } from '../../components/card';
import { useAppState } from '../../app/state/app-state';
import { formatDate, formatTime } from '../../lib/utils';

export function DashboardPage() {
  const { appointments, documents, evolutions, patients, restrictedRecords, selectedPatient } = useAppState();
  const stats = [
    { label: 'Pacientes ativos', value: patients.length, tone: 'from-lagoon to-mint' },
    { label: 'Sessões registradas', value: evolutions.length, tone: 'from-coral to-apricot' },
    { label: 'Documentos emitidos', value: documents.length, tone: 'from-plum to-coral' },
    { label: 'Registros restritos', value: restrictedRecords.length, tone: 'from-ink to-lagoon' },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[32px] bg-[#142031] p-8 text-white shadow-card">
          <p className="text-sm uppercase tracking-[0.35em] text-white/45">LumniPsi</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl leading-tight">Operação clínica integrada com agenda, prontuário, portal e área documental sensível.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70">Os dados da área profissional já são carregados da API e refletem o estado real do tenant autenticado, incluindo pacientes, agenda, documentos e registros restritos quando o PIN está ativo.</p>
        </div>
        <Card title="Paciente em foco">
          {selectedPatient ? (
            <div className="space-y-3 text-sm text-slate-600">
              <p className="text-lg font-semibold text-ink">{selectedPatient.fullName}</p>
              <p>{selectedPatient.careModality} • {selectedPatient.careFrequency}</p>
              <p>{selectedPatient.demandSummary}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Selecione um paciente na barra lateral.</p>
          )}
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`rounded-[28px] bg-gradient-to-br ${stat.tone} p-5 text-white shadow-card`}>
            <p className="text-sm text-white/70">{stat.label}</p>
            <p className="mt-3 font-display text-5xl">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card title="Próximos agendamentos">
          <div className="space-y-3">
            {appointments.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.status}</p>
                <p className="mt-2 font-semibold text-ink">{item.title}</p>
                <p className="text-sm text-slate-500">{item.patientName || 'Sem paciente'} • {formatDate(item.startsAt)} • {formatTime(item.startsAt)}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Últimas evoluções">
          <div className="space-y-3">
            {evolutions.slice(0, 4).map((item) => {
              const patient = patients.find((entry) => entry.id === item.patientId);
              return (
                <div key={item.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <p className="font-semibold text-ink">{patient?.fullName ?? 'Paciente'}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">Sessão {item.sessionNumber} • {formatDate(item.serviceDate)}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
}
