#!/usr/bin/env tsx
/**
 * Script interactivo para enviar previews de todos los templates de correo.
 *
 * Uso:
 *   pnpm preview:emails
 */

import 'dotenv/config';
import * as readline from 'readline';
import * as emailService from '../src/shared/email.service.js';

// ─────────────────────────────────────────────────────────────
// Datos de prueba reutilizables
// ─────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString();
const IN_5_DAYS = new Date(Date.now() + 5 * 86_400_000).toISOString();
const EXPIRED_3_DAYS = new Date(Date.now() - 3 * 86_400_000).toISOString();

const MOCK_VEHICLE_DETAILS = [
  {
    licensePlate: 'ABC123',
    model: 'Chevrolet Sail (2022)',
    driverName: 'Carlos Ramírez',
    rentaValue: 1_200_000,
    income: 1_200_000,
    expenses: 150_000,
    pendingDebt: 0,
  },
  {
    licensePlate: 'XYZ789',
    model: 'Kia Picanto (2021)',
    driverName: 'Sin conductor',
    rentaValue: 1_000_000,
    income: 500_000,
    expenses: 80_000,
    pendingDebt: 500_000,
  },
  {
    licensePlate: 'DEF456',
    model: 'Renault Logan (2023)',
    driverName: 'María González',
    rentaValue: 1_100_000,
    income: 1_100_000,
    expenses: 200_000,
    pendingDebt: 0,
  },
];

// ─────────────────────────────────────────────────────────────
// Definición de escenarios
// ─────────────────────────────────────────────────────────────
interface Scenario {
  label: string;
  subject: string;
  html: () => string;
}

const scenarios = (to: string): Scenario[] => [
  {
    label: 'Bienvenida al usuario (confirmación de cuenta)',
    subject: '¡Bienvenido a FleetMaster Hub! Confirma tu cuenta',
    html: () => emailService.templates.welcome('Juan Pérez', 'TOKEN-DEMO-123456'),
  },
  {
    label: 'Bienvenida al conductor registrado',
    subject: '¡Bienvenido al Equipo, Carlos! – FleetMaster Hub',
    html: () => emailService.templates.driverWelcome('Carlos Ramírez'),
  },
  {
    label: 'Asignación de vehículo a conductor',
    subject: 'Nuevo Vehículo Asignado – FleetMaster Hub',
    html: () =>
      emailService.templates.vehicleAssignment('Carlos Ramírez', {
        licensePlate: 'ABC 123',
        model: 'Chevrolet Sail',
        year: 2022,
      }),
  },
  {
    label: 'Notificación de nuevo usuario al administrador',
    subject: '🆕 Nuevo Usuario Registrado – FleetMaster Hub',
    html: () =>
      emailService.templates.adminNewUser({
        username: 'juanperez',
        email: to,
        date: TODAY,
      }),
  },
  {
    label: 'Recuperación de contraseña (código OTP)',
    subject: '🔐 Recuperar acceso – FleetMaster Hub',
    html: () => emailService.templates.passwordReset('847291'),
  },
  {
    label: 'Comprobante de pago – sin moras pendientes',
    subject: '✅ Comprobante de Pago – FleetMaster Hub',
    html: () =>
      emailService.templates.paymentConfirmation(
        1_200_000,
        TODAY,
        'renta',
        0,
        0,
        [],
      ),
  },
  {
    label: 'Comprobante de pago – con mora generada y deuda acumulada',
    subject: '✅ Comprobante de Pago (con moras) – FleetMaster Hub',
    html: () =>
      emailService.templates.paymentConfirmation(
        800_000,
        TODAY,
        'renta',
        400_000,
        900_000,
        [
          { dueDate: EXPIRED_3_DAYS, amountOwed: 400_000 },
          { dueDate: new Date(Date.now() - 10 * 86_400_000).toISOString(), amountOwed: 500_000 },
        ],
      ),
  },
  {
    label: 'Comprobante de pago – abono a mora',
    subject: '✅ Comprobante de Abono a Mora – FleetMaster Hub',
    html: () =>
      emailService.templates.paymentConfirmation(
        300_000,
        TODAY,
        'mora',
        0,
        200_000,
        [{ dueDate: EXPIRED_3_DAYS, amountOwed: 200_000 }],
      ),
  },
  {
    label: 'Pago de suscripción fallido (Wompi rechazado)',
    subject: '❌ Pago No Procesado – FleetMaster Hub',
    html: () =>
      emailService.templates.paymentFailed({
        plan: 'pro',
        reference: 'WOMPI-REF-987654321',
      }),
  },
  {
    label: 'Notificación al admin: nuevo pago de suscripción recibido',
    subject: '💳 Nuevo Pago de Suscripción – FleetMaster Hub',
    html: () =>
      emailService.templates.adminPaymentNotification({
        user: 'juanperez',
        email: to,
        plan: 'pro',
        amount: 89_900,
        reference: 'WOMPI-REF-123456789',
        date: TODAY,
      }),
  },
  {
    label: 'Notificación SuperAdmin: suscripción activada',
    subject: '🔔 [SUPERADMIN] Nueva Suscripción Activada – FleetMaster Hub',
    html: () =>
      emailService.templates.superAdminSubscriptionNotification({
        user: 'juanperez',
        email: to,
        plan: 'enterprise',
        amount: 149_900,
        reference: 'WOMPI-REF-SA-999888777',
        date: TODAY,
        duration: 'mensual',
      }),
  },
  {
    label: 'Alerta de documento de vehículo – próximo a vencer (5 días)',
    subject: '⚠️ Alerta: SOAT próximo a vencer – FleetMaster Hub',
    html: () =>
      emailService.templates.documentExpirationAlert({
        documentType: 'SOAT',
        entityName: 'ABC 123',
        daysRemaining: 5,
        expirationDate: IN_5_DAYS,
        isExpired: false,
      }),
  },
  {
    label: 'Alerta de documento de vehículo – VENCIDO (hace 3 días)',
    subject: '🚨 [URGENTE] Tecnomecánica VENCIDA – FleetMaster Hub',
    html: () =>
      emailService.templates.documentExpirationAlert({
        documentType: 'Tecnomecánica',
        entityName: 'XYZ 789',
        daysRemaining: -3,
        expirationDate: EXPIRED_3_DAYS,
        isExpired: true,
      }),
  },
  {
    label: 'Alerta de licencia del conductor – próxima a vencer (5 días)',
    subject: '⚠️ Tu licencia está por vencer – FleetMaster Hub',
    html: () =>
      emailService.templates.driverLicenseExpirationAlert({
        driverName: 'Carlos Ramírez',
        daysRemaining: 5,
        expirationDate: IN_5_DAYS,
        isExpired: false,
      }),
  },
  {
    label: 'Alerta de licencia del conductor – VENCIDA (hace 3 días)',
    subject: '🚨 [URGENTE] Tu licencia está VENCIDA – FleetMaster Hub',
    html: () =>
      emailService.templates.driverLicenseExpirationAlert({
        driverName: 'María González',
        daysRemaining: -3,
        expirationDate: EXPIRED_3_DAYS,
        isExpired: true,
      }),
  },
  {
    label: 'Alerta de suscripción por expirar',
    subject: '⏳ Tu plan está por vencer – FleetMaster Hub',
    html: () =>
      emailService.templates.subscriptionExpirationAlert({
        plan: 'pro',
        daysRemaining: 7,
        expirationDate: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      }),
  },
  {
    label: 'Reporte semanal Enterprise',
    subject: '📊 Reporte Semanal de Flota – FleetMaster Hub',
    html: () =>
      emailService.templates.weeklyEnterpriseReport({
        dateRange: '30/03/2026 - 05/04/2026',
        income: 3_600_000,
        expenses: 430_000,
        net: 3_170_000,
        totalDebt: 500_000,
        totalVehicles: 3,
        activeVehicles: 2,
      }),
  },
  {
    label: 'Reporte mensual de flota (extracto completo)',
    subject: '📋 Extracto Mensual de Flota – Marzo 2026 | FleetMaster Hub',
    html: () =>
      emailService.templates.monthlyFleetReport({
        username: 'juanperez',
        monthName: 'marzo de 2026',
        totalIncome: 3_800_000,
        totalExpenses: 430_000,
        net: 3_370_000,
        totalDebt: 500_000,
        totalVehicles: 3,
        activeVehicles: 2,
        vehicleDetails: MOCK_VEHICLE_DETAILS,
      }),
  },
  {
    label: 'Mensaje de contacto desde el landing',
    subject: '📩 Nuevo Mensaje de Contacto – FleetMaster Hub',
    html: () =>
      emailService.templates.contactNotification(
        'Laura Torres',
        to,
        '¡Hola! Quiero saber más sobre los planes de FleetMaster Hub para mi empresa de transporte.',
      ),
  },
];

