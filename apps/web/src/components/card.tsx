import type { PropsWithChildren, ReactNode } from 'react';

export function Card({ title, action, children }: PropsWithChildren<{ title: string; action?: ReactNode }>) {
  return (
    <section className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-card backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
