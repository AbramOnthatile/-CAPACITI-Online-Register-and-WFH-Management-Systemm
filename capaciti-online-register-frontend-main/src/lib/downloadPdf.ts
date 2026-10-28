import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { formatSastDateTime } from './time';

type Cell = string | number | null | undefined;

export interface PdfTable {
  heading?: string;
  columns: string[];
  rows: Cell[][];
  // Columns (by index) holding numbers, right-aligned.
  numeric?: number[];
}

export interface PdfChart {
  heading?: string;
  // The element that holds the chart's <svg>.
  element: HTMLElement | null;
  legend?: { label: string; color: string }[];
}

export interface PdfDocument {
  filename: string;
  title: string;
  subtitle?: string;
  summary?: { label: string; value: Cell }[];
  chart?: PdfChart;
  tables: PdfTable[];
}

const NAVY: [number, number, number] = [29, 41, 81];
const VIOLET: [number, number, number] = [97, 21, 208];
const INK: [number, number, number] = [51, 65, 85];
const MUTED: [number, number, number] = [100, 116, 139];
const HAIRLINE: [number, number, number] = [226, 232, 240];
const MARGIN = 36;
const HEADER_HEIGHT = 64;

const hexToRgb = (hex: string): [number, number, number] => {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16)) as [number, number, number];
};

// Loads an image scaled down to `height` pixels so it doesn't bloat the file.
async function imageDataUrl(src: string, height: number): Promise<{ data: string; width: number; height: number } | null> {
  try {
    const image = new Image();
    image.src = src;
    await image.decode();
    const scale = Math.min(1, height / image.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
    return { data: canvas.toDataURL('image/png'), width: image.naturalWidth, height: image.naturalHeight };
  } catch {
    return null;
  }
}

// Draws a Recharts <svg> onto a canvas at 2x so it stays sharp in the PDF.
async function chartDataUrl(element: HTMLElement | null): Promise<{ data: string; width: number; height: number } | null> {
  const svg = element?.querySelector('svg');
  if (!svg) return null;
  const { width, height } = svg.getBoundingClientRect();
  if (!width || !height) return null;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('style', 'font-family: Helvetica, Arial, sans-serif; background: #ffffff;');
  const source = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.scale(scale, scale);
    context.drawImage(image, 0, 0, width, height);
    return { data: canvas.toDataURL('image/png'), width, height };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// A4 landscape report: branded header, summary strip, optional chart, tables, page numbers.
export async function buildPdf(document_: PdfDocument): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4', compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  const generated = `Generated ${formatSastDateTime(new Date().toISOString())} SAST`;
  const logo = await imageDataUrl('/images/capaciti-logo1.png', 120);

  const drawHeader = () => {
    pdf.setFillColor(...NAVY);
    pdf.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F');
    let textX = MARGIN;
    if (logo) {
      const logoHeight = 34;
      const logoWidth = (logo.width / logo.height) * logoHeight;
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(MARGIN - 6, (HEADER_HEIGHT - logoHeight) / 2 - 5, logoWidth + 12, logoHeight + 10, 4, 4, 'F');
      pdf.addImage(logo.data, 'PNG', MARGIN, (HEADER_HEIGHT - logoHeight) / 2, logoWidth, logoHeight, 'capaciti-logo', 'FAST');
      textX = MARGIN + logoWidth + 22;
    }
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(document_.title, textX, 30);
    if (document_.subtitle) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(203, 213, 225);
      pdf.text(document_.subtitle, textX, 46);
    }
    pdf.setFontSize(8.5);
    pdf.setTextColor(203, 213, 225);
    pdf.text(generated, pageWidth - MARGIN, 30, { align: 'right' });
  };

  drawHeader();
  let y = HEADER_HEIGHT + 24;

  const sectionHeading = (text: string) => {
    if (y > pageHeight - 90) {
      pdf.addPage();
      drawHeader();
      y = HEADER_HEIGHT + 24;
    }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...NAVY);
    pdf.text(text, MARGIN, y);
    y += 10;
  };

  if (document_.summary?.length) {
    const gap = 10;
    const boxWidth = (contentWidth - gap * (document_.summary.length - 1)) / document_.summary.length;
    document_.summary.forEach((item, index) => {
      const x = MARGIN + index * (boxWidth + gap);
      pdf.setDrawColor(...HAIRLINE);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(x, y, boxWidth, 52, 6, 6, 'FD');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(...MUTED);
      pdf.text(item.label.toUpperCase(), x + 12, y + 18);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(...NAVY);
      pdf.text(String(item.value ?? '—'), x + 12, y + 40);
    });
    y += 52 + 26;
  }

  if (document_.chart) {
    const chart = await chartDataUrl(document_.chart.element);
    if (chart) {
      sectionHeading(document_.chart.heading ?? 'Chart');
      if (document_.chart.legend?.length) {
        let legendX = MARGIN;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        document_.chart.legend.forEach((item) => {
          pdf.setFillColor(...hexToRgb(item.color));
          pdf.rect(legendX, y, 8, 8, 'F');
          pdf.setTextColor(...INK);
          pdf.text(item.label, legendX + 12, y + 7);
          legendX += 12 + pdf.getTextWidth(item.label) + 16;
        });
        y += 16;
      }
      const maxHeight = Math.min(230, pageHeight - y - 50);
      const width = Math.min(contentWidth, (chart.width / chart.height) * maxHeight);
      const height = (chart.height / chart.width) * width;
      pdf.addImage(chart.data, 'PNG', MARGIN, y, width, height, undefined, 'FAST');
      y += height + 26;
    }
  }

  for (const table of document_.tables) {
    if (table.heading) sectionHeading(table.heading);
    const numeric = Object.fromEntries((table.numeric ?? []).map((index) => [index, { halign: 'right' as const }]));
    autoTable(pdf, {
      startY: y,
      head: [table.columns],
      body: table.rows.map((row) => row.map((cell) => (cell === null || cell === undefined || cell === '' ? '—' : String(cell)))),
      margin: { left: MARGIN, right: MARGIN, top: HEADER_HEIGHT + 20, bottom: 40 },
      styles: { font: 'helvetica', fontSize: 8.5, textColor: INK, cellPadding: { top: 5, bottom: 5, left: 6, right: 6 }, lineColor: HAIRLINE, lineWidth: { bottom: 0.5 } },
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', lineWidth: 0 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: numeric,
      willDrawPage: (data) => {
        if (data.pageNumber > 1) drawHeader();
      },
    });
    y = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 26;
  }

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(...HAIRLINE);
    pdf.line(MARGIN, pageHeight - 28, pageWidth - MARGIN, pageHeight - 28);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...MUTED);
    pdf.text('CAPACITI Workforce Management System', MARGIN, pageHeight - 16);
    pdf.setTextColor(...VIOLET);
    pdf.text(`Page ${page} of ${pages}`, pageWidth - MARGIN, pageHeight - 16, { align: 'right' });
  }

  return pdf;
}

export async function downloadPdf(document_: PdfDocument) {
  (await buildPdf(document_)).save(document_.filename);
}
