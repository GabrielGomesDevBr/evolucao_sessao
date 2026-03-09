import { useEffect, useState } from 'react';
import { documentTypeLabels, quickFillLibrary } from '@lumnipsi/shared';
import { Card } from '../../components/card';
import { useAppState } from '../../app/state/app-state';
import { useAuth } from '../../app/state/auth-state';
import { useFeedback } from '../../app/state/feedback-state';
import { API_URL } from '../../lib/api';
import { formatDate } from '../../lib/utils';

function buildDefaultForm(patientId = '') {
  return {
    patientId,
    type: 'REPORT',
    purpose: quickFillLibrary.documentPurposes[0],
    content: quickFillLibrary.evolutionSummary[0],
    shared: false,
  };
}

export function DocumentsPage() {
  const { addDocument, deleteDocument, documents, patients, selectedPatient, updateDocument } = useAppState();
  const { token } = useAuth();
  const { notify } = useFeedback();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [form, setForm] = useState(buildDefaultForm(selectedPatient?.id ?? patients[0]?.id ?? ''));

  useEffect(() => {
    if ((selectedPatient?.id || patients[0]?.id) && !form.patientId) {
      setForm((current) => ({ ...current, patientId: selectedPatient?.id ?? patients[0]?.id ?? '' }));
    }
  }, [form.patientId, patients, selectedPatient]);

  async function exportPdf(documentId: string, patientName: string, documentType: string) {
    if (!token) return;

    setExportingId(documentId);
    try {
      const response = await fetch(`${API_URL}/documents/${documentId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Falha ao exportar PDF.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = globalThis.document.createElement('a');
      const safeLabel = `${documentTypeLabels[documentType as keyof typeof documentTypeLabels] ?? documentType}-${patientName}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();

      link.href = url;
      link.download = `${safeLabel || documentId}.pdf`;
      globalThis.document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notify('success', 'PDF exportado.');
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Falha ao exportar PDF.');
    } finally {
      setExportingId(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <Card title="Documentos gerados">
        <div className="space-y-3">
          {documents.map((doc) => {
            const patient = patients.find((item) => item.id === doc.patientId);
            return (
              <div key={doc.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{documentTypeLabels[doc.type as keyof typeof documentTypeLabels] ?? doc.type}</p>
                    <p className="mt-2 font-semibold text-ink">{patient?.fullName ?? 'Paciente'}</p>
                    <p className="mt-1 text-sm text-slate-500">{doc.purpose}</p>
                    <p className="mt-2 text-xs text-slate-400">{formatDate(doc.createdAt)} • {doc.shared ? 'Liberado no portal' : 'Interno'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold"
                      onClick={() => {
                        setEditingId(doc.id);
                        setForm({
                          patientId: doc.patientId,
                          type: doc.type,
                          purpose: doc.purpose,
                          content: doc.content,
                          shared: doc.shared,
                        });
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-full border border-lagoon/20 px-3 py-1 text-xs font-semibold text-lagoon"
                      onClick={() => void exportPdf(doc.id, patient?.fullName ?? 'paciente', doc.type)}
                    >
                      {exportingId === doc.id ? 'Exportando...' : 'PDF'}
                    </button>
                    <button className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600" onClick={async () => {
                      try {
                        await deleteDocument(doc.id);
                        notify('success', 'Documento excluido.');
                      } catch (error) {
                        notify('error', error instanceof Error ? error.message : 'Falha ao excluir documento.');
                      }
                    }}>
                      Excluir
                    </button>
                  </div>
                </div>
                <details className="mt-3 text-sm text-slate-600">
                  <summary className="cursor-pointer font-medium text-lagoon">Visualizar conteúdo</summary>
                  <p className="mt-2 whitespace-pre-wrap leading-6">{doc.content}</p>
                </details>
              </div>
            );
          })}
        </div>
      </Card>
      <Card title={editingId ? 'Editar documento' : 'Gerar documento'}>
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Tipo</span>
            <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none">
              {Object.entries(documentTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Paciente</span>
            <select value={form.patientId} onChange={(event) => setForm((current) => ({ ...current, patientId: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none">
              {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.fullName}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Finalidade</span>
            <textarea value={form.purpose} onChange={(event) => setForm((current) => ({ ...current, purpose: event.target.value }))} className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span>Conteúdo</span>
            <textarea value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} className="min-h-40 rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
            <input type="checkbox" checked={form.shared} onChange={(event) => setForm((current) => ({ ...current, shared: event.target.checked }))} />
            Compartilhar no portal do cliente
          </label>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold" onClick={() => setForm((current) => ({ ...current, purpose: quickFillLibrary.documentPurposes[3] }))}>
              Trocar finalidade
            </button>
            {editingId ? (
              <>
                <button
                  className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold"
                  onClick={() => {
                    setEditingId(null);
                    setForm(buildDefaultForm(selectedPatient?.id ?? patients[0]?.id ?? ''));
                  }}
                >
                  Cancelar edição
                </button>
                <button className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white" onClick={async () => {
                  try {
                    await updateDocument(editingId, form);
                    notify('success', 'Documento atualizado.');
                    setEditingId(null);
                  } catch (error) {
                    notify('error', error instanceof Error ? error.message : 'Falha ao atualizar documento.');
                  }
                }}>
                  Salvar edição
                </button>
              </>
            ) : (
              <button className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white" onClick={async () => {
                try {
                  await addDocument(form);
                  notify('success', 'Documento criado.');
                  setForm(buildDefaultForm(selectedPatient?.id ?? patients[0]?.id ?? ''));
                } catch (error) {
                  notify('error', error instanceof Error ? error.message : 'Falha ao criar documento.');
                }
              }}>
                Salvar documento
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
