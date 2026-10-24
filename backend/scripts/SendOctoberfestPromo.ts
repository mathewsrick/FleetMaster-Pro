#!/usr/bin/env tsx
/**
 * Script para enviar el correo promocional de Oktoberfest a todos los usuarios
 * con role USER (incluidos los no confirmados).
 *
 * Uso:
 *   npm run send:octoberfest -- --dry-run
 *   npm run send:octoberfest -- --email=usuario@ejemplo.com
 */

import 'dotenv/config';
import { prisma } from '../src/shared/db.js';
import * as emailService from '../src/shared/email.service.js';

const args = process.argv.slice(2);
const emailFilter = args
  .find((a) => a.startsWith('--email='))
  ?.split('=')[1];
const dryRun = args.includes('--dry-run');

const SUBJECT = '🍺 Oktoberfest de locura: planes desde $15.900/mes – FleetMaster Hub';
const DELAY_MS = 1500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  try {
    if (emailFilter) {
      console.log(`📧 Filtrando envío solo para: ${emailFilter}`);
    }
    if (dryRun) {
      console.log('🧪 Modo DRY-RUN: no se enviará ningún correo.');
    }

    const recipients = await prisma.user.findMany({
      where: {
        role: 'USER',
        ...(emailFilter ? { email: emailFilter } : {}),
      },
      select: { email: true, username: true },
    });

    console.log(`\n👥 Destinatarios encontrados: ${recipients.length}`);
    recipients.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.username} <${user.email}>`);
    });

    if (dryRun) {
      console.log(`\n✅ DRY-RUN finalizado. Total: ${recipients.length} destinatarios. No se envió ningún correo.\n`);
      await prisma.$disconnect();
      process.exit(0);
    }

    let sent = 0;
    let failed = 0;

    console.log('');

    for (const user of recipients) {
      const ok = await emailService.sendEmail({
        to: user.email,
        subject: SUBJECT,
        html: emailService.templates.octoberfestPromo({ username: user.username }),
      });

      if (ok) {
        sent++;
        console.log(`✅ Enviado: ${user.email}`);
      } else {
        failed++;
        console.log(`❌ Falló: ${user.email}`);
      }

      if (user !== recipients[recipients.length - 1]) {
        await sleep(DELAY_MS);
      }
    }

    console.log(`\n📊 Resumen: ${sent} enviados, ${failed} fallidos, ${recipients.length} total.\n`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fatal al enviar la promo de Oktoberfest:', err);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
})();
