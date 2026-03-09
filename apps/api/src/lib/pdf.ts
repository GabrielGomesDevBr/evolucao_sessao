type PdfFont = 'F1' | 'F2';

type PdfLine = {
  text: string;
  font?: PdfFont;
  size?: number;
  spacingAfter?: number;
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const LEFT_MARGIN = 50;
const TOP_MARGIN = 790;
const BOTTOM_MARGIN = 50;

function encodePdfHex(text: string) {
  const utf16le = Buffer.from(text, 'utf16le');
  const utf16be = Buffer.alloc(utf16le.length);

  for (let index = 0; index < utf16le.length; index += 2) {
    utf16be[index] = utf16le[index + 1] ?? 0;
    utf16be[index + 1] = utf16le[index] ?? 0;
  }

  return `FEFF${utf16be.toString('hex').toUpperCase()}`;
}

function wrapText(text: string, maxChars: number) {
  const normalized = text.replace(/\r\n/g, '\n');
  const paragraphs = normalized.split('\n');
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      lines.push('');
      continue;
    }

    const words = trimmed.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (candidate.length <= maxChars) {
        currentLine = candidate;
        continue;
      }

      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }

    if (currentLine) lines.push(currentLine);
  }

  return lines;
}

function buildPdf(pages: string[]) {
  const objects: string[] = [];

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, index) => `${5 + index * 2} 0 R`).join(' ')}] >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

  pages.forEach((content, index) => {
    const pageObjectNumber = 5 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    objects[pageObjectNumber] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`;
    objects[contentObjectNumber] = `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = Buffer.byteLength(pdf, 'utf8');
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += '0000000000 65535 f \n';

  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

export function createSimplePdf(lines: PdfLine[]) {
  const pages: string[] = [];
  let currentCommands: string[] = [];
  let currentY = TOP_MARGIN;

  const commitPage = () => {
    if (currentCommands.length > 0) {
      pages.push(currentCommands.join('\n'));
      currentCommands = [];
    }
  };

  for (const line of lines) {
    const font = line.font ?? 'F1';
    const size = line.size ?? 11;
    const spacingAfter = line.spacingAfter ?? 4;
    const lineHeight = size + spacingAfter;

    if (line.text === '') {
      currentY -= lineHeight;
      continue;
    }

    if (currentY - lineHeight < BOTTOM_MARGIN) {
      commitPage();
      currentY = TOP_MARGIN;
    }

    currentCommands.push(`BT /${font} ${size} Tf ${LEFT_MARGIN} ${currentY} Td <${encodePdfHex(line.text)}> Tj ET`);
    currentY -= lineHeight;
  }

  commitPage();

  return buildPdf(pages.length > 0 ? pages : ['BT /F1 12 Tf 50 790 Td <FEFF0044006F00630075006D0065006E0074006F002000760061007A0069006F> Tj ET']);
}

export function buildDocumentPdf(input: {
  title: string;
  tenantName: string;
  patientName: string;
  purpose: string;
  content: string;
  requester?: string | null;
  validityText?: string | null;
  createdAt: Date;
  sharedWithPortal: boolean;
  professionalName?: string | null;
  professionalLicense?: string | null;
  specialty?: string | null;
}) {
  const metaDate = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(input.createdAt);

  const footerDate = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date());

  const lines: PdfLine[] = [
    { text: input.title, font: 'F2', size: 18, spacingAfter: 10 },
    { text: input.tenantName, font: 'F1', size: 12, spacingAfter: 12 },
    { text: `Paciente: ${input.patientName}`, font: 'F2', size: 12, spacingAfter: 4 },
    { text: `Emitido em: ${metaDate}`, size: 11, spacingAfter: 4 },
    { text: `Compartilhamento no portal: ${input.sharedWithPortal ? 'autorizado' : 'interno'}`, size: 11, spacingAfter: 8 },
  ];

  if (input.requester) {
    lines.push({ text: `Solicitante: ${input.requester}`, size: 11, spacingAfter: 8 });
  }

  lines.push({ text: 'Finalidade', font: 'F2', size: 13, spacingAfter: 6 });
  wrapText(input.purpose, 88).forEach((line) => lines.push({ text: line, size: 11, spacingAfter: 4 }));
  lines.push({ text: '', size: 8, spacingAfter: 8 });
  lines.push({ text: 'Conteudo do documento', font: 'F2', size: 13, spacingAfter: 6 });
  wrapText(input.content, 88).forEach((line) => lines.push({ text: line, size: 11, spacingAfter: 4 }));

  if (input.validityText) {
    lines.push({ text: '', size: 8, spacingAfter: 8 });
    lines.push({ text: 'Validade / observacoes', font: 'F2', size: 13, spacingAfter: 6 });
    wrapText(input.validityText, 88).forEach((line) => lines.push({ text: line, size: 11, spacingAfter: 4 }));
  }

  lines.push({ text: '', size: 8, spacingAfter: 8 });
  lines.push({ text: 'Responsavel tecnico', font: 'F2', size: 13, spacingAfter: 6 });
  lines.push({ text: input.professionalName || 'Profissional responsavel', size: 11, spacingAfter: 4 });
  if (input.professionalLicense) {
    lines.push({ text: `Registro profissional: ${input.professionalLicense}`, size: 11, spacingAfter: 4 });
  }
  if (input.specialty) {
    lines.push({ text: `Especialidade: ${input.specialty}`, size: 11, spacingAfter: 4 });
  }

  lines.push({ text: '', size: 8, spacingAfter: 8 });
  lines.push({ text: `Gerado pelo sistema em ${footerDate}.`, size: 10, spacingAfter: 4 });

  return createSimplePdf(lines);
}
