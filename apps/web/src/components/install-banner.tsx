import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 top-4 z-50 rounded-3xl border border-white/50 bg-white/90 p-4 shadow-card backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Instale o LumniPsi</p>
          <p className="text-sm text-slate-600">Tenha acesso rápido ao prontuário, agenda e portal diretamente da tela inicial.</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full border border-slate-200 px-4 py-2 text-sm" onClick={() => setVisible(false)}>
            Agora não
          </button>
          <button
            className="rounded-full bg-lagoon px-4 py-2 text-sm font-semibold text-white"
            onClick={async () => {
              if (!deferredPrompt) return;
              await deferredPrompt.prompt();
              setVisible(false);
            }}
          >
            Instalar app
          </button>
        </div>
      </div>
    </div>
  );
}
