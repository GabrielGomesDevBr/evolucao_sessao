import { Bell, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAppState } from '../app/state/app-state';
import { useAuth } from '../app/state/auth-state';
import { apiRequest } from '../lib/api';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  readAt?: string | null;
};

export function Topbar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { appointments, documents, patients, selectedPatient, evolutions, professional } = useAppState();
  const { logout, token, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [search, setSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!token) return;
    void apiRequest<NotificationItem[]>('/notifications', {}, token).then(setNotifications).catch(() => setNotifications([]));
  }, [token]);

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];

    return [
      ...patients
        .filter((patient) => patient.fullName.toLowerCase().includes(query))
        .slice(0, 3)
        .map((patient) => ({ id: `patient-${patient.id}`, label: patient.fullName, meta: 'Paciente' })),
      ...appointments
        .filter((appointment) => appointment.title.toLowerCase().includes(query) || (appointment.patientName ?? '').toLowerCase().includes(query))
        .slice(0, 3)
        .map((appointment) => ({ id: `appointment-${appointment.id}`, label: appointment.title, meta: 'Agendamento' })),
      ...documents
        .filter((document) => document.type.toLowerCase().includes(query) || document.purpose.toLowerCase().includes(query))
        .slice(0, 3)
        .map((document) => ({ id: `document-${document.id}`, label: document.type, meta: 'Documento' })),
    ].slice(0, 6);
  }, [appointments, documents, patients, search]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/60 bg-white/60 px-6 py-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button className="rounded-full border border-slate-200 bg-white p-2" onClick={onToggle}>
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">workspace</p>
          <h1 className="font-display text-2xl text-ink">Prontuário, agenda e portal em um só fluxo</h1>
          {selectedPatient ? <p className="mt-1 text-sm text-slate-500">Paciente em foco: {selectedPatient.fullName} • {evolutions.filter((item) => item.patientId === selectedPatient.id).length} evoluções</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2">
            <Search size={16} className="text-slate-400" />
            <input className="w-52 border-none bg-transparent text-sm outline-none" placeholder="Buscar paciente, agenda, documento" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          {searchResults.length > 0 ? (
            <div className="absolute right-0 top-[calc(100%+10px)] w-80 rounded-3xl border border-slate-200 bg-white p-3 shadow-card">
              {searchResults.map((result) => (
                <div key={result.id} className="rounded-2xl px-3 py-3 text-sm hover:bg-slate-50">
                  <p className="font-semibold text-ink">{result.label}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{result.meta}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 lg:block">
          {professional?.licenseCode || 'CRP não configurado'} • {user?.firstName} {user?.lastName}
        </div>
        <div className="relative">
          <button className="rounded-full border border-slate-200 bg-white p-3" onClick={() => setShowNotifications((current) => !current)}>
            <Bell size={16} />
          </button>
          {notifications.length > 0 ? <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-coral text-[10px] font-bold text-white">{notifications.length}</span> : null}
          {showNotifications ? (
            <div className="absolute right-0 top-[calc(100%+10px)] w-96 rounded-3xl border border-slate-200 bg-white p-3 shadow-card">
              <p className="px-3 pb-2 text-sm font-semibold text-ink">Notificações</p>
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-slate-500">Sem notificações.</p>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-sm font-semibold text-ink">{notification.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{notification.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>
        <button className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white" onClick={logout}>
          Sair
        </button>
      </div>
    </header>
  );
}
