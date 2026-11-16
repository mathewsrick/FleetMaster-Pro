#!/usr/bin/env tsx
/**
 * Script para enviar el reporte mensual de flota manualmente (prueba/preview).
 *
 * Uso:
 *   pnpm send:monthly-report
 *   pnpm send:monthly-report -- --email=usuario@ejemplo.com
 *   pnpm send:monthly-report -- --dry-run --email=usuario@ejemplo.com --month=2026-10
 *   pnpm send:monthly-report -- --force --month=2026-10
 *
 * Flags:
 *   --dry-run       Genera PDF + HTML en backend/tmp/ sin enviar nada.
 *   --email=...     Filtra el envío a un único usuario.
 *   --month=YYYY-MM Fuerza el período (por defecto, mes anterior).
 *   --force         Reenvía aunque exista un ReportRun para ese período.
 */

import 'dotenv/config';
import { generateAndSendMonthlyReports } from '../src/modules/reports/monthly-report.service.js';

const args = process.argv.slice(2);
const getArg = (name: string) =>
  args
    .find((arg) => arg.startsWith(`--${name}=`))
    ?.split('=')
    .slice(1)
    .join('=');

const emailFilter = getArg('email');
const month = getArg('month');
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

if (month && !/^\d{4}-\d{2}$/.test(month)) {
  console.error('❌ Formato de mes inválido. Use --month=YYYY-MM');
  process.exit(1);
}

if (emailFilter) {
  console.log(`📧 Filtrando envío solo para: ${emailFilter}`);
}
if (month) {
  console.log(`📅 Período forzado: ${month}`);
}
if (dryRun) {
  console.log('🧪 Modo dry-run: no se enviarán correos.');
}
if (force) {
  console.log('♻️  Force: se ignora el registro de ReportRun.');
}

(async () => {
  try {
    await generateAndSendMonthlyReports({ emailFilter, month, dryRun, force });
    console.log('✅ Proceso finalizado.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al enviar reportes:', err);
    process.exit(1);
  }
})();
