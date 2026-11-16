import PDFDocument from 'pdfkit';
import type { MonthlyReportData } from './analytics.service.js';

const BRAND = '#4f46e5';
const BRAND_DARK = '#3730a3';
const SLATE_900 = '#0f172a';
const SLATE_700 = '#334155';
const SLATE_500 = '#64748b';
const SLATE_200 = '#e2e8f0';
const SLATE_100 = '#f1f5f9';
const GREEN = '#15803d';
const GREEN_BG = '#f0fdf4';
const RED = '#be123c';
const RED_BG = '#fff1f2';
const AMBER = '#b45309';
const AMBER_BG = '#fffbeb';

const PAGE_MARGIN = 42;

const cop = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `$${Math.round(value).toLocaleString('es-CO')}`;
};

const pct = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value.toLocaleString('es-CO', { maximumFractionDigits: 1 })}%`;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Bogota',
  });

const typeLabel = (type: string) => {
  if (type === 'renta') return 'Renta';
  if (type === 'arrear_payment') return 'Abono a mora';
  return 'Otro';
};

const statusLabel = (status: string) => {
  if (status === 'completa') return 'Completa';
  if (status === 'parcial') return 'Parcial';
  return 'Sin pago';
};

const statusColor = (status: string) => {
  if (status === 'completa') return GREEN;
  if (status === 'parcial') return AMBER;
  return RED;
};

const statusBg = (status: string) => {
  if (status === 'completa') return GREEN_BG;
  if (status === 'parcial') return AMBER_BG;
  return RED_BG;
};

const contentWidth = (doc: PDFKit.PDFDocument) =>
  doc.page.width - doc.page.margins.left - doc.page.margins.right;

const bottomY = (doc: PDFKit.PDFDocument) => doc.page.height - doc.page.margins.bottom;

const ensureSpace = (doc: PDFKit.PDFDocument, height: number) => {
  if (doc.y + height > bottomY(doc)) {
    doc.addPage();
  }
};

const sectionTitle = (doc: PDFKit.PDFDocument, title: string, subtitle?: string) => {
  ensureSpace(doc, subtitle ? 42 : 30);
  doc
    .fillColor(BRAND)
    .font('Helvetica-Bold')
    .fontSize(13)
    .text(title.toUpperCase(), doc.page.margins.left, doc.y, { characterSpacing: 0.6 });
  if (subtitle) {
    doc
      .fillColor(SLATE_500)
      .font('Helvetica')
      .fontSize(8.5)
      .text(subtitle, doc.page.margins.left, doc.y + 1);
  }
  doc.moveDown(0.5);
  const y = doc.y;
  doc
    .strokeColor(SLATE_200)
    .lineWidth(1)
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.margins.left + contentWidth(doc), y)
    .stroke();
  doc.y = y + 8;
};

interface TableOptions {
  headers: string[];
  widths: number[];
  rows: string[][];
  align?: Array<'left' | 'right' | 'center'>;
  fontSize?: number;
  headerFontSize?: number;
  rowColors?: Array<string | null>;
  boldLastRow?: boolean;
}

const drawTable = (doc: PDFKit.PDFDocument, options: TableOptions) => {
  const {
    headers,
    widths,
    rows,
    align = headers.map(() => 'left' as const),
    fontSize = 8,
    headerFontSize = 7.5,
    rowColors,
    boldLastRow = false,
  } = options;

  const x0 = doc.page.margins.left;
  const headerHeight = 17;
  const cellPadding = 3;

  const drawHeader = () => {
    const y = doc.y;
    doc.save();
    doc.rect(x0, y, widths.reduce((sum, width) => sum + width, 0), headerHeight).fill(BRAND_DARK);
    doc.restore();
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(headerFontSize);
    let x = x0;
    headers.forEach((header, index) => {
      doc.text(header.toUpperCase(), x + cellPadding, y + 5, {
        width: widths[index] - cellPadding * 2,
        align: align[index],
        lineBreak: false,
      });
      x += widths[index];
    });
    doc.y = y + headerHeight;
  };

  ensureSpace(doc, headerHeight + 22);
  drawHeader();

  rows.forEach((row, rowIndex) => {
    doc.font(boldLastRow && rowIndex === rows.length - 1 ? 'Helvetica-Bold' : 'Helvetica').fontSize(fontSize);
    const heights = row.map((cell, index) =>
      doc.heightOfString(cell || '—', {
        width: widths[index] - cellPadding * 2,
        align: align[index],
      })
    );
    const rowHeight = Math.max(12, Math.max(...heights) + cellPadding * 2);

    if (doc.y + rowHeight > bottomY(doc)) {
      doc.addPage();
      drawHeader();
    }

    const y = doc.y;
    const fill = rowColors?.[rowIndex] || (rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc');
    doc.save();
    doc.rect(x0, y, widths.reduce((sum, width) => sum + width, 0), rowHeight).fill(fill);
    doc.restore();

    doc.fillColor(SLATE_700);
    let x = x0;
    row.forEach((cell, index) => {
      doc.text(cell || '—', x + cellPadding, y + cellPadding, {
        width: widths[index] - cellPadding * 2,
        align: align[index],
      });
      x += widths[index];
    });

    doc
      .strokeColor('#e8edf3')
      .lineWidth(0.5)
      .moveTo(x0, y + rowHeight)
      .lineTo(x0 + widths.reduce((sum, width) => sum + width, 0), y + rowHeight)
      .stroke();

    doc.y = y + rowHeight;
  });

  doc.y += 8;
};

const drawKpiBox = (
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  color: string,
  background: string
) => {
  doc.save();
  doc.roundedRect(x, y, width, height, 7).fill(background);
  doc.restore();
  doc
    .fillColor(color)
    .font('Helvetica-Bold')
    .fontSize(7)
    .text(label.toUpperCase(), x + 10, y + 9, { width: width - 20, characterSpacing: 0.3 });
  doc
    .fillColor(SLATE_900)
    .font('Helvetica-Bold')
    .fontSize(14)
    .text(value, x + 10, y + 23, { width: width - 20 });
};

export const buildMonthlyReportPdf = (data: MonthlyReportData): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: PAGE_MARGIN,
      bufferPages: true,
      info: {
        Title: `Extracto mensual FleetMaster Hub - ${data.month}`,
        Author: 'FleetMaster Hub',
        Subject: `Reporte de flota y conductores ${data.monthName}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = doc.page.margins.left;
    const width = contentWidth(doc);

    /* --------------------------- Portada --------------------------- */
    doc.save();
    doc.rect(0, 0, doc.page.width, 150).fill(BRAND);
    doc.restore();

    doc
      .fillColor('#c7d2fe')
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('FLEETMASTER HUB', left, 46, { characterSpacing: 2 });

    doc
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(26)
      .text('Extracto Mensual de Flota', left, 64, { width });

    doc
      .fillColor('#e0e7ff')
      .font('Helvetica')
      .fontSize(13)
      .text(
        `${data.monthName.charAt(0).toUpperCase()}${data.monthName.slice(1)} · ${data.range.label}`,
        left,
        102,
        { width }
      );

    doc
      .fillColor('#c7d2fe')
      .fontSize(9)
      .text(
        `Propietario: ${data.user?.username || 'FleetMaster Hub'} · Generado: ${formatDate(
          new Date().toISOString()
        )}`,
        left,
        122,
        { width }
      );

    doc.y = 172;

    sectionTitle(doc, 'Indicadores del mes');
    const boxGap = 10;
    const boxWidth = (width - boxGap * 3) / 4;
    const boxY = doc.y;
    drawKpiBox(doc, left, boxY, boxWidth, 54, 'Ingresos', cop(data.summary.income.total), GREEN, GREEN_BG);
    drawKpiBox(doc, left + (boxWidth + boxGap), boxY, boxWidth, 54, 'Gastos', cop(data.summary.expenses.total), RED, RED_BG);
    drawKpiBox(
      doc,
      left + (boxWidth + boxGap) * 2,
      boxY,
      boxWidth,
      54,
      'Utilidad neta',
      cop(data.summary.net),
      data.summary.net >= 0 ? GREEN : RED,
      data.summary.net >= 0 ? GREEN_BG : RED_BG
    );
    drawKpiBox(
      doc,
      left + (boxWidth + boxGap) * 3,
      boxY,
      boxWidth,
      54,
      'Mora pendiente',
      cop(data.summary.pendingDebt),
      data.summary.pendingDebt > 0 ? RED : GREEN,
      data.summary.pendingDebt > 0 ? RED_BG : GREEN_BG
    );

    doc.y = boxY + 66;

    const secondRowY = doc.y;
    drawKpiBox(
      doc,
      left,
      secondRowY,
      (width - boxGap * 2) / 3,
      48,
      'Renta esperada',
      cop(data.summary.expectedRent),
      SLATE_900,
      SLATE_100
    );
    drawKpiBox(
      doc,
      left + (width - boxGap * 2) / 3 + boxGap,
      secondRowY,
      (width - boxGap * 2) / 3,
      48,
      'Recaudo',
      pct(data.summary.collectionRatePct),
      SLATE_900,
      SLATE_100
    );
    drawKpiBox(
      doc,
      left + ((width - boxGap * 2) / 3 + boxGap) * 2,
      secondRowY,
      (width - boxGap * 2) / 3,
      48,
      'Vehículos (asignados / total)',
      `${data.summary.vehicles.assigned} / ${data.summary.vehicles.total}`,
      SLATE_900,
      SLATE_100
    );

    doc.y += 62;

    const incomeLine = `Renta ${cop(data.summary.income.renta)} · Abonos ${cop(
      data.summary.income.abonos
    )} · Otros ${cop(data.summary.income.other)}`;
    doc.fillColor(SLATE_500).font('Helvetica').fontSize(8).text(incomeLine, left, doc.y, { width });
    doc.y += 14;

    /* ------------------ Rentabilidad por vehículo ------------------ */
    sectionTitle(doc, 'Rentabilidad por vehículo');
    drawTable(doc, {
      headers: ['Placa', 'Conductor', 'Ingresos', 'Gastos', 'Neto', 'Margen', 'Costo/km'],
      widths: [62, 110, 70, 70, 70, 45, 62],
      align: ['left', 'left', 'right', 'right', 'right', 'right', 'right'],
      rows: data.vehicles.map((vehicle) => [
        vehicle.licensePlate,
        vehicle.driverName || 'Sin conductor',
        cop(vehicle.income.total),
        cop(vehicle.expenses.total),
        cop(vehicle.net),
        pct(vehicle.marginPct),
        vehicle.costPerKm === null ? '—' : cop(vehicle.costPerKm),
      ]),
      rowColors: data.vehicles.map((vehicle) => (vehicle.netNegative ? RED_BG : null)),
    });

    if (data.vehicles.length === 0) {
      doc.fillColor(SLATE_500).fontSize(9).text('Sin vehículos activos en el período.', left);
      doc.moveDown();
    }

    /* ------------------ Comportamiento conductores ------------------ */
    sectionTitle(doc, 'Comportamiento de conductores', 'Semana de cobro = martes a lunes (Bogotá)');
    drawTable(doc, {
      headers: ['Conductor', 'Semanas C / P / S', 'Cumplimiento', 'Abonos', 'Deuda pendiente', 'Score'],
      widths: [118, 100, 70, 75, 85, 62],
      align: ['left', 'center', 'right', 'right', 'right', 'center'],
      rows: data.drivers.map((driver) => [
        driver.driverName,
        `${driver.weeks.full} / ${driver.weeks.partial} / ${driver.weeks.unpaid}`,
        pct(driver.compliancePct),
        cop(driver.arrearPayments.amount),
        cop(driver.currentPendingDebt),
        `${driver.score} · ${driver.label}`,
      ]),
      rowColors: data.drivers.map((driver) =>
        driver.label === 'Riesgo' ? RED_BG : driver.label === 'Excelente' ? GREEN_BG : null
      ),
    });

    if (data.drivers.length === 0) {
      doc.fillColor(SLATE_500).fontSize(9).text('Sin conductores con actividad en el período.', left);
      doc.moveDown();
    }

    /* ---------------------- Semana a semana ---------------------- */
    const driversWithWeeks = data.drivers.filter((driver) => driver.weekDetails.length > 0);
    if (driversWithWeeks.length > 0) {
      sectionTitle(doc, 'Detalle semana a semana', 'C = completa · P = parcial · S = sin pago');
      for (const driver of driversWithWeeks) {
        const weeks = driver.weekDetails;
        const cellWidth = Math.min(86, width / Math.max(1, weeks.length));
        const blockHeight = 34;
        ensureSpace(doc, blockHeight + 20);

        doc.fillColor(SLATE_900).font('Helvetica-Bold').fontSize(8.5).text(driver.driverName, left, doc.y);
        doc.fillColor(SLATE_500).font('Helvetica').fontSize(7).text(
          `${driver.vehiclePlates.join(', ') || 'Sin vehículo'} · Score ${driver.score} (${driver.label})`,
          left,
          doc.y + 1
        );
        doc.y += 13;

        const gridY = doc.y;
        weeks.forEach((week, index) => {
          const x = left + index * cellWidth;
          doc.save();
          doc.rect(x, gridY, cellWidth - 3, 28).fill(statusBg(week.status));
          doc.restore();
          doc
            .fillColor(statusColor(week.status))
            .font('Helvetica-Bold')
            .fontSize(6.5)
            .text(week.weekStart.slice(0, 5), x + 3, gridY + 4, {
              width: cellWidth - 9,
              align: 'center',
            });
          doc
            .fillColor(statusColor(week.status))
            .font('Helvetica')
            .fontSize(6)
            .text(`${statusLabel(week.status)}`, x + 3, gridY + 14, {
              width: cellWidth - 9,
              align: 'center',
            });
        });
        doc.y = gridY + 34;
      }
      doc.y += 4;
    }

    /* ------------------------- Mantenimiento ------------------------- */
    sectionTitle(doc, 'Mantenimiento y desgaste');
    const fleetMaintenance = data.maintenance.fleet;

    if (fleetMaintenance.topComponents.length > 0) {
      drawTable(doc, {
        headers: ['Componente', 'Eventos', 'Monto'],
        widths: [230, 90, 120],
        align: ['left', 'center', 'right'],
        rows: fleetMaintenance.topComponents.map((component) => [
          component.component.replace(/_/g, ' '),
          String(component.count),
          cop(component.amount),
        ]),
      });
    }

    if (fleetMaintenance.topDescriptions.length > 0) {
      doc.fillColor(SLATE_700).font('Helvetica-Bold').fontSize(9).text('Repuestos más consumidos', left);
      doc.moveDown(0.25);
      fleetMaintenance.topDescriptions.slice(0, 5).forEach((description) => {
        ensureSpace(doc, 12);
        doc
          .fillColor(SLATE_700)
          .font('Helvetica')
          .fontSize(8)
          .text(`• ${description.description} — ${description.count} evento(s) · ${cop(description.amount)}`, left, doc.y, {
            width,
          });
      });
      doc.moveDown(0.6);
    }

    const repeatedRepairs = data.maintenance.vehicles
      .flatMap((vehicle) =>
        vehicle.repeatedComponents.map((repeat) => ({
          licensePlate: vehicle.licensePlate,
          ...repeat,
        }))
      )
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    if (repeatedRepairs.length > 0) {
      doc.fillColor(SLATE_700).font('Helvetica-Bold').fontSize(9).text('Reparaciones repetidas', left);
      doc.moveDown(0.25);
      drawTable(doc, {
        headers: ['Placa', 'Componente', 'Eventos', 'Días entre eventos', 'Km entre eventos', 'Monto'],
        widths: [58, 130, 50, 85, 90, 75],
        align: ['left', 'left', 'center', 'center', 'center', 'right'],
        rows: repeatedRepairs.map((repair) => [
          repair.licensePlate,
          repair.component.replace(/_/g, ' '),
          String(repair.count),
          String(repair.daysBetween),
          repair.kmBetween === null ? '—' : repair.kmBetween.toLocaleString('es-CO'),
          cop(repair.amount),
        ]),
      });
    }

    if (data.maintenance.drivers.length > 0) {
      doc.fillColor(SLATE_700).font('Helvetica-Bold').fontSize(9).text('Desgaste por conductor', left);
      doc.moveDown(0.25);
      drawTable(doc, {
        headers: ['Conductor', 'Semanas', 'Km', 'Gasto total', 'Gasto/semana', 'Gasto/km', 'Índice', 'Nivel'],
        widths: [95, 45, 50, 70, 72, 65, 48, 55],
        align: ['left', 'center', 'right', 'right', 'right', 'right', 'center', 'center'],
        rows: data.maintenance.drivers.map((driver) => [
          driver.driverName,
          String(driver.weeksAssigned),
          driver.km.toLocaleString('es-CO'),
          cop(driver.totalSpend),
          cop(driver.spendPerWeek),
          driver.spendPerKm === null ? '—' : cop(driver.spendPerKm),
          driver.wearIndex === null ? '—' : driver.wearIndex.toFixed(2),
          driver.wearLabel,
        ]),
      });
    }

    /* ------------------------ Detalle de pagos ------------------------ */
    sectionTitle(doc, 'Detalle de pagos por conductor');
    if (data.paymentsByDriver.length === 0) {
      doc.fillColor(SLATE_500).fontSize(9).text('Sin pagos registrados en el período.', left);
      doc.moveDown();
    }

    for (const driver of data.paymentsByDriver) {
      ensureSpace(doc, 52);
      doc
        .fillColor(SLATE_900)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(
          `${driver.driverName} · Total ${cop(driver.total)} (renta ${cop(driver.renta)} · abonos ${cop(
            driver.abonos
          )} · otros ${cop(driver.other)})`,
          left,
          doc.y,
          { width }
        );
      doc.moveDown(0.3);
      drawTable(doc, {
        headers: ['Fecha', 'Tipo', 'Vehículo', 'Monto', 'Mora generada'],
        widths: [80, 105, 85, 95, 120],
        align: ['left', 'left', 'left', 'right', 'right'],
        rows: driver.payments.map((payment) => [
          formatDate(payment.date),
          typeLabel(payment.type),
          payment.vehiclePlate,
          cop(payment.amount),
          payment.arrearGenerated > 0 ? cop(payment.arrearGenerated) : '—',
        ]),
      });
    }

    /* --------------------------- Footer --------------------------- */
    const pageRange = doc.bufferedPageRange();
    for (let index = pageRange.start; index < pageRange.start + pageRange.count; index += 1) {
      doc.switchToPage(index);
      // El footer se escribe debajo del margen inferior: se anula temporalmente
      // para que pdfkit no agregue una página automática.
      const bottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc
        .fillColor('#94a3b8')
        .font('Helvetica')
        .fontSize(7)
        .text(
          `FleetMaster Hub · Extracto mensual ${data.month} · Página ${index + 1} de ${pageRange.count}`,
          doc.page.margins.left,
          doc.page.height - 24,
          { width: contentWidth(doc), align: 'center', lineBreak: false }
        );
      doc.page.margins.bottom = bottomMargin;
    }

    doc.end();
  });
