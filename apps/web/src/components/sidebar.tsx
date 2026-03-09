import clsx from 'clsx';
import { CalendarDays, FileText, Home, LockKeyhole, MessageCircleMore, NotebookPen, Settings, ShieldCheck, Users } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppState } from '../app/state/app-state';

const items = [
  { to: '/', label: 'Painel', icon: Home },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/evolucao', label: 'Evoluções', icon: NotebookPen },
  { to: '/pacientes', label: 'Pacientes', icon: Users },
  { to: '/documentos', label: 'Documentos', icon: FileText },
  { to: '/sigilo', label: 'Registro restrito', icon: LockKeyhole },
  { to: '/portal', label: 'Portal externo', icon: ShieldCheck },
  { to: '/assistente', label: 'Assistente', icon: MessageCircleMore },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const navigate = useNavigate();
  const { patients, selectedPatientId, setSelectedPatientId } = useAppState();

  return (
    <aside className={clsx('flex h-screen flex-col border-r border-white/50 bg-[#132033] text-white transition-all', collapsed ? 'w-[92px]' : 'w-[320px]')}>
      <div className="border-b border-white/10 px-6 py-6">
        <p className="font-display text-3xl">LumniPsi</p>
        {!collapsed && <p className="mt-2 text-xs uppercase tracking-[0.35em] text-white/60">Clínica digital + agenda viva</p>}
      </div>
      <nav className="space-y-1 px-4 py-4">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx('flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition', isActive ? 'bg-white text-ink shadow-card' : 'text-white/75 hover:bg-white/10 hover:text-white')}
          >
            <Icon size={18} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 border-t border-white/10 px-4 py-4">
        {!collapsed && <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/40">Clientes</p>}
        <div className="space-y-2 overflow-auto pr-1">
          {patients.map((patient) => (
            <button
              key={patient.id}
              className={clsx('flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left', selectedPatientId === patient.id ? 'bg-white text-ink' : 'bg-white/5 hover:bg-white/10')}
              onClick={() => {
                setSelectedPatientId(patient.id);
                navigate('/pacientes');
              }}
            >
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-coral to-apricot text-sm font-bold text-white">
                {patient.fullName.split(' ').slice(0, 2).map((part) => part[0]).join('')}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{patient.fullName}</p>
                  <p className={clsx('truncate text-xs', selectedPatientId === patient.id ? 'text-slate-500' : 'text-white/50')}>{patient.careModality}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
