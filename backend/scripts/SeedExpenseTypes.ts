/**
 * Script para actualizar gastos existentes con tipos aleatorios para testing
 * Usage: tsx scripts/SeedExpenseTypes.ts
 */

import { prisma } from '../src/shared/db.js';

const expenseTypes = [
  'reparacion',
  'repuesto',
  'combustible',
  'mantenimiento',
  'seguro',
  'impuesto',
  'multa',
  'lavado',
  'otro'
];

async function seedExpenseTypes() {
  try {
    console.log('🔄 Actualizando gastos con tipos...');

    // Obtener todos los gastos
    const expenses = await prisma.expense.findMany();

    console.log(`📊 Encontrados ${expenses.length} gastos`);

    // Actualizar cada gasto con un tipo aleatorio (si no tiene uno)
    let updated = 0;
    for (const expense of expenses) {
      const randomType = expenseTypes[Math.floor(Math.random() * expenseTypes.length)];
      
      await prisma.expense.update({
        where: { id: expense.id },
        data: { type: randomType as any }
      });
      
      updated++;
      if (updated % 10 === 0) {
        console.log(`✅ Actualizados ${updated}/${expenses.length}...`);
      }
    }

    console.log(`\n✨ Proceso completado! ${updated} gastos actualizados`);
    console.log('\nDistribución de tipos:');
    
    // Mostrar estadísticas
    for (const type of expenseTypes) {
      const count = await prisma.expense.count({
        where: { type: type as any }
      });
      console.log(`  - ${type}: ${count}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedExpenseTypes();