// ─────────────────────────────────────────────────────────────
// Helpers readline
// ─────────────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string): Promise<string> =>
  new Promise((resolve) => rl.question(q, resolve));

const print = (msg: string) => process.stdout.write(msg + '\n');

// ─────────────────────────────────────────────────────────────
// Menú principal
// ─────────────────────────────────────────────────────────────
const showMenu = (list: Scenario[]) => {
  print('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  print('  📬  PREVIEW DE CORREOS – FleetMaster Hub');
  print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  list.forEach((s, i) => {
    const idx = String(i + 1).padStart(2, ' ');
    print(`  ${idx}. ${s.label}`);
  });
  print('');
  print('   A. Enviar TODOS los escenarios');
  print('   Q. Salir');
  print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
};

const sendScenario = async (to: string, scenario: Scenario) => {
  process.stdout.write(`  → Enviando: "${scenario.label}"… `);
  const ok = await emailService.sendEmail({
    to,
    subject: scenario.subject,
    html: scenario.html(),
  });
  print(ok ? '✅ Enviado' : '❌ Error');
};

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
(async () => {
  print('\n  🚀 Script de preview de correos iniciado.\n');

  const to = (await ask('  📧 Ingresa el correo destino: ')).trim();
  if (!to || !to.includes('@')) {
    print('  ❌ Correo inválido. Saliendo.');
    rl.close();
    process.exit(1);
  }

  const list = scenarios(to);

  let exit = false;
  while (!exit) {
    showMenu(list);
    const input = (await ask('  ¿Qué escenario deseas enviar? ')).trim().toUpperCase();

    if (input === 'Q') {
      exit = true;
      print('\n  👋 Saliendo. ¡Hasta pronto!\n');
    } else if (input === 'A') {
      print(`\n  📨 Enviando todos los escenarios a ${to}…\n`);
      for (const scenario of list) {
        await sendScenario(to, scenario);
      }
      print('\n  ✅ Todos los correos enviados.\n');
    } else {
      const idx = parseInt(input, 10);
      if (!Number.isNaN(idx) && idx >= 1 && idx <= list.length) {
        print('');
        await sendScenario(to, list[idx - 1]);
        print('');
      } else {
        print('\n  ⚠️  Opción no válida. Intenta de nuevo.\n');
      }
    }
  }

  rl.close();
  process.exit(0);
})();
