import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppState } from '../app/state/app-state';
import { useFeedback } from '../app/state/feedback-state';
import { InstallBanner } from './install-banner';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export function Shell() {
  const [collapsed, setCollapsed] = useState(false);
  const { loading } = useAppState();
  const { dismiss, items } = useFeedback();

  const toneClasses = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-red-200 bg-red-50 text-red-900',
    info: 'border-slate-200 bg-white text-ink',
  } as const;

  return (
    <div className="flex min-h-screen bg-mesh text-ink">
      <InstallBanner />
      <div className="fixed right-4 top-4 z-[70] flex w-full max-w-sm flex-col gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            className={`rounded-2xl border px-4 py-3 text-left text-sm shadow-card ${toneClasses[item.tone]}`}
            onClick={() => dismiss(item.id)}
          >
            {item.message}
          </button>
        ))}
      </div>
      <Sidebar collapsed={collapsed} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
        <main className="flex-1 px-6 py-6">
          {loading ? <div className="mb-4 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-500">Sincronizando dados com a API...</div> : null}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
