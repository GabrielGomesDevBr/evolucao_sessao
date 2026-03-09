import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildDocumentPdf, createSimplePdf } from './pdf.js';

describe('pdf helpers', () => {
  it('creates a valid PDF buffer header', () => {
    const pdf = createSimplePdf([
      { text: 'Documento de teste', font: 'F2', size: 16 },
      { text: 'Linha complementar', size: 11 },
    ]);

    assert.equal(Buffer.isBuffer(pdf), true);
    assert.equal(pdf.subarray(0, 8).toString('utf8'), '%PDF-1.4');
    assert.match(pdf.toString('utf8'), /\/Type \/Page/);
  });

  it('creates multiple pages for long document exports', () => {
    const content = Array.from(
      { length: 220 },
      (_, index) => `Parágrafo clínico ${index + 1} com descrição detalhada da evolução e finalidade do documento.`,
    ).join('\n');

    const pdf = buildDocumentPdf({
      title: 'Relatório psicológico',
      tenantName: 'LumniPsi Clínica',
      patientName: 'Paciente Teste',
      purpose: 'Atender solicitação formal com linguagem técnica objetiva.',
      content,
      createdAt: new Date('2026-03-09T12:00:00.000Z'),
      sharedWithPortal: false,
      professionalName: 'Ana Souza',
      professionalLicense: 'CRP 00/12345',
      specialty: 'Psicologia clínica',
    });

    const body = pdf.toString('utf8');
    const pagesMatch = body.match(/\/Count (\d+)/);

    assert.ok(pagesMatch);
    assert.ok(Number(pagesMatch[1]) >= 2);
    assert.equal(pdf.subarray(0, 8).toString('utf8'), '%PDF-1.4');
  });
});
