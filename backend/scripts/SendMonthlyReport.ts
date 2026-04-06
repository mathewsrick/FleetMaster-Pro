#!/usr/bin/env tsx
/**
 * Script para enviar el reporte mensual de flota manualmente (prueba/preview).
 *
 * Uso:
 *   pnpm send:monthly-report
 *
 * Opcionalmente filtra por email de usuario:
 *   pnpm send:monthly-report -- --email=usuario@ejemplo.com
 */

import 'dotenv/config';
import { generateAndSendMonthlyReports } from '../src/modules/reports/monthly-report.service.js';

const emailFilter = process.argv
  .find((a) => a.startsWith('--email='))
  ?.split('=')[1];

if (emailFilter) {
  console.log(`📧 Filtrando envío solo para: ${emailFilter}`);
}

(async () => {
  try {
    await generateAndSendMonthlyReports(emailFilter);
    console.log('✅ Proceso finalizado.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al enviar reportes:', err);
    process.exit(1);
  }
})();
